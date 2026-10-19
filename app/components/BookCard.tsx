import { resolveCoverUrl } from "@/lib/storage/path";
import type { Book } from "@/lib/books/types";

/**
 * Kartu buku di katalog.
 *
 * Komponen presentasi murni: impornya hanya tipe `Book` dan resolver URL
 * sampul, tidak ada akses database. Karena itu perombakan tampilan di Arena
 * nanti tidak bisa merusak aliran data.
 *
 * Sampul sudah tersedia sejak Fase 2 — diunggah admin, diproses sharp, dan
 * disajikan `/covers/[berkas]` — jadi yang ditampilkan adalah berkas
 * sungguhan, bukan kotak penanda tempat.
 */
export function BookCard({ book }: { book: Book }) {
  return (
    <a href={`/buku/${book.slug}`} className="block rounded border p-3 hover:bg-zinc-50">
      {/* eslint-disable-next-line @next/next/no-img-element -- sampul sudah
          diperkecil dan dikompres sharp saat diunggah; next/image baru
          dikonfigurasi bersama perombakan tampilan di Fase 3. */}
      <img
        src={resolveCoverUrl(book.coverPath)}
        alt={`Sampul buku ${book.title}`}
        className="mb-3 aspect-[2/3] w-full rounded object-cover"
      />
      <p className="font-medium leading-snug">{book.title}</p>
      <p className="mt-1 text-sm text-zinc-600">{book.author}</p>
    </a>
  );
}
