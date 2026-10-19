const NOMOR_BUKU = "6289671894900";

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
