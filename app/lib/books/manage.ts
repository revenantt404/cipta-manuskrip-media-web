import { createBook, updateBook, deleteBook, getBookById } from "./repository";
import { validateBookText, validateBookUpdateText } from "../validation/book";
import { processAndSaveCover, deleteCoverFile } from "../storage/cover";
import { pesanKegagalan } from "./errors";
import type { Book } from "./types";

/**
 * Alur menyimpan buku baru, terpisah dari Server Action-nya.
 *
 * Pemisahan ini disengaja dan punya alasan praktis: berkas `actions.ts`
 * memanggil `requireAdmin`, yang membaca cookie lewat `next/headers` dan
 * hanya hidup di dalam permintaan HTTP. Kalau seluruh alur unggah tinggal
 * di sana, kompensasi berkas — bagian yang paling mudah salah dan paling
 * mahal salahnya — tidak akan pernah bisa diuji. Di sini ia bisa.
 */

export type HasilSimpan =
  | { ok: true; book: Book }
  | { ok: false; errors: Record<string, string> };

/**
 * Hasil penyuntingan membawa slug **sebelum** perubahan.
 *
 * Tanpa itu pemanggil tidak punya cara mengetahui alamat mana yang harus
 * diinvalidasi; `book.slug` sudah berisi alamat baru, dan halaman di alamat
 * lama akan terus menyajikan versi cache-nya.
 */
export type HasilUbah =
  | { ok: true; book: Book; slugLama: string }
  | { ok: false; errors: Record<string, string> };

export type HasilHapus =
  | { ok: true; book: Book }
  | { ok: false; errors: Record<string, string> };

/** Nama field berkas sampul di formulir. */
export const FIELD_SAMPUL = "cover";

export function bacaTeks(data: FormData, kunci: string): string {
  const nilai = data.get(kunci);
  return typeof nilai === "string" ? nilai : "";
}

/**
 * Membaca berkas sampul dari formulir.
 *
 * `null` berarti tidak ada berkas yang dipilih. Dua bentuknya berbeda dan
 * keduanya harus ditangani: browser mengirim `File` berukuran nol ketika
 * kolomnya ada tapi kosong, dan tidak mengirim apa pun ketika kolomnya
 * hilang sama sekali.
 */
async function bacaSampul(data: FormData): Promise<{ buffer: Buffer; tipe: string } | null> {
  const berkas = data.get(FIELD_SAMPUL);
  if (!(berkas instanceof File) || berkas.size === 0) return null;

  return { buffer: Buffer.from(await berkas.arrayBuffer()), tipe: berkas.type };
}

function pesanSampulWajib(): HasilSimpan {
  return { ok: false, errors: { coverPath: "Sampul wajib diunggah." } };
}

/**
 * Menyimpan buku baru beserta sampulnya, dengan kompensasi berkas.
 *
 * Urutannya adalah inti fungsi ini:
 *
 * 1. Isian teks divalidasi lebih dahulu. Berkas yang tidak perlu ditulis
 *    tidak akan ditulis — menolak judul kosong setelah menulis sampul ke
 *    disk hanya menghasilkan kerja tambahan dan satu peluang lagi untuk
 *    lupa membersihkannya.
 * 2. Sampul diproses dan disimpan.
 * 3. Baris database dibuat.
 * 4. Bila langkah 3 gagal — slug bentrok, database tidak terjangkau, apa
 *    pun — sampul yang sudah ditulis di langkah 2 dihapus kembali. Tanpa
 *    langkah ini setiap kali admin salah mengisi formulir akan tertinggal
 *    satu berkas yatim yang tidak dirujuk baris mana pun, dan tidak ada
 *    yang memberitahukannya.
 */
export async function simpanBukuBaru(data: FormData): Promise<HasilSimpan> {
  const teks = validateBookText({
    title: bacaTeks(data, "title"),
    author: bacaTeks(data, "author"),
    synopsis: bacaTeks(data, "synopsis"),
    publisherInfo: bacaTeks(data, "publisherInfo"),
    bookInfo: bacaTeks(data, "bookInfo"),
    status: bacaTeks(data, "status"),
    estimatedRelease: bacaTeks(data, "estimatedRelease"),
    isbn: bacaTeks(data, "isbn"),
    pricePrint: bacaTeks(data, "pricePrint"),
    priceEbook: bacaTeks(data, "priceEbook"),
  });

  if (!teks.ok) return { ok: false, errors: teks.errors };

  const sampul = await bacaSampul(data);
  if (sampul === null) return pesanSampulWajib();

  const disimpan = await processAndSaveCover(sampul.buffer, sampul.tipe);
  if (!disimpan.ok) return { ok: false, errors: { coverPath: disimpan.error } };

  try {
    const hasil = await createBook({ ...teks.value, coverPath: disimpan.coverPath });

    if (!hasil.ok) {
      await deleteCoverFile(disimpan.coverPath);
      return { ok: false, errors: hasil.errors };
    }

    return { ok: true, book: hasil.book };
  } catch (error) {
    await deleteCoverFile(disimpan.coverPath);
    return { ok: false, errors: { form: pesanKegagalan(error, "Buku") } };
  }
}

/**
 * Menyunting buku, termasuk mengganti sampul dan slug.
 *
 * Kompensasi di sini punya dua arah yang harus benar sekaligus:
 *
 * - Bila penyimpanan gagal **setelah** sampul baru ditulis, sampul baru itu
 *   dibuang — berkas yatim tidak boleh tertinggal, dan sampul lama masih
 *   satu-satunya yang dirujuk baris database.
 * - Bila penyimpanan berhasil, sampul lama baru boleh dibuang. Membuangnya
 *   lebih dahulu berarti kegagalan database meninggalkan buku tanpa sampul
 *   yang bisa dilihat sama sekali.
 *
 * Buku dibaca lebih dahulu untuk dua hal: memastikan id-nya memang ada
 * (tanpa itu sampul baru sudah terlanjur ditulis untuk buku yang tidak
 * pernah ada), dan menyimpan slug lama yang harus diinvalidasi pemanggil.
 */
export async function perbaruiBuku(id: string, data: FormData): Promise<HasilUbah> {
  let lama: Book | null;
  try {
    lama = await getBookById(id);
  } catch (error) {
    // Database tidak terjangkau bukan "buku tidak ditemukan". Mengatakannya
    // begitu membuat admin mengira bukunya sudah terhapus.
    return { ok: false, errors: { form: pesanKegagalan(error, "Buku") } };
  }

  if (lama === null) {
    return { ok: false, errors: { form: "Buku tidak ditemukan." } };
  }

  const teks = validateBookUpdateText({
    title: bacaTeks(data, "title"),
    slug: bacaTeks(data, "slug"),
    author: bacaTeks(data, "author"),
    synopsis: bacaTeks(data, "synopsis"),
    publisherInfo: bacaTeks(data, "publisherInfo"),
    bookInfo: bacaTeks(data, "bookInfo"),
    status: bacaTeks(data, "status"),
    estimatedRelease: bacaTeks(data, "estimatedRelease"),
    isbn: bacaTeks(data, "isbn"),
    pricePrint: bacaTeks(data, "pricePrint"),
    priceEbook: bacaTeks(data, "priceEbook"),
  });

  if (!teks.ok) return { ok: false, errors: teks.errors };

  const sampul = await bacaSampul(data);

  // Tanpa berkas baru, path lama dipakai apa adanya. Inilah yang membuat
  // "tidak mengganti sampul" berbeda dari "lupa mengunggah".
  let coverPath = lama.coverPath;
  let sampulBaru: string | null = null;

  if (sampul !== null) {
    const disimpan = await processAndSaveCover(sampul.buffer, sampul.tipe);
    if (!disimpan.ok) return { ok: false, errors: { coverPath: disimpan.error } };
    coverPath = disimpan.coverPath;
    sampulBaru = disimpan.coverPath;
  }

  try {
    const hasil = await updateBook(id, { ...teks.value, coverPath });

    if (!hasil.ok) {
      if (sampulBaru !== null) await deleteCoverFile(sampulBaru);
      return { ok: false, errors: hasil.errors };
    }

    // Sampul lama dibuang hanya setelah baris database menunjuk yang baru.
    if (sampulBaru !== null) await deleteCoverFile(lama.coverPath);

    return { ok: true, book: hasil.book, slugLama: lama.slug };
  } catch (error) {
    if (sampulBaru !== null) await deleteCoverFile(sampulBaru);
    return { ok: false, errors: { form: pesanKegagalan(error, "Buku") } };
  }
}

/**
 * Menghapus buku beserta berkas sampulnya.
 *
 * Sampul dibaca sebelum baris dihapus: setelah baris hilang, satu-satunya
 * catatan path-nya ikut hilang, dan berkas itu menjadi sampah permanen.
 * Urutannya kebalikan dari penyimpanan — di sini database lebih dahulu,
 * berkas belakangan — karena kegagalan menghapus berkas masih bisa
 * dibersihkan belakangan, sedangkan berkas yang sudah hilang tidak dapat
 * dipulihkan bila penghapusan baris ternyata gagal.
 */
export async function hapusBuku(id: string): Promise<HasilHapus> {
  let buku: Book | null;
  try {
    buku = await getBookById(id);
  } catch (error) {
    return { ok: false, errors: { form: pesanKegagalan(error, "Buku") } };
  }

  if (buku === null) {
    return { ok: false, errors: { form: "Buku tidak ditemukan." } };
  }

  let hasil;
  try {
    hasil = await deleteBook(id);
  } catch (error) {
    return { ok: false, errors: { form: pesanKegagalan(error, "Buku") } };
  }

  if (!hasil.ok) {
    return { ok: false, errors: { form: "Buku tidak ditemukan." } };
  }

  await deleteCoverFile(buku.coverPath);
  return { ok: true, book: buku };
}
