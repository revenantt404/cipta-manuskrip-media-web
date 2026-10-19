/**
 * Path sampul — bagian murni dari penyimpanan berkas.
 *
 * Dipisahkan dari pemrosesan gambar supaya halaman publik dapat membentuk
 * URL sampul tanpa ikut memuat `sharp`, dan supaya aturan path bisa diuji
 * tanpa menyentuh disk.
 */

/** Folder tempat berkas sampul disimpan, relatif terhadap `public/`. */
export const COVER_DIR = "covers";

const COVER_MAX_BAWAAN = 5 * 1024 * 1024;

/**
 * Ukuran maksimum berkas sampul. Nilai yang tidak masuk akal diabaikan
 * diam-diam dan diganti nilai bawaan: menolak semua unggahan karena salah
 * tulis konfigurasi lebih merugikan daripada memakai batas yang sudah
 * ditetapkan brief.
 */
export function coverMaxBytes(source: Record<string, string | undefined> = process.env): number {
  const mentah = source.COVER_MAX_BYTES;
  if (mentah === undefined || mentah.trim() === "") return COVER_MAX_BAWAAN;

  const angka = Number(mentah);
  if (!Number.isInteger(angka) || angka < 1) return COVER_MAX_BAWAAN;

  return angka;
}

/**
 * Path di database → URL publik. Disimpan sebagai path relatif, bukan URL
 * mentah, supaya pindah domain tidak memerlukan perubahan data.
 */
export function resolveCoverUrl(coverPath: string): string {
  return `/${coverPath.replace(/^\/+/, "")}`;
}
