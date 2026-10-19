const NOMOR_BUKU = "6289671894900";
export const NOMOR_JURNAL = "62895629203142";

export type JenisPesanan = "cetak" | "ebook";

/**
 * Nomor dan kalimat pesan dikunci persis oleh brief bagian 10 — jangan
 * "memperbaiki" ejaan `ebook`, menambah salam, atau mengubah nomornya.
 */
export function buildBookOrderUrl(judul: string, jenis: JenisPesanan): string {
  const pesan =
    jenis === "cetak"
      ? `Mau pesan buku cetak judul ${judul}`
      : `Mau sewa ebook judul ${judul}`;

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

/** Pesan asistensi dengan topik — persis: "saya mau dibantu asistensi artikel topik <topik>." */
export function buildJournalAssistUrl(topik: string): string {
  return `https://wa.me/${NOMOR_JURNAL}?text=${encodeURIComponent(
    `saya mau dibantu asistensi artikel topik ${topik}.`
  )}`;
}

/**
 * Memangkas spasi tepi topik mentah lebih dulu; menolak bila kosong murni.
 * Trimming tidak ditaruh di buildJournalAssistUrl supaya formatter itu murni.
 */
export function pesanAsistensi(
  topikMentah: string
): { ok: true; url: string } | { ok: false; error: string } {
  const topik = topikMentah.trim();
  if (topik === "") {
    return { ok: false, error: "Topik asistensi belum diisi." };
  }
  return { ok: true, url: buildJournalAssistUrl(topik) };
}
