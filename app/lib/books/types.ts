export type BookStatus = "published" | "upcoming";

export type Book = {
  id: string;
  title: string;
  slug: string;
  author: string;
  synopsis: string | null;
  publisherInfo: string;
  bookInfo: string | null;
  coverPath: string;
  status: BookStatus;
  estimatedRelease: string | null;
  /**
   * ISBN hanya untuk buku yang sudah terbit. Buku "segera terbit" tidak
   * punya ISBN nyata — katalog menampilkan statusnya, bukan angka.
   */
  isbn: string | null;
  /** Harga cetak dan sewa ebook dalam rupiah; NULL = belum ditetapkan. */
  pricePrint: number | null;
  priceEbook: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type WriteResult =
  | { ok: true; book: Book }
  | { ok: false; errors: Record<string, string> };

export const KOLOM_BUKU = [
  "id",
  "title",
  "slug",
  "author",
  "synopsis",
  "publisher_info",
  "book_info",
  "cover_path",
  "status",
  "estimated_release",
  "isbn",
  "price_print",
  "price_ebook",
  "created_at",
  "updated_at",
].join(", ");

/** Mengubah nilai waktu dari driver menjadi Date, apa pun bentuk aslinya. */
function waktu(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

function teksAtauNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

/**
 * DECIMAL dari MySQL kembali sebagai string ("85000.00"), bukan number.
 * `Number()` mengubahnya menjadi angka yang bisa diformat; NULL tetap NULL
 * karena "belum ditetapkan" harus bisa dibedakan dari nol.
 */
function angkaAtauNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const angka = Number(value);
  return Number.isFinite(angka) ? angka : null;
}

/**
 * Menerjemahkan satu baris tabel `books` menjadi objek `Book`.
 *
 * Kolomnya dipetakan satu per satu, bukan disalin otomatis: nama kolom
 * database dan nama field aplikasi memang berbeda, dan pemetaan eksplisit
 * membuat kolom baru terlihat saat ditambahkan.
 */
export function mapRow(row: Record<string, unknown>): Book {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    author: String(row.author),
    synopsis: teksAtauNull(row.synopsis),
    publisherInfo: String(row.publisher_info),
    bookInfo: teksAtauNull(row.book_info),
    coverPath: String(row.cover_path),
    status: row.status as BookStatus,
    estimatedRelease: teksAtauNull(row.estimated_release),
    isbn: teksAtauNull(row.isbn),
    pricePrint: angkaAtauNull(row.price_print),
    priceEbook: angkaAtauNull(row.price_ebook),
    createdAt: waktu(row.created_at),
    updatedAt: waktu(row.updated_at),
  };
}
