import Link from "next/link";
import { BookCard } from "./BookCard";
import type { Book } from "@/lib/books/types";

/**
 * Satu blok preview katalog di `/publish-buku`.
 *
 * Komponen presentasi murni: seluruh teksnya (heading, empty message,
 * tautan katalog) dikirim lewat props dari `catalogueKind`, dan kartu
 * bukunya `<BookCard>` — bukan salinan markupnya. Salinan kedua dari kartu
 * buku itulah yang membuat tampilan katalog dan preview berjalan berbeda
 * saat satu tempat dirombak.
 */
export function CataloguePreview({
  heading,
  emptyMessage,
  items,
  lihatSemuaHref,
}: {
  heading: string;
  emptyMessage: string;
  items: Book[];
  lihatSemuaHref: string;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">{heading}</h2>
        <Link
          href={lihatSemuaHref}
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-hover"
        >
          Lihat Semua
        </Link>
      </div>

      {items.length === 0 ? (
        <p data-testid="empty" className="mt-4 text-teks-sec">
          {emptyMessage}
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((buku) => (
            <li key={buku.id}>
              <BookCard book={buku} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
