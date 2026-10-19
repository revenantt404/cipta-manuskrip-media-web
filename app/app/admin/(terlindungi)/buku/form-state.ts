import type { BookStatus } from "@/lib/books/types";

/**
 * Nilai formulir yang dikembalikan ke halaman saat penyimpanan gagal.
 *
 * Brief bagian 8: "Kesalahan validasi tidak menghapus input yang telah
 * diisi." Semua kolom teks dikembalikan apa adanya, dan sampul dilaporkan
 * terpisah karena berkas tidak bisa dikembalikan ke `<input type="file">` —
 * browser tidak mengizinkannya, dan itu memang benar secara keamanan.
 */
export type NilaiFormBuku = {
  title: string;
  author: string;
  synopsis: string;
  publisherInfo: string;
  bookInfo: string;
  status: string;
  estimatedRelease: string;
};

export const NILAI_BUKU_KOSONG: NilaiFormBuku = {
  title: "",
  author: "",
  synopsis: "",
  publisherInfo: "",
  bookInfo: "",
  status: "published",
  estimatedRelease: "",
};

export type StateFormBuku = {
  errors: Record<string, string>;
  nilai: NilaiFormBuku;
  /** Jumlah percobaan, dipakai sebagai `key` untuk memasang ulang form. */
  percobaan: number;
  /**
   * Menandai bahwa sampul harus dipilih ulang karena berkasnya sudah
   * diproses dan dibuang saat penyimpanan gagal. Tanpa penanda ini, admin
   * hanya melihat pesan "sampul wajib diunggah" padahal ia sudah memilih
   * berkas, dan tidak tahu apa yang berubah.
   */
  ulangiSampul: boolean;
};

export const STATE_BUKU_AWAL: StateFormBuku = {
  errors: {},
  nilai: NILAI_BUKU_KOSONG,
  percobaan: 0,
  ulangiSampul: false,
};

export type AksiFormBuku = (
  sebelumnya: StateFormBuku,
  data: FormData
) => Promise<StateFormBuku>;

/** Status yang boleh dipilih di formulir, dengan labelnya. */
export const PILIHAN_STATUS: ReadonlyArray<{ nilai: BookStatus; label: string }> = [
  { nilai: "published", label: "Telah terbit" },
  { nilai: "upcoming", label: "Segera terbit" },
];
