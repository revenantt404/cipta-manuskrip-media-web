import Link from "next/link";
import { ArrowUpRight, LibraryBig } from "lucide-react";
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
    <section className="preview-block">
      <div className="preview-head">
        <div className="preview-heading">
          <p className="preview-kicker">Katalog buku</p>
          <h2>{heading}</h2>
        </div>
        <Link href={lihatSemuaHref} className="preview-link">
          Lihat Semua <ArrowUpRight aria-hidden="true" size={15} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div data-testid="empty" className="preview-empty">
          <span className="preview-empty-icon" aria-hidden="true">
            <LibraryBig size={20} strokeWidth={1.6} />
          </span>
          <div>
            <strong>{emptyMessage}</strong>
            <p>Daftar ini akan diperbarui begitu buku pertama siap ditampilkan.</p>
          </div>
        </div>
      ) : (
        <ul className="kat-grid">
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
