import type { Book } from "@/lib/books/types";

/**
 * Kartu buku di katalog.
 *
 * Komponen presentasi murni: satu-satunya impornya adalah tipe `Book`,
 * tidak ada akses database. Karena itu perombakan tampilan di Arena nanti
 * tidak bisa merusak aliran data.
 *
 * Sampul belum ditampilkan — berkasnya baru ada di Fase 3 dan `next/image`
 * belum dikonfigurasi. Kotak abu menandai tempatnya.
 */
export function BookCard({ book }: { book: Book }) {
  return (
    <a href={`/buku/${book.slug}`} className="block rounded border p-3 hover:bg-zinc-50">
      <div
        aria-hidden="true"
        className="mb-3 aspect-[2/3] w-full rounded bg-zinc-200"
      />
      <p className="font-medium leading-snug">{book.title}</p>
      <p className="mt-1 text-sm text-zinc-600">{book.author}</p>
    </a>
  );
}
