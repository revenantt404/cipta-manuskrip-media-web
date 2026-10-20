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
  slug: string;
  author: string;
  synopsis: string;
  publisherInfo: string;
  bookInfo: string;
  status: string;
  estimatedRelease: string;
  /**
   * Ketiga isian berikut dikembalikan sebagai teks apa adanya, bukan
   * angka: yang dikembalikan adalah apa yang barusan diketik admin, dan
   * `parseHarga` sudah menolak isian yang salah sebelum ini. Mengubahnya
   * menjadi angka di sini akan menghapus titik ribuan yang ia ketik.
   */
  isbn: string;
  pricePrint: string;
  priceEbook: string;
};

export const NILAI_BUKU_KOSONG: NilaiFormBuku = {
  title: "",
  slug: "",
  author: "",
  synopsis: "",
  publisherInfo: "",
  bookInfo: "",
  status: "published",
  estimatedRelease: "",
  isbn: "",
  pricePrint: "",
  priceEbook: "",
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

/**
 * Keadaan form hapus.
 *
 * Penghapusan tidak punya isian yang bisa dikembalikan, jadi yang perlu
 * dipertahankan hanya pesan galat dan jumlah percobaan — `key` yang berubah
 * tetap diperlukan supaya form bisa dikirim ulang setelah gagal.
 */
export type StateHapusBuku = {
  errors: Record<string, string>;
  percobaan: number;
};

export const STATE_HAPUS_AWAL: StateHapusBuku = { errors: {}, percobaan: 0 };

export type AksiHapusBuku = (
  sebelumnya: StateHapusBuku,
  data: FormData
) => Promise<StateHapusBuku>;

/** Status yang boleh dipilih di formulir, dengan labelnya. */
export const PILIHAN_STATUS: ReadonlyArray<{ nilai: BookStatus; label: string }> = [
  { nilai: "published", label: "Telah terbit" },
  { nilai: "upcoming", label: "Segera terbit" },
];
