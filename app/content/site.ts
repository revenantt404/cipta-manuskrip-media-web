/**
 * Sumber satu-satunya teks statis situs publik — nav, footer, kontak,
 * paket buku, dan daftar jurnal. Saat UI dirakit ulang di Arena cukup
 * mengimpor dari sini, jadi tidak ada teks yang tersalin dobel atau
 * berbeda antarhalaman.
 *
 * Placeholder dalam kurung siku tetap menandai materi klien yang belum ada.
 * PAKET_BUKU saat ini pengecualian eksperimental: tier dan harga simulasi,
 * dibuat atas izin pemilik proyek dan bukan penawaran resmi. Ganti dengan
 * paket klien yang disetujui sebelum rilis produksi (docs/DESIGN-STACK.md §8).
 *
 * Teks yang dikunci brief (nomor WhatsApp format tampil, 13 fasilitas,
 * kategori jurnal dengan en dash `–`) diperiksa di `site.test.ts`, jadi
 * tidak berubah tanpa sengaja saat UI dirombak.
 */

/** Nav publik dibatasi brief §9: dua tautan ini saja, tanpa layanan. */
export const NAV_UTAMA: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Beranda", href: "/" },
  { label: "Tentang Kami", href: "/tentang-kami" },
];

/** Footer mengulang kedua layanan; header tidak. */
export const TAUTAN_LAYANAN: ReadonlyArray<{ label: string; href: string }> = [
  { label: "Publish Buku", href: "/publish-buku" },
  { label: "Publish Jurnal", href: "/publish-jurnal" },
];

/**
 * Nomor tampil (bukan nomor wa.me) yang ditetapkan brief §10. Nomor
 * wa.me yang sama ada terpisah di `lib/whatsapp.ts`, dalam bentuk
 * internasional — kalau klien mengganti nomornya, keduanya wajib
 * diganti bersama.
 */
export const KONTAK: { adminBuku: string; adminJurnal: string } = {
  adminBuku: "0896-7189-4900",
  adminJurnal: "0895-6292-03142",
};

/**
 * Tiga tier contoh untuk prototipe visual, tertinggi ke terendah.
 * Nama, harga, dan fasilitas ini dikarang atas persetujuan pemilik proyek
 * (21 Oktober 2026) dan BUKAN penawaran resmi. Ganti setelah klien
 * mengirim paket dan harga final.
 */
export const PAKET_BUKU: ReadonlyArray<{
  nama: string;
  harga: string;
  fasilitas: readonly string[];
}> = [
  {
    nama: "Paket Eksklusif",
    harga: "Rp7.500.000",
    fasilitas: [
      "Penyuntingan naskah",
      "Proofreading akhir",
      "Desain sampul dan tata letak isi",
      "Pendampingan proses ISBN",
      "10 buku cetak",
    ],
  },
  {
    nama: "Paket Profesional",
    harga: "Rp4.500.000",
    fasilitas: [
      "Proofreading akhir",
      "Desain sampul dan tata letak isi",
      "Pendampingan proses ISBN",
      "5 buku cetak",
    ],
  },
  {
    nama: "Paket Dasar",
    harga: "Rp2.500.000",
    fasilitas: [
      "Tata letak isi buku",
      "Desain sampul buku",
      "Pendampingan proses ISBN",
    ],
  },
];

/**
 * 13 fasilitas jurnal persis dari brief §10 — urutan dan ejaannya
 * terkunci oleh tes; halaman jurnal tidak boleh menambah janji lain
 * (statistik, jumlah terbit, dan sebagainya).
 */
export const FASILITAS_JURNAL: readonly string[] = [
  "LOA Cepat",
  "DOI Aktif",
  "Dokumentasi Korespondensi Lengkap",
  "Review Transparan",
  "Jurnal Non-Predator",
  "Revisi Minor–Mayor",
  "Turnitin",
  "Konversi Skripsi/Tesis/Disertasi",
  "Penerjemahan Artikel",
  "Proofreading",
  "Layout",
  "Template Artikel",
  "Garansi Terbit",
];

/** Tepat tiga kategori; en dash pada `SINTA 1–4` persis dari brief. */
export const KATEGORI_JURNAL: readonly string[] = [
  "Jurnal Nasional Terakreditasi SINTA 1–4",
  "Jurnal Internasional Index Copernicus",
  "Jurnal Internasional Scopus dan SCImago",
];

/**
 * Batas preview katalog di `/publish-buku` — kedua preview (published
 * dan upcoming) memakai nilai yang ini, bukan memotong keduanya
 * sendiri.
 */
export const PREVIEW_LIMIT: number = 3;
