import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { execute, closePool } from "@/lib/db/query";
import { getBookById } from "@/lib/books/repository";
import { simpanBukuBaru, perbaruiBuku, hapusBuku } from "@/lib/books/manage";
import { updateBookAction, deleteBookAction } from "./actions";
import { STATE_BUKU_AWAL, STATE_HAPUS_AWAL } from "./form-state";

/**
 * Direktori sampul khusus tes ini.
 *
 * Skenarionya menghapus berkas sebagai bagian dari perilaku yang diuji, jadi
 * `COVER_DIR` tidak boleh menunjuk folder sampul sungguhan.
 */
const DIR_UJI = path.join(process.cwd(), "storage", "covers-uji-edit");

const ID_TIDAK_ADA = "00000000-0000-0000-0000-000000000000";

const TEKS_SAH = {
  title: "Judul Buku",
  slug: "judul-buku",
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

function formBuku(teks: Partial<typeof TEKS_SAH>, sampul?: Buffer): FormData {
  const data = new FormData();
  for (const [kunci, nilai] of Object.entries({ ...TEKS_SAH, ...teks })) {
    data.set(kunci, nilai);
  }
  if (sampul === undefined) {
    // Bentuk yang dikirim browser ketika admin tidak memilih berkas baru.
    data.set("cover", new File([], "", { type: "application/octet-stream" }));
  } else {
    data.set("cover", new File([new Uint8Array(sampul).buffer], "sampul.jpg", { type: "image/jpeg" }));
  }
  return data;
}

/** Menyiapkan buku lewat jalur simpan yang sudah terbukti di Task 6. */
async function bukuBaru(judul: string, warna: { r: number; g: number; b: number }) {
  const hasil = await simpanBukuBaru(formBuku({ title: judul }, await gambar(warna)));
  if (!hasil.ok) throw new Error(`gagal menyiapkan buku "${judul}"`);

  // Judul di atas menentukan slug awal; tes yang butuh slug tertentu
  // menimpanya lewat form ubah.
  return hasil.book;
}

async function berkasTersimpan(): Promise<string[]> {
  return existsSync(DIR_UJI) ? readdirSync(DIR_UJI) : [];
}

function berkasAda(coverPath: string): boolean {
  return existsSync(path.join(DIR_UJI, path.basename(coverPath)));
}

async function bersihkan() {
  await execute("DELETE FROM books");
  rmSync(DIR_UJI, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  mkdirSync(DIR_UJI, { recursive: true });
}

describe("perbaruiBuku", () => {
  beforeEach(async () => {
    await bersihkan();
    process.env.COVER_DIR = "storage/covers-uji-edit";
  });

  afterAll(async () => {
    await bersihkan();
    rmSync(DIR_UJI, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    delete process.env.COVER_DIR;
    await closePool();
  });

  it("mempertahankan sampul lama ketika tidak ada berkas baru", async () => {
    const buku = await bukuBaru("Buku Lama", { r: 10, g: 20, b: 30 });

    const hasil = await perbaruiBuku(
      buku.id,
      formBuku({ title: "Buku Baru", slug: "buku-baru" })
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(hasil.book.title).toBe("Buku Baru");
    expect(hasil.book.slug).toBe("buku-baru");
    // Path lama tidak boleh berubah hanya karena admin menyunting teks.
    expect(hasil.book.coverPath).toBe(buku.coverPath);
    expect(berkasAda(buku.coverPath)).toBe(true);
    expect(await berkasTersimpan()).toHaveLength(1);

    // Slug lama dikembalikan supaya pemanggil bisa merevalidasi alamat yang
    // baru saja ditinggalkan.
    expect(hasil.slugLama).toBe(buku.slug);
  });

  it("menghapus sampul lama setelah sampul baru berhasil disimpan", async () => {
    const buku = await bukuBaru("Buku Ganti", { r: 100, g: 0, b: 0 });

    const hasil = await perbaruiBuku(
      buku.id,
      formBuku({ title: "Buku Ganti", slug: "buku-ganti" }, await gambar({ r: 0, g: 0, b: 100 }))
    );

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(hasil.book.coverPath).not.toBe(buku.coverPath);
    expect(berkasAda(hasil.book.coverPath)).toBe(true);
    // Sampul lama dibuang hanya setelah baris database menunjuk yang baru.
    expect(berkasAda(buku.coverPath)).toBe(false);
    expect(await berkasTersimpan()).toHaveLength(1);
  });

  /**
   * Inti kompensasi Task 7.
   *
   * Slug yang sudah dipakai buku lain adalah kegagalan database yang paling
   * mudah dipicu dan paling mungkin terjadi. Sampul baru sudah terlanjur
   * ditulis; ia harus dibuang lagi, dan sampul lama tidak boleh ikut hilang.
   */
  it("membuang sampul baru dan mempertahankan sampul lama ketika penyimpanan gagal", async () => {
    const bukuA = await bukuBaru("Buku A", { r: 200, g: 0, b: 0 });
    const bukuB = await bukuBaru("Buku B", { r: 0, g: 200, b: 0 });

    const hasil = await perbaruiBuku(
      bukuB.id,
      formBuku({ title: "Buku B", slug: "buku-a" }, await gambar({ r: 0, g: 0, b: 200 }))
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.errors.slug).toBeDefined();

    const sesudah = await getBookById(bukuB.id);
    expect(sesudah?.coverPath).toBe(bukuB.coverPath);
    expect(berkasAda(bukuB.coverPath)).toBe(true);
    expect(berkasAda(bukuA.coverPath)).toBe(true);
    // Dua buku, dua berkas: sampul baru yang gagal tidak tertinggal.
    expect(await berkasTersimpan()).toHaveLength(2);
  });

  it("menolak slug berformat salah sebelum berkas baru ditulis", async () => {
    const buku = await bukuBaru("Buku C", { r: 5, g: 5, b: 5 });

    const hasil = await perbaruiBuku(
      buku.id,
      formBuku({ title: "Buku C", slug: "Judul Baru!" }, await gambar({ r: 6, g: 6, b: 6 }))
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.errors.slug).toBeDefined();
    expect(await berkasTersimpan()).toHaveLength(1);
  });

  it("melaporkan buku yang tidak ada tanpa menyentuh disk", async () => {
    const hasil = await perbaruiBuku(
      ID_TIDAK_ADA,
      formBuku({}, await gambar({ r: 7, g: 7, b: 7 }))
    );

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.errors.form).toBeDefined();
    expect(await berkasTersimpan()).toHaveLength(0);
  });
});

describe("hapusBuku", () => {
  beforeEach(async () => {
    await bersihkan();
    process.env.COVER_DIR = "storage/covers-uji-edit";
  });

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("menghapus baris database dan berkas sampulnya", async () => {
    const buku = await bukuBaru("Buku Hapus", { r: 9, g: 9, b: 9 });

    const hasil = await hapusBuku(buku.id);

    expect(hasil.ok).toBe(true);
    expect(await getBookById(buku.id)).toBeNull();
    expect(berkasAda(buku.coverPath)).toBe(false);
    expect(await berkasTersimpan()).toHaveLength(0);
  });

  it("melaporkan buku yang tidak ada", async () => {
    const hasil = await hapusBuku(ID_TIDAK_ADA);

    expect(hasil.ok).toBe(false);
  });
});

/**
 * Penjagaan sesi, sama seperti di Task 6: `requireAdmin` membaca cookie
 * lewat `next/headers` dan melempar di luar permintaan HTTP. Yang dibuktikan
 * di sini adalah urutannya — tidak ada yang ditulis atau dihapus sebelum
 * sesi diperiksa. Peralihan ke halaman login diuji lewat HTTP di Task 8.
 */
describe("aksi edit dan hapus tanpa sesi", () => {
  beforeEach(async () => {
    await bersihkan();
    process.env.COVER_DIR = "storage/covers-uji-edit";
  });

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("updateBookAction berhenti sebelum mengubah buku", async () => {
    const buku = await bukuBaru("Buku Sesi", { r: 11, g: 11, b: 11 });

    await expect(
      updateBookAction(
        buku.id,
        STATE_BUKU_AWAL,
        formBuku({ title: "Judul Berubah", slug: "judul-berubah" })
      )
    ).rejects.toThrow();

    const sesudah = await getBookById(buku.id);
    expect(sesudah?.title).toBe("Buku Sesi");
    expect(sesudah?.slug).toBe(buku.slug);
  });

  it("deleteBookAction berhenti sebelum menghapus buku", async () => {
    const buku = await bukuBaru("Buku Sesi Hapus", { r: 12, g: 12, b: 12 });

    // `useActionState` mengirim (state, formData) ke action.
    await expect(deleteBookAction(buku.id, STATE_HAPUS_AWAL, new FormData())).rejects.toThrow();

    expect(await getBookById(buku.id)).not.toBeNull();
    expect(berkasAda(buku.coverPath)).toBe(true);
  });
});
