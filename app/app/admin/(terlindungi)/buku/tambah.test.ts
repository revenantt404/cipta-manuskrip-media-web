import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { execute, query, closePool } from "@/lib/db/query";
import { createBookAction } from "./actions";
import { STATE_BUKU_AWAL } from "./form-state";
import { simpanBukuBaru } from "@/lib/books/manage";

const DIR_UJI = path.join(process.cwd(), "public", "covers-uji-buku");

const TEKS_SAH = {
  title: "Buku Uji Simpan",
  author: "Penulis Uji",
  synopsis: "Sinopsis yang cukup untuk buku terbit.",
  publisherInfo: "CV Cipta Manuskrip Media",
  bookInfo: "",
  status: "published",
  estimatedRelease: "",
};

async function gambar(warna: { r: number; g: number; b: number }): Promise<Buffer> {
  return sharp({
    create: { width: 200, height: 300, channels: 3, background: warna },
  })
    .jpeg()
    .toBuffer();
}

function formBuku(
  teks: Partial<typeof TEKS_SAH>,
  sampul?: { isi: Buffer | string; nama: string; tipe: string }
): FormData {
  const data = new FormData();
  for (const [kunci, nilai] of Object.entries({ ...TEKS_SAH, ...teks })) {
    data.set(kunci, nilai);
  }
  if (sampul === undefined) {
    // Inilah yang dikirim browser ketika admin tidak memilih berkas: sebuah
    // `File` kosong, bukan field yang hilang.
    data.set("cover", new File([], "", { type: "application/octet-stream" }));
  } else {
    // `Buffer` bertipe `Uint8Array<ArrayBufferLike>`; `File` menuntut
    // `ArrayBuffer` yang pasti (bukan `SharedArrayBuffer`). Salinan ini
    // membuat tipenya tegas.
    const isi =
      typeof sampul.isi === "string"
        ? sampul.isi
        : new Uint8Array(sampul.isi).buffer;
    data.set("cover", new File([isi], sampul.nama, { type: sampul.tipe }));
  }
  return data;
}

async function berkasTersimpan(): Promise<string[]> {
  return existsSync(DIR_UJI) ? readdirSync(DIR_UJI) : [];
}

async function jumlahBuku(): Promise<number> {
  const baris = await query<{ jumlah: number }>("SELECT COUNT(*) AS jumlah FROM books");
  return Number(baris[0].jumlah);
}

async function bersihkan() {
  await execute("DELETE FROM books");
  rmSync(DIR_UJI, { recursive: true, force: true });
  mkdirSync(DIR_UJI, { recursive: true });
}

describe("simpanBukuBaru", () => {
  beforeEach(async () => {
    await bersihkan();
    // `COVER_DIR` diarahkan ke folder uji supaya berkas yang dibuat tes tidak
    // pernah bercampur dengan sampul asli di public/covers.
    process.env.COVER_DIR = "public/covers-uji-buku";
  });

  afterAll(async () => {
    await bersihkan();
    rmSync(DIR_UJI, { recursive: true, force: true });
    delete process.env.COVER_DIR;
    await closePool();
  });

  it("menolak isian teks yang kurang sebelum menyentuh disk", async () => {
    const hasil = await simpanBukuBaru(
      formBuku({ title: "   " }, { isi: await gambar({ r: 1, g: 2, b: 3 }), nama: "a.jpg", tipe: "image/jpeg" })
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.errors.title).toBeDefined();

    // Urutan langkahnya yang diuji di sini: isian dinilai lebih dahulu,
    // sehingga berkas sampul yang valid tidak perlu ditulis lalu dibuang.
    expect(await berkasTersimpan()).toHaveLength(0);
  });

  it("melaporkan seluruh kolom yang kurang dalam satu kali kirim", async () => {
    const hasil = await simpanBukuBaru(
      formBuku(
        { title: "", author: "" },
        { isi: await gambar({ r: 1, g: 2, b: 3 }), nama: "a.jpg", tipe: "image/jpeg" }
      )
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.errors.title).toBeDefined();
    expect(hasil.errors.author).toBeDefined();
  });

  it("menolak buku yang dikirim tanpa sampul", async () => {
    const hasil = await simpanBukuBaru(formBuku({}));

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.errors.coverPath).toBeDefined();
    expect(await jumlahBuku()).toBe(0);
  });

  it("menolak berkas yang bukan gambar meski dinamai .jpg", async () => {
    const hasil = await simpanBukuBaru(
      formBuku({}, { isi: "<html>bukan gambar</html>", nama: "sampul.jpg", tipe: "image/jpeg" })
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.errors.coverPath).toBeDefined();
    expect(await jumlahBuku()).toBe(0);
    expect(await berkasTersimpan()).toHaveLength(0);
  });

  it("menyimpan buku beserta berkas sampulnya", async () => {
    const hasil = await simpanBukuBaru(
      formBuku({}, { isi: await gambar({ r: 10, g: 90, b: 40 }), nama: "sampul.jpg", tipe: "image/jpeg" })
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(hasil.book.title).toBe(TEKS_SAH.title);
    expect(hasil.book.slug).toBe("buku-uji-simpan");
    expect(hasil.book.status).toBe("published");
    // Path yang disimpan adalah path relatif, bukan URL — itu yang membuat
    // pindah domain tidak memerlukan perubahan data.
    expect(hasil.book.coverPath).toMatch(/^covers-uji-buku\/[0-9a-f-]{36}\.webp$/);
    expect(existsSync(path.join(process.cwd(), "public", hasil.book.coverPath))).toBe(true);
    expect(await jumlahBuku()).toBe(1);
  });

  it("mengisi penerbit dengan nama perusahaan bila kolomnya dikosongkan", async () => {
    const hasil = await simpanBukuBaru(
      formBuku(
        { publisherInfo: "  " },
        { isi: await gambar({ r: 3, g: 3, b: 3 }), nama: "sampul.jpg", tipe: "image/jpeg" }
      )
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.book.publisherInfo).toBe("CV Cipta Manuskrip Media");
  });

  /**
   * Inti Task 6: kompensasi berkas.
   *
   * Judul yang sama menghasilkan slug yang sama, dan database menolaknya.
   * Yang penting bukan pesannya, melainkan bahwa sampul yang sudah ditulis
   * ke disk ikut dibuang — tanpa itu, setiap kali admin salah mengisi form
   * akan tertinggal satu berkas yatim yang tidak dirujuk baris mana pun.
   */
  it("menghapus sampul baru dan mempertahankan sampul lama saat penyimpanan gagal", async () => {
    const pertama = await simpanBukuBaru(
      formBuku({}, { isi: await gambar({ r: 200, g: 0, b: 0 }), nama: "satu.jpg", tipe: "image/jpeg" })
    );
    expect(pertama.ok).toBe(true);
    if (!pertama.ok) return;

    const kedua = await simpanBukuBaru(
      formBuku({}, { isi: await gambar({ r: 0, g: 0, b: 200 }), nama: "dua.jpg", tipe: "image/jpeg" })
    );

    expect(kedua.ok).toBe(false);
    if (kedua.ok) return;
    expect(Object.keys(kedua.errors).length).toBeGreaterThan(0);

    // Satu baris saja, dan hanya sampul buku pertama yang tersisa.
    expect(await jumlahBuku()).toBe(1);
    expect(await berkasTersimpan()).toHaveLength(1);
    expect(existsSync(path.join(process.cwd(), "public", pertama.book.coverPath))).toBe(true);
  });
});

/**
 * Penjagaan sesi.
 *
 * Batas yang jujur: `createBookAction` memanggil `requireAdmin`, yang membaca
 * cookie lewat `cookies()` dari `next/headers`. Di luar permintaan HTTP fungsi
 * itu melempar — jadi yang bisa dibuktikan di sini adalah **urutan**, bukan
 * peralihannya: panggilan tanpa sesi berhenti sebelum satu baris pun ditulis.
 * Peralihan ke halaman login diuji sebagai acceptance test HTTP di Task 8.
 */
describe("createBookAction tanpa sesi", () => {
  beforeEach(bersihkan);

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("berhenti sebelum menulis apa pun ke database", async () => {
    const sebelum = await jumlahBuku();

    await expect(
      createBookAction(
        STATE_BUKU_AWAL,
        formBuku({}, { isi: await gambar({ r: 5, g: 5, b: 5 }), nama: "s.jpg", tipe: "image/jpeg" })
      )
    ).rejects.toThrow();

    expect(await jumlahBuku()).toBe(sebelum);
  });
});
