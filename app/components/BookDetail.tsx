import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarClock, ChevronRight, Hash, ShieldCheck } from "lucide-react";
import { buildBookOrderUrl } from "@/lib/whatsapp";
import { resolveCoverUrl } from "@/lib/storage/path";
import { formatRupiah } from "@/lib/books/price";
import { BookCover } from "./BookCover";
import type { Book } from "@/lib/books/types";

/**
 * Halaman detail buku — komponen presentasi murni.
 *
 * Tidak menyentuh database sama sekali: seluruh datanya datang lewat props
 * dan URL sampul dibentuk resolver terpisah. Karena itu perombakan tampilan
 * di Arena tidak bisa merusak aliran data maupun aturan pesan WhatsApp.
 *
 * ISBN dan harga tampil untuk buku yang sudah terbit, dengan `-` bila admin
 * belum menetapkannya. Buku yang segera terbit menampilkan status "Segera
 * terbit" pada baris ISBN dan **tidak** menawarkan harga maupun pesanan.
 */
export function BookDetail({ book }: { book: Book }) {
  const sudahTerbit = book.status === "published";
  const katalogHref = sudahTerbit ? "/katalog/telah-terbit" : "/katalog/segera-terbit";

  return (
    <div className="detail-page">
      <nav className="detail-crumbs" aria-label="Navigasi remah roti">
        <Link href="/">Beranda</Link>
        <ChevronRight aria-hidden="true" size={13} />
        <Link href="/publish-buku">Penerbitan Buku</Link>
        <ChevronRight aria-hidden="true" size={13} />
        <span aria-current="page">{book.title}</span>
      </nav>

      <article className="detail-shell">
        <div className="detail-media">
          <div className="detail-cover-frame">
            <BookCover
              src={resolveCoverUrl(book.coverPath)}
              alt={`Sampul buku ${book.title}`}
              title={book.title}
              className="detail-cover-image"
              sizes="(max-width: 760px) 60vw, 290px"
            />
          </div>

          <div className="detail-media-caption">
            <span className={`detail-status${sudahTerbit ? " is-published" : " is-upcoming"}`}>
              <i aria-hidden="true" />
              {sudahTerbit ? "Telah terbit" : "Segera terbit"}
            </span>
            <span className="detail-publisher">{book.publisherInfo}</span>
          </div>
        </div>

        <div className="detail-content">
          <p className="detail-kicker">{sudahTerbit ? "KATALOG BUKU TERBIT" : "DALAM PERSIAPAN TERBIT"}</p>
          <h1 className="detail-title">{book.title}</h1>
          <p className="detail-author">{book.author}</p>

          <dl className="detail-facts">
            <div className="detail-fact">
              <dt>
                <Hash aria-hidden="true" size={14} /> ISBN
              </dt>
              <dd>{sudahTerbit ? (book.isbn ?? "-") : "Segera terbit"}</dd>
            </div>

            {sudahTerbit ? (
              <>
                <div className="detail-fact">
                  <dt>Harga buku cetak</dt>
                  <dd>{formatRupiah(book.pricePrint)}</dd>
                </div>
                <div className="detail-fact">
                  <dt>Sewa ebook</dt>
                  <dd>{formatRupiah(book.priceEbook)}</dd>
                </div>
              </>
            ) : (
              <div className="detail-fact">
                <dt>
                  <CalendarClock aria-hidden="true" size={14} /> Estimasi terbit
                </dt>
                <dd>{book.estimatedRelease ?? "Belum ditentukan"}</dd>
              </div>
            )}
          </dl>

          {sudahTerbit ? (
            <>
              <section className="detail-section">
                <h2>Sinopsis</h2>
                <p className="detail-body">{book.synopsis}</p>
              </section>

              <div className="detail-order">
                <div className="detail-order-copy">
                  <span className="detail-order-icon">
                    <ShieldCheck aria-hidden="true" size={17} />
                  </span>
                  <div>
                    <strong>Pesan langsung ke admin</strong>
                    <p>Pesan otomatis terisi judul buku ini saat Anda membuka WhatsApp.</p>
                  </div>
                </div>

                <div className="detail-order-actions">
                  <a
                    href={buildBookOrderUrl(book.title, "cetak")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-button detail-button--primary"
                  >
                    Beli Buku Cetak <ArrowUpRight aria-hidden="true" size={15} />
                  </a>
                  <a
                    href={buildBookOrderUrl(book.title, "ebook")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-button"
                  >
                    Sewa Ebook <ArrowUpRight aria-hidden="true" size={15} />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <>
              <section className="detail-section">
                <h2>Informasi Buku</h2>
                <p className="detail-body">{book.bookInfo}</p>
              </section>

              <p className="detail-coming-note">
                <CalendarClock aria-hidden="true" size={16} />
                Buku ini sedang disiapkan dan belum dapat dipesan.
              </p>
            </>
          )}
        </div>
      </article>

      <div className="detail-back">
        <Link href={katalogHref} className="detail-back-link">
          <ArrowLeft aria-hidden="true" size={15} /> Kembali ke katalog
        </Link>
        <span className="detail-back-hint">Urutan katalog mengikuti judul A–Z.</span>
      </div>
    </div>
  );
}
