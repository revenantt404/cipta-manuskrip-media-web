import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { existsSync, rmSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { processAndSaveCover, deleteCoverFile } from "./cover";
import { COVER_DIR } from "./path";

/**
 * Folder uji berada di luar `public/`, sama seperti folder sampul sungguhan.
 *
 * Bawaannya sudah di `storage/covers` sejak perbaikan Task 8: berkas di
 * `public/` hanya tersaji bila sudah ada saat `next start` menyala, sehingga
 * sampul yang baru diunggah tidak akan pernah tampil dari sana.
 */
const DIR_UJI = path.join(process.cwd(), "storage", "covers-uji");

async function gambar(
  lebar: number,
  tinggi: number,
  format: "jpeg" | "png" | "webp" = "jpeg"
): Promise<Buffer> {
  const dasar = sharp({
    create: {
      width: lebar,
      height: tinggi,
      channels: 3,
      background: { r: 200, g: 100, b: 50 },
    },
  });
  return format === "jpeg" ? dasar.jpeg().toBuffer() : dasar.png().toBuffer();
}

async function metadata(buffer: Buffer) {
  return sharp(buffer).metadata();
}

/**
 * Membaca sampul yang tersimpan sebagai buffer, bukan lewat `sharp(path)`.
 *
 * Dua alasan. Pertama, inilah cara produksi membaca berkas — dari `FormData`
 * sebagai buffer — jadi tesnya menguji jalur yang sama. Kedua, `sharp(path)`
 * mengisi cache berkas libvips yang menahan handle terbuka, dan di Windows
 * itu membuat `rmSync` gagal dengan EBUSY saat folder dibersihkan antar tes.
 */
async function bacaSampul(coverPath: string): Promise<Buffer> {
  return readFile(path.join(DIR_UJI, path.basename(coverPath)));
}

describe("processAndSaveCover", () => {
  beforeEach(() => {
    rmSync(DIR_UJI, { recursive: true, force: true });
    mkdirSync(DIR_UJI, { recursive: true });
    process.env.COVER_DIR = "storage/covers-uji";
  });

  afterAll(() => {
    rmSync(DIR_UJI, { recursive: true, force: true });
    delete process.env.COVER_DIR;
  });

  it("membuat folder tujuan bila belum ada", async () => {
    rmSync(DIR_UJI, { recursive: true, force: true });

    const hasil = await processAndSaveCover(await gambar(100, 150), "image/jpeg");

    expect(hasil.ok).toBe(true);
    expect(existsSync(DIR_UJI)).toBe(true);
  });

  it("menyimpan sebagai WebP dengan nama acak, bukan nama dari pengunggah", async () => {
    const hasil = await processAndSaveCover(await gambar(100, 150), "image/jpeg");

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.coverPath).toMatch(new RegExp(`^${COVER_DIR}/[0-9a-f-]{36}\\.webp$`));
    expect(existsSync(path.join(DIR_UJI, path.basename(hasil.coverPath)))).toBe(true);
  });

  /**
   * Nama logis di database tidak boleh bergantung pada lokasi fisik folder.
   *
   * Di hosting `COVER_DIR` menunjuk ke luar folder aplikasi; kalau
   * `cover_path` ikut berubah mengikuti folder, pindah lingkungan akan
   * membuat semua baris lama menunjuk berkas yang tidak ada.
   */
  it("menyimpan nama logis yang sama meski lokasi fisik foldernya berbeda", async () => {
    const pertama = await processAndSaveCover(await gambar(100, 150), "image/jpeg");

    process.env.COVER_DIR = "storage/covers-uji-lain";
    const lainDir = path.join(process.cwd(), "storage", "covers-uji-lain");
    rmSync(lainDir, { recursive: true, force: true });

    try {
      const kedua = await processAndSaveCover(await gambar(100, 150), "image/jpeg");

      expect(pertama.ok && kedua.ok).toBe(true);
      if (!pertama.ok || !kedua.ok) return;

      const subfolder = (p: string) => p.slice(0, p.lastIndexOf("/"));
      expect(subfolder(kedua.coverPath)).toBe(subfolder(pertama.coverPath));
      expect(existsSync(path.join(lainDir, path.basename(kedua.coverPath)))).toBe(true);
    } finally {
      process.env.COVER_DIR = "storage/covers-uji";
      rmSync(lainDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    }
  });

  it("menerima JPEG, PNG, dan WebP", async () => {
    for (const format of ["jpeg", "png"] as const) {
      const hasil = await processAndSaveCover(await gambar(100, 150, format), `image/${format}`);
      expect(hasil.ok, `format ${format} seharusnya diterima`).toBe(true);
    }

    const webp = await sharp(await gambar(100, 150)).webp().toBuffer();
    expect((await processAndSaveCover(webp, "image/webp")).ok).toBe(true);
  });

  it("menolak berkas yang bukan gambar meski MIME-nya mengaku gambar", async () => {
    const bukanGambar = Buffer.from("<html><body>bukan gambar</body></html>");

    const hasil = await processAndSaveCover(bukanGambar, "image/jpeg");

    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toBeDefined();
  });

  it("menolak SVG yang menyamar sebagai gambar raster", async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'
    );

    expect((await processAndSaveCover(svg, "image/svg+xml")).ok).toBe(false);
    expect((await processAndSaveCover(svg, "image/png")).ok).toBe(false);
  });

  it("menolak MIME yang tidak diizinkan tanpa memproses berkasnya", async () => {
    const hasil = await processAndSaveCover(await gambar(100, 150), "application/pdf");

    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toContain("JPEG");
  });

  it("menolak berkas melebihi batas 5 MiB sebelum memproses", async () => {
    const terlaluBesar = Buffer.alloc(5 * 1024 * 1024 + 1);

    const hasil = await processAndSaveCover(terlaluBesar, "image/jpeg");

    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toContain("5 MB");
  });

  it("menolak gambar dengan jumlah piksel tidak wajar meski berkasnya kecil", async () => {
    // Berkas padat warna: hanya beberapa KB, tetapi 60 juta piksel. Inilah
    // bentuk serangan "decompression bomb" yang ukuran berkasnya tidak
    // menangkap — tanpa batas piksel, server kehabisan memori saat decode.
    const bom = await sharp({
      create: {
        width: 10000,
        height: 6000,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .jpeg({ quality: 10 })
      .toBuffer();

    expect(bom.length).toBeLessThan(5 * 1024 * 1024);

    const hasil = await processAndSaveCover(bom, "image/jpeg");

    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toContain("piksel");
  });

  it("memperkecil sisi terpanjang menjadi maksimal 1600px", async () => {
    const hasil = await processAndSaveCover(await gambar(3000, 2000), "image/jpeg");

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const keluaran = await metadata(await bacaSampul(hasil.coverPath));
    expect(keluaran.width).toBe(1600);
    expect(keluaran.height).toBeLessThanOrEqual(1600);
  });

  it("tidak memperbesar gambar yang lebih kecil dari 1600px", async () => {
    const hasil = await processAndSaveCover(await gambar(300, 450), "image/jpeg");

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const keluaran = await metadata(await bacaSampul(hasil.coverPath));
    expect(keluaran.width).toBe(300);
    expect(keluaran.height).toBe(450);
  });

  it("mempertahankan rasio gambar saat diperkecil", async () => {
    const hasil = await processAndSaveCover(await gambar(3200, 1600), "image/jpeg");

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const keluaran = await metadata(await bacaSampul(hasil.coverPath));
    expect(keluaran.width).toBe(1600);
    expect(keluaran.height).toBe(800);
  });

  it("menghasilkan nama berbeda untuk dua unggahan berkas yang sama", async () => {
    const berkas = await gambar(100, 150);

    const a = await processAndSaveCover(berkas, "image/jpeg");
    const b = await processAndSaveCover(berkas, "image/jpeg");

    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.coverPath).not.toBe(b.coverPath);
  });
});

describe("deleteCoverFile", () => {
  beforeEach(() => {
    rmSync(DIR_UJI, { recursive: true, force: true });
    mkdirSync(DIR_UJI, { recursive: true });
    process.env.COVER_DIR = "storage/covers-uji";
  });

  afterAll(() => {
    rmSync(DIR_UJI, { recursive: true, force: true });
    delete process.env.COVER_DIR;
  });

  it("menghapus berkas yang ada dan melaporkan berhasil", async () => {
    const disimpan = await processAndSaveCover(await gambar(100, 150), "image/jpeg");
    if (!disimpan.ok) throw new Error("gagal menyiapkan berkas");

    const penuh = path.join(DIR_UJI, path.basename(disimpan.coverPath));
    expect(existsSync(penuh)).toBe(true);

    expect(await deleteCoverFile(disimpan.coverPath)).toBe(true);
    expect(existsSync(penuh)).toBe(false);
  });

  it("melaporkan gagal ketika berkas sudah tidak ada, tanpa melempar", async () => {
    expect(await deleteCoverFile("covers-uji/tidak-ada.webp")).toBe(false);
  });

  it("menolak path yang mencoba keluar dari folder sampul", async () => {
    const berkasPenting = path.join(process.cwd(), "public", "penting.txt");
    const { writeFileSync } = await import("node:fs");
    writeFileSync(berkasPenting, "jangan dihapus");

    try {
      expect(await deleteCoverFile("../penting.txt")).toBe(false);
      expect(await deleteCoverFile("covers-uji/../../package.json")).toBe(false);
      expect(existsSync(berkasPenting)).toBe(true);
    } finally {
      rmSync(berkasPenting, { force: true });
    }
  });

  it("menolak path kosong", async () => {
    expect(await deleteCoverFile("")).toBe(false);
    expect(await deleteCoverFile("   ")).toBe(false);
  });
});
