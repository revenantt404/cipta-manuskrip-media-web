const NOMOR_BUKU = "6289671894900";
export const NOMOR_JURNAL = "62895629203142";

export type JenisPesanan = "cetak" | "ebook";

/**
 * Nomor dan kalimat pesan dikunci brief bagian 10 — jangan "memperbaiki"
 * ejaan `ebook`, menambah salam, atau mengubah nomornya.
 *
 * Satu penyesuaian dari pemilik proyek (23 Oktober 2026): nilai yang
 * berubah-ubah (judul, topik) diapit tanda petik dua. Alasannya bukan
 * selera — judul buku kerap sudah memuat tanda petik tunggal, mis.
 * `Panduan Menulis 'Karya Ilmiah'`, sehingga tanpa pengapit batas judul
 * dan kalimat pengantarnya kabur saat dibaca admin di WhatsApp.
 */
export function buildBookOrderUrl(judul: string, jenis: JenisPesanan): string {
  const pesan =
    jenis === "cetak"
      ? `Mau pesan buku cetak judul "${judul}"`
      : `Mau sewa ebook judul "${judul}"`;

  return `https://wa.me/${NOMOR_BUKU}?text=${encodeURIComponent(pesan)}`;
}

/**
 * Kalimat pesan jurnal dikunci persis oleh brief: berbeda dengan pesan buku,
 * pesan jurnal BERAKHIR TITIK dan huruf awalnya sengaja kecil ("saya", bukan
 * "Saya") — jangan dirapikan. Topik asistensi hanya pernah masuk ke isi pesan
 * WhatsApp; ia tidak pernah dikirim ke server kita.
 */

/** Pesan kirim naskah tanpa topik — persis: "ini naskah artikel saya, admin." */
export function buildJournalSubmitUrl(): string {
  return `https://wa.me/${NOMOR_JURNAL}?text=${encodeURIComponent(
    "ini naskah artikel saya, admin."
  )}`;
}

/** Pesan asistensi artikel dengan topik — persis: `saya mau dibantu asistensi artikel topik "<topik>".` */
export function buildJournalAssistUrl(topik: string): string {
  return `https://wa.me/${NOMOR_JURNAL}?text=${encodeURIComponent(
    `saya mau dibantu asistensi artikel topik "${topik}".`
  )}`;
}

/**
 * Pesan asistensi **buku** dengan topik.
 *
 * Kalimat ini tidak berasal dari brief §10 — brief hanya mengunci pesan
 * pemesanan buku dan asistensi artikel. Bentuknya dipilih pemilik proyek
 * (20 Oktober 2026) dan sengaja berbeda dari versi artikel pada dua hal:
 * huruf awal `S` besar, dan kata `buku` menggantikan `artikel`. Jangan
 * "menyeragamkan" keduanya — perbedaan itu keputusan, bukan kelalaian.
 *
 * Sejak 23 Oktober 2026 topik diapit tanda petik dua, sama seperti judul
 * pada pesan pemesanan buku.
 */
export function buildBookAssistUrl(topik: string): string {
  return `https://wa.me/${NOMOR_BUKU}?text=${encodeURIComponent(
    `Saya mau dibantu asistensi buku topik "${topik}".`
  )}`;
}

export type HasilPesanAsistensi = { ok: true; url: string } | { ok: false; error: string };

/**
 * Memangkas spasi tepi topik mentah lebih dulu; menolak bila kosong murni.
 * Trimming tidak ditaruh di pembentuk URL supaya formatter itu murni, dan
 * aturan ini hanya ditulis sekali untuk kedua jenis asistensi.
 */
function pesanAsistensiDari(
  topikMentah: string,
  bangunUrl: (topik: string) => string
): HasilPesanAsistensi {
  const topik = topikMentah.trim();
  if (topik === "") {
    return { ok: false, error: "Topik asistensi belum diisi." };
  }
  return { ok: true, url: bangunUrl(topik) };
}

/** Asistensi artikel jurnal. */
export function pesanAsistensiJurnal(topikMentah: string): HasilPesanAsistensi {
  return pesanAsistensiDari(topikMentah, buildJournalAssistUrl);
}

/** Asistensi penulisan buku. */
export function pesanAsistensiBuku(topikMentah: string): HasilPesanAsistensi {
  return pesanAsistensiDari(topikMentah, buildBookAssistUrl);
}
