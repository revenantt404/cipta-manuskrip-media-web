/**
 * Menerjemahkan kegagalan database menjadi pesan yang bisa dibaca admin.
 *
 * Kegagalan yang paling mungkin terjadi saat menyimpan buku adalah bentrok
 * slug: dua judul berbeda bisa menghasilkan slug yang sama setelah tanda
 * baca dan spasi dibuang. Database menolaknya lewat `uq_books_slug`, dan
 * yang sampai ke action adalah galat driver berbentuk `ER_DUP_ENTRY`.
 *
 * Pesannya sengaja tidak menyebut nama kolom maupun SQL-nya: admin perlu
 * tahu apa yang harus diubah, bukan indeks mana yang menolak.
 */
export function pesanKegagalan(error: unknown, apa: string): string {
  if (kodeError(error) === "ER_DUP_ENTRY") {
    return "Judul ini menghasilkan alamat halaman yang sudah dipakai buku lain. Ubah judulnya sedikit, lalu simpan lagi.";
  }

  return `${apa} sedang tidak dapat diproses. Coba lagi beberapa saat lagi.`;
}

function kodeError(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const kode = (error as { code?: unknown }).code;
  return typeof kode === "string" ? kode : null;
}
