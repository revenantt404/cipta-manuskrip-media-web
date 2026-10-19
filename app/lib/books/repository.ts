import { query, execute } from "../db/query";
import { slugify } from "../validation/slug";
import { validateBookInput } from "../validation/book";
import { normalizePage } from "./pagination";
import { mapRow, KOLOM_BUKU } from "./types";
import type { Book, BookStatus, Page, WriteResult } from "./types";

export { normalizePage } from "./pagination";
export { mapRow, KOLOM_BUKU } from "./types";
export type { Book, BookStatus, Page, WriteResult } from "./types";

const PAGE_SIZE_BAWAAN = 12;

/**
 * Jumlah buku per halaman. Dibaca dari environment supaya bisa diubah
 * tanpa menyentuh kode; nilai yang tidak masuk akal diabaikan diam-diam
 * dan diganti nilai bawaan, karena katalog yang tampil lebih penting
 * daripada kesalahan konfigurasi yang membuat halaman gagal total.
 */
export function pageSizeBawaan(): number {
  const mentah = process.env.BOOKS_PER_PAGE;
  if (mentah === undefined || mentah.trim() === "") return PAGE_SIZE_BAWAAN;

  const angka = Number(mentah);
  if (!Number.isInteger(angka) || angka < 1) return PAGE_SIZE_BAWAAN;

  return angka;
}

function pageSizeDipakai(diminta: number | undefined): number {
  if (diminta === undefined) return pageSizeBawaan();
  if (!Number.isInteger(diminta) || diminta < 1) return pageSizeBawaan();
  return diminta;
}

function jadikanHalaman(
  items: Book[],
  total: number,
  page: number,
  pageSize: number
): Page<Book> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Daftar buku satu status, terurut A–Z, satu halaman.
 *
 * `ORDER BY title ASC, id ASC` — `id` sebagai pemecah seri membuat
 * pagination deterministik ketika dua buku berjudul sama; tanpa itu
 * urutan baris bisa berbeda antar pemanggilan dan satu buku muncul
 * dua kali sementara buku lain hilang.
 *
 * `page` pada hasil sudah dinormalkan, sehingga pemanggil tidak perlu
 * menormalkan lagi dan penanda halaman aktif tidak bisa menyimpang dari
 * isi yang ditampilkan.
 */
export async function listBooks(opts: {
  status: BookStatus;
  page?: number;
  pageSize?: number;
}): Promise<Page<Book>> {
  const { status } = opts;
  const pageSize = pageSizeDipakai(opts.pageSize);

  const [hitung] = await query<{ total: number }>(
    "SELECT COUNT(*) AS total FROM books WHERE status = ?",
    [status]
  );
  const total = Number(hitung.total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = normalizePage(opts.page, totalPages);

  const offset = (page - 1) * pageSize;
  const baris = await query<Record<string, unknown>>(
    `SELECT ${KOLOM_BUKU} FROM books WHERE status = ? ORDER BY title ASC, id ASC LIMIT ? OFFSET ?`,
    [status, Number(pageSize), Number(offset)]
  );

  return jadikanHalaman(baris.map(mapRow), total, page, pageSize);
}

export async function getBookBySlug(slug: string): Promise<Book | null> {
  const baris = await query<Record<string, unknown>>(
    `SELECT ${KOLOM_BUKU} FROM books WHERE slug = ?`,
    [slug]
  );
  return baris.length > 0 ? mapRow(baris[0]) : null;
}

export async function getBookById(id: string): Promise<Book | null> {
  const baris = await query<Record<string, unknown>>(
    `SELECT ${KOLOM_BUKU} FROM books WHERE id = ?`,
    [id]
  );
  return baris.length > 0 ? mapRow(baris[0]) : null;
}

async function ambilSetelahTulis(id: string): Promise<Book> {
  const buku = await getBookById(id);
  if (buku === null) {
    throw new Error(`Buku ${id} hilang tepat setelah ditulis.`);
  }
  return buku;
}

function galatSlug(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "ER_DUP_ENTRY"
  );
}

/**
 * Menyimpan buku baru.
 *
 * Slug selalu diturunkan dari judul — pemanggil tidak boleh menentukannya.
 * Judul berbeda yang menghasilkan slug sama akan ditolak database lewat
 * `uq_books_slug`, dan galat mentah MySQL diterjemahkan menjadi pesan yang
 * bisa dibaca admin, bukan dibiarkan naik ke antarmuka.
 */
export async function createBook(input: unknown): Promise<WriteResult> {
  const divalidasi = validateBookInput(input);
  if (!divalidasi.ok) return { ok: false, errors: divalidasi.errors };

  const value = divalidasi.value;
  const slug = slugify(value.title);

  if (slug === "") {
    return {
      ok: false,
      errors: { title: "Judul harus memuat huruf atau angka agar alamat halamannya bisa dibentuk." },
    };
  }

  try {
    const hasil = await execute(
      `INSERT INTO books (title, slug, author, synopsis, publisher_info, book_info, cover_path, status, estimated_release)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        value.title,
        slug,
        value.author,
        value.synopsis,
        value.publisherInfo,
        value.bookInfo,
        value.coverPath,
        value.status,
        value.estimatedRelease,
      ]
    );

    const id = await idBarisBaru(hasil.insertId, slug);
    return { ok: true, book: await ambilSetelahTulis(id) };
  } catch (error) {
    if (galatSlug(error)) {
      return { ok: false, errors: { slug: "Slug sudah dipakai buku lain." } };
    }
    throw error;
  }
}

/**
 * `insertId` dari MySQL tidak berguna di sini: primary key tabel ini
 * `CHAR(36)` yang diisi `DEFAULT (UUID())`, sehingga `insertId` selalu 0.
 * Baris barunya ditemukan lewat slug, yang pasti unik.
 */
async function idBarisBaru(insertId: number, slug: string): Promise<string> {
  if (insertId > 0) return String(insertId);

  const baris = await query<{ id: string }>("SELECT id FROM books WHERE slug = ?", [slug]);
  if (baris.length === 0) {
    throw new Error(`Buku dengan slug "${slug}" tidak ditemukan tepat setelah disimpan.`);
  }
  return baris[0].id;
}

/**
 * Memperbarui buku yang ada. Slug tidak ikut berubah: alamat halaman
 * yang sudah tersebar tidak boleh mati hanya karena judulnya disunting.
 */
export async function updateBook(id: string, input: unknown): Promise<WriteResult> {
  const divalidasi = validateBookInput(input);
  if (!divalidasi.ok) return { ok: false, errors: divalidasi.errors };

  const value = divalidasi.value;

  const hasil = await execute(
    `UPDATE books
        SET title = ?, author = ?, synopsis = ?, publisher_info = ?, book_info = ?,
            cover_path = ?, status = ?, estimated_release = ?
      WHERE id = ?`,
    [
      value.title,
      value.author,
      value.synopsis,
      value.publisherInfo,
      value.bookInfo,
      value.coverPath,
      value.status,
      value.estimatedRelease,
      id,
    ]
  );

  if (hasil.affectedRows !== 1) {
    return { ok: false, errors: { form: "Buku tidak ditemukan." } };
  }

  return { ok: true, book: await ambilSetelahTulis(id) };
}

export async function deleteBook(id: string): Promise<{ ok: boolean }> {
  const hasil = await execute("DELETE FROM books WHERE id = ?", [id]);
  return { ok: hasil.affectedRows === 1 };
}
