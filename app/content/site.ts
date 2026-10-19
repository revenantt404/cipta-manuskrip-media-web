/**
 * Sumber satu-satunya teks statis situs publik — nav, footer, kontak,
 * paket buku, dan daftar jurnal. Saat UI dirakit ulang di Arena cukup
 * mengimpor dari sini, jadi tidak ada teks yang tersalin dobel atau
 * berbeda antarhalaman.
 *
 * Nilai dalam kurung siku ([...]) itu jujur, bukan sementara: materinya
 * memang belum diserahkan klien. Semuanya wajib diganti hanya setelah
 * klien mengirim materinya — jangan mengarang harga, nama paket, atau
 * aset apa pun (docs/DESIGN-STACK.md §8).
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
 * Tepat tiga paket buku, semuanya placeholder — nama, harga, dan
 * fasilitasnya belum diserahkan klien, jadi jangan mengarang angka.
 * Strukturnya sudah final agar kartu paket bisa dirakit sekarang.
 */
export const PAKET_BUKU: ReadonlyArray<{
  nama: string;
  harga: string;
  fasilitas: string;
}> = [
  { nama: "[Nama paket dari klien]", harga: "[Harga dari klien]", fasilitas: "[Fasilitas paket dari klien]" },
  { nama: "[Nama paket dari klien]", harga: "[Harga dari klien]", fasilitas: "[Fasilitas paket dari klien]" },
  { nama: "[Nama paket dari klien]", harga: "[Harga dari klien]", fasilitas: "[Fasilitas paket dari klien]" },
];

/**
 * 13 fasilitas jurnal persis dari brief §10 — urutan dan ejaannya
 * terkunci oleh tes; halaman jurnal tidak boleh menambah janji lain
 * (statistik, jumlah terbit, dan sebagainya).
 */
export const FASILITAS_JURNAL: readonly string[] = [
  "LOA cepat",
  "DOI aktif",
  "dokumentasi korespondensi lengkap",
  "review transparan",
  "jurnal bukan predator",
  "revisi minor–mayor",
  "Turnitin",
  "konversi skripsi/tesis/disertasi",
  "penerjemahan artikel",
  "proofreading",
  "layout",
  "template artikel",
  "garansi terbit",
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
