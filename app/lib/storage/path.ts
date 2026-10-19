/**
 * Path sampul — bagian murni dari penyimpanan berkas.
 *
 * Dipisahkan dari pemrosesan gambar supaya halaman publik dapat membentuk
 * URL sampul tanpa ikut memuat `sharp`, dan supaya aturan path bisa diuji
 * tanpa menyentuh disk.
 */

import path from "node:path";

/**
 * Nama logis folder sampul.
 *
 * Nilai ini bukan lokasi fisik folder, melainkan bagian depan `cover_path`
 * yang disimpan di database dan sekaligus awalan URL publiknya. Lokasi
 * fisiknya ditentukan `dirSampul()`.
 */
export const COVER_DIR = "covers";

/** Awalan URL publik sampul. */
export const COVER_URL_PREFIX = "/covers";

const COVER_MAX_BAWAAN = 5 * 1024 * 1024;

/** Folder bawaan, dipakai bila `COVER_DIR` tidak diatur. */
const COVER_DIR_BAWAAN = path.join("storage", "covers");

/**
 * Bentuk nama berkas yang ditulis aplikasi: UUID lalu `.webp`.
 *
 * `processAndSaveCover` selalu membuat nama dengan bentuk ini; tidak ada
 * jalur lain yang menulis ke folder sampul. Route penyaji memakai pola ini
 * sebagai daftar izin, sehingga nama berkas yang datang dari URL tidak
 * pernah dipakai untuk menyusun path lebih jauh dari satu komponen.
 */
const POLA_NAMA_SAMPUL =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

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
 * Folder tempat berkas sampul ditulis, sebagai path absolut.
 *
 * Bawaannya di luar `public/`. Dua alasan:
 *
 * 1. `next start` menyusun daftar berkas `public/` sekali saat boot, jadi
 *    berkas yang ditulis setelah server menyala tidak akan pernah tersaji
 *    dari sana. Sampul disajikan route handler `app/covers/[berkas]` yang
 *    membaca disk saat permintaan datang.
 * 2. `DESIGN-STACK.md` bagian 5 mensyaratkan folder sampul bertahan saat
 *    aplikasi di-deploy ulang. Folder di dalam aplikasi tidak memenuhi itu,
 *    dan `COVER_DIR` boleh menunjuk ke mana saja — termasuk ke luar folder
 *    aplikasi sekalipun.
 */
export function dirSampul(): string {
  const diatur = process.env.COVER_DIR;
  if (diatur === undefined || diatur.trim() === "") {
    return path.join(process.cwd(), COVER_DIR_BAWAAN);
  }
  return path.resolve(diatur);
}

/** Apakah `nama` berbentuk nama berkas yang memang ditulis aplikasi. */
export function namaSampulSah(nama: string): boolean {
  return POLA_NAMA_SAMPUL.test(nama);
}

/**
 * Path di database → URL publik.
 *
 * Yang dipakai hanya komponen nama berkas terakhir: lokasi fisik folder
 * berbeda antar lingkungan (lokal, hosting, folder di luar aplikasi),
 * sementara `cover_path` yang tersimpan memakai nama logis yang sama di
 * semua lingkungan. Membuang komponen folder di sini membuat URL tidak
 * pernah bergantung pada susunan folder — dan nilai lama yang memuat
 * subfolder tetap menghasilkan URL yang benar.
 */
export function resolveCoverUrl(coverPath: string): string {
  const nama = path.basename(coverPath.trim());
  if (nama === "" || nama === "." || nama === "..") return COVER_URL_PREFIX;

  return `${COVER_URL_PREFIX}/${nama}`;
}
