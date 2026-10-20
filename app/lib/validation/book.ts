/**
 * Validasi input buku.
 *
 * Aturan di sini mencerminkan constraint CHECK pada tabel `books` di
 * `db/migrations/001_init.sql` dan `002_isbn_harga.sql`. Database tetap
 * penjaga terakhir; validator ini yang membuat pesan kesalahan bisa dibaca
 * manusia sebelum data menyentuh database.
 *
 * Semua kesalahan dikumpulkan sekaligus, bukan berhenti di yang pertama,
 * supaya form dapat menampilkan seluruh masalah dalam satu kali kirim.
 */

import { parseHarga } from "../books/price";

export type BookStatus = "published" | "upcoming";

export type BookInput = {
  title: string;
  author: string;
  synopsis: string | null;
  publisherInfo: string;
  bookInfo: string | null;
  coverPath: string;
  status: BookStatus;
  estimatedRelease: string | null;
  isbn: string | null;
  pricePrint: number | null;
  priceEbook: number | null;
};

/** Input buku tanpa `coverPath`: yang bisa dinilai sebelum berkas diunggah. */
export type BookTextInput = Omit<BookInput, "coverPath">;

/** Input ubah buku: teks, sampul, dan slug. */
export type BookUpdateInput = BookInput & { slug: string };

export type ValidationResult =
  | { ok: true; value: BookInput }
  | { ok: false; errors: Record<string, string> };

export type TextValidationResult =
  | { ok: true; value: BookTextInput }
  | { ok: false; errors: Record<string, string> };

export type UpdateTextValidationResult =
  | { ok: true; value: BookTextInput & { slug: string } }
  | { ok: false; errors: Record<string, string> };

export type UpdateValidationResult =
  | { ok: true; value: BookUpdateInput }
  | { ok: false; errors: Record<string, string> };

export const PUBLISHER_DEFAULT = "CV Cipta Manuskrip Media";

/**
 * Bentuk ISBN yang diterima: angka, tanda hubung, spasi, dan `X` (huruf
 * pemeriksa ISBN-10), panjang 10–20 karakter.
 *
 * Checksum ISBN-13 **tidak** diperiksa. Alasannya bukan kelalaian: klien
 * belum pernah menyerahkan satu ISBN pun, sehingga aturan checksum tidak
 * bisa diuji terhadap data nyata dan justru akan menolak ISBN lama
 * (ISBN-10) atau ISBN yang ditulis dengan spasi. Yang dicegah di sini
 * adalah salah ketik yang jelas — huruf, tanda baca asing, atau panjang
 * yang mustahil — bukan validitas kepemilikan nomor.
 */
const POLA_ISBN = /^[0-9Xx][0-9Xx\s-]{8,18}$/;

function galatIsbnDari(isbn: string | null): string | null {
  if (isbn === null) return null;
  if (!POLA_ISBN.test(isbn)) {
    return "ISBN hanya boleh berisi angka, tanda hubung, dan spasi (10–20 karakter).";
  }
  return null;
}

function objekBiasa(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === "object" && raw !== null && !Array.isArray(raw);
}

/** Membaca nilai sebagai string dan memangkas spasi di ujungnya. */
function teks(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** String kosong setelah dipangkas menjadi null, bukan string kosong. */
function teksAtauNull(value: unknown): string | null {
  const hasil = teks(value);
  return hasil === "" ? null : hasil;
}

/**
 * Memvalidasi seluruh isian teks buku, tanpa menyinggung `coverPath`.
 *
 * Dipisahkan supaya alur unggah bisa menolak isian yang salah **sebelum**
 * berkas sampul diproses dan ditulis ke disk. Menyimpan berkas lebih
 * dahulu lalu membuangnya lagi hanya karena judul kosong adalah kerja
 * yang bisa dihindari.
 */
export function validateBookText(raw: unknown): TextValidationResult {
  if (!objekBiasa(raw)) {
    return { ok: false, errors: { form: "Data tidak dikenali." } };
  }

  const errors: Record<string, string> = {};

  const title = teks(raw.title);
  const author = teks(raw.author);
  const publisherInfo = teks(raw.publisherInfo) || PUBLISHER_DEFAULT;
  const synopsis = teksAtauNull(raw.synopsis);
  const bookInfo = teksAtauNull(raw.bookInfo);
  const estimatedRelease = teksAtauNull(raw.estimatedRelease);
  const isbn = teksAtauNull(raw.isbn);

  if (title === "") errors.title = "Judul wajib diisi.";
  if (author === "") errors.author = "Penulis wajib diisi.";

  const galatIsbn = galatIsbnDari(isbn);
  if (galatIsbn !== null) errors.isbn = galatIsbn;

  const hargaCetak = parseHarga(raw.pricePrint);
  if (!hargaCetak.ok) errors.pricePrint = hargaCetak.error;

  const hargaEbook = parseHarga(raw.priceEbook);
  if (!hargaEbook.ok) errors.priceEbook = hargaEbook.error;

  const status = raw.status;
  if (status !== "published" && status !== "upcoming") {
    errors.status = "Status harus 'published' atau 'upcoming'.";
  } else if (status === "published") {
    if (synopsis === null) {
      errors.synopsis = "Buku yang telah terbit wajib punya sinopsis.";
    }
    if (estimatedRelease !== null) {
      errors.estimatedRelease = "Buku yang telah terbit tidak punya estimasi terbit.";
    }
  } else {
    if (estimatedRelease === null) {
      errors.estimatedRelease = "Buku yang segera terbit wajib punya estimasi terbit.";
    }

    // Buku yang belum terbit tidak dijual, jadi harganya tidak boleh terisi:
    // angka yang dimasukkan sekarang akan muncul di katalog begitu buku
    // ditandai terbit, padahal belum pernah diputuskan untuk publikasi.
    if (hargaCetak.ok && hargaCetak.value !== null) {
      errors.pricePrint = "Buku yang segera terbit belum punya harga cetak.";
    }
    if (hargaEbook.ok && hargaEbook.value !== null) {
      errors.priceEbook = "Buku yang segera terbit belum punya harga ebook.";
    }

    // ISBN buku yang belum terbit tidak ditampilkan sebagai angka — katalog
    // menyebut statusnya. Menyimpannya sekarang hanya menciptakan ISBN yang
    // bisa dikira sudah terdaftar.
    if (isbn !== null) {
      errors.isbn = "Buku yang segera terbit belum punya ISBN.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      title,
      author,
      synopsis,
      publisherInfo,
      bookInfo,
      status: status as BookStatus,
      estimatedRelease,
      isbn,
      pricePrint: hargaCetak.ok ? hargaCetak.value : null,
      priceEbook: hargaEbook.ok ? hargaEbook.value : null,
    },
  };
}

export function validateBookInput(raw: unknown): ValidationResult {
  const teksBuku = validateBookText(raw);

  // Bentuk yang tidak dikenali sudah ditolak `validateBookText`; membaca
  // `coverPath` di sini hanya sah kalau `raw` memang objek biasa.
  if (!objekBiasa(raw)) {
    return teksBuku.ok
      ? { ok: false, errors: { form: "Data tidak dikenali." } }
      : teksBuku;
  }

  const coverPath = teks(raw.coverPath);

  if (!teksBuku.ok) {
    // Kesalahan sampul digabung ke kesalahan teks, bukan dilaporkan di
    // kesempatan berikutnya: form menampilkan semuanya dalam satu kali
    // kirim, sehingga admin tidak perlu mengirim dua kali untuk mengetahui
    // dua hal yang salah.
    return {
      ok: false,
      errors: coverPath === ""
        ? { ...teksBuku.errors, coverPath: "Sampul wajib diunggah." }
        : teksBuku.errors,
    };
  }

  if (coverPath === "") {
    return { ok: false, errors: { coverPath: "Sampul wajib diunggah." } };
  }

  return { ok: true, value: { ...teksBuku.value, coverPath } };
}

/**
 * Bentuk slug yang diterima: hanya `a-z`, angka, dan tanda hubung tunggal,
 * tanpa tanda hubung di awal atau akhir.
 *
 * Slug bukan sekadar label — ia menjadi alamat halaman. Slug yang memuat
 * spasi, huruf besar, atau tanda baca akan tampil sebagai alamat yang harus
 * di-escape dan mudah salah ketika disalin ke pesan WhatsApp.
 */
const POLA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SLUG_MAKS = 200;

/**
 * Memvalidasi isian teks buku **beserta slug**, untuk penyuntingan.
 *
 * Dipisahkan dari `validateBookText` karena penambahan buku tidak menerima
 * slug dari form: slug buku baru selalu diturunkan dari judulnya. Hanya
 * penyuntingan yang membiarkan admin menentukan alamat halaman sendiri.
 *
 * Slug kosong ditolak alih-alih diisi otomatis: form edit menampilkan slug
 * yang berlaku, sehingga kolom kosong berarti admin menghapusnya — bukan
 * meminta slug dibentuk ulang. Menebak di sini akan mengubah alamat halaman
 * tanpa admin memintanya.
 */
export function validateBookUpdateText(raw: unknown): UpdateTextValidationResult {
  const teksBuku = validateBookText(raw);

  // Bentuk yang tidak dikenali sudah ditolak `validateBookText`; membaca
  // `slug` di sini hanya sah kalau `raw` memang objek biasa.
  if (!objekBiasa(raw)) return { ok: false, errors: teksBuku.ok ? { form: "Data tidak dikenali." } : teksBuku.errors };

  const galat = galatSlugDari(raw.slug);

  if (!teksBuku.ok) {
    return {
      ok: false,
      errors: galat === null ? teksBuku.errors : { ...teksBuku.errors, slug: galat },
    };
  }

  if (galat !== null) {
    return { ok: false, errors: { slug: galat } };
  }

  return { ok: true, value: { ...teksBuku.value, slug: teks(raw.slug) } };
}

/** Pesan galat slug, atau `null` bila slug sah. */
function galatSlugDari(nilai: unknown): string | null {
  const slug = teks(nilai);

  if (slug === "") return "Slug wajib diisi.";
  if (slug.length > SLUG_MAKS) return `Slug maksimal ${SLUG_MAKS} karakter.`;
  if (!POLA_SLUG.test(slug)) return "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.";
  return null;
}

/**
 * Versi `validateBookUpdateText` untuk repository: melengkapi `coverPath`.
 *
 * `coverPath` di sini **wajib** meski di form edit sampul bersifat opsional.
 * Alurnya begini: bila admin tidak memilih berkas baru, pemanggil mengirim
 * path sampul lama sebagai `coverPath`, bukan string kosong. Dengan begitu
 * "tidak mengganti sampul" dan "lupa mengunggah sampul" tetap bisa
 * dibedakan — yang kedua memang tidak punya padanan di halaman ubah.
 */
export function validateBookUpdateInput(raw: unknown): UpdateValidationResult {
  const teksBuku = validateBookUpdateText(raw);

  if (!objekBiasa(raw)) {
    return teksBuku.ok
      ? { ok: false, errors: { form: "Data tidak dikenali." } }
      : teksBuku;
  }

  const coverPath = teks(raw.coverPath);

  if (!teksBuku.ok) {
    return {
      ok: false,
      errors: coverPath === ""
        ? { ...teksBuku.errors, coverPath: "Sampul wajib diunggah." }
        : teksBuku.errors,
    };
  }

  if (coverPath === "") {
    return { ok: false, errors: { coverPath: "Sampul wajib diunggah." } };
  }

  return { ok: true, value: { ...teksBuku.value, coverPath } };
}
