import { createBook } from "./repository";
import { validateBookText } from "../validation/book";
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
