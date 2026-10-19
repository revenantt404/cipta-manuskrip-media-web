/**
 * Validasi input buku.
 *
 * Aturan di sini mencerminkan constraint CHECK pada tabel `books` di
 * `db/migrations/001_init.sql`. Database tetap penjaga terakhir; validator
 * ini yang membuat pesan kesalahan bisa dibaca manusia sebelum data
 * menyentuh database.
 *
 * Semua kesalahan dikumpulkan sekaligus, bukan berhenti di yang pertama,
 * supaya form dapat menampilkan seluruh masalah dalam satu kali kirim.
 */

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
};

/** Input buku tanpa `coverPath`: yang bisa dinilai sebelum berkas diunggah. */
export type BookTextInput = Omit<BookInput, "coverPath">;

export type ValidationResult =
  | { ok: true; value: BookInput }
  | { ok: false; errors: Record<string, string> };

export type TextValidationResult =
  | { ok: true; value: BookTextInput }
  | { ok: false; errors: Record<string, string> };

export const PUBLISHER_DEFAULT = "CV Cipta Manuskrip Media";

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

  if (title === "") errors.title = "Judul wajib diisi.";
  if (author === "") errors.author = "Penulis wajib diisi.";

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
