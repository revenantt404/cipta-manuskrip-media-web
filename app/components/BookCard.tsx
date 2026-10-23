import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { resolveCoverUrl } from "@/lib/storage/path";
import { formatRupiah } from "@/lib/books/price";
import { buildBookOrderUrl } from "@/lib/whatsapp";
import { BookCover } from "./BookCover";
import type { Book } from "@/lib/books/types";

/**
 * Kartu buku di katalog.
 *
 * Komponen presentasi murni: impornya hanya tipe `Book`, resolver URL
 * sampul, formatter harga, dan pembentuk tautan WhatsApp — tidak ada akses
 * database. Karena itu perombakan tampilan di Arena nanti tidak bisa
 * merusak aliran data.
 *
 * Sampul sudah tersedia sejak Fase 2 — diunggah admin, diproses sharp, dan
 * disajikan `/covers/[berkas]` — jadi yang ditampilkan adalah berkas
 * sungguhan, bukan kotak penanda tempat.
 *
 * Dua bentuk kartu, ditentukan status buku:
 *
 * - **Telah terbit**: ISBN, harga cetak, harga sewa ebook, dan dua tombol
 *   pesan WhatsApp. Harga yang belum ditetapkan tampil sebagai `-`.
 * - **Segera terbit**: ISBN ditampilkan sebagai teks "Segera terbit", tanpa
 *   harga dan tanpa tombol apa pun. Katalog ini dipakai untuk pengajuan ke
 *   Perpusnas, dan buku yang belum terbit memang belum dijual.
 */
export function BookCard({ book }: { book: Book }) {
  const sudahTerbit = book.status === "published";
  const href = `/buku/${book.slug}`;

  return (
    <article className={`kat-card${sudahTerbit ? " kat-card--published" : " kat-card--upcoming"}`}>
      <Link href={href} className="kat-card-media" tabIndex={-1} aria-hidden="true">
        <BookCover
          src={resolveCoverUrl(book.coverPath)}
          alt={`Sampul buku ${book.title}`}
          title={book.title}
          className="kat-card-cover"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
        />
        <span className="kat-card-badge">{sudahTerbit ? "Telah terbit" : "Segera terbit"}</span>
      </Link>

      <div className="kat-card-body">
        <h3 className="kat-card-title">
          <Link href={href}>{book.title}</Link>
        </h3>
        <p className="kat-card-author">{book.author}</p>

        <dl className="kat-card-meta">
          <div className="kat-card-row">
            <dt>ISBN</dt>
            <dd>{sudahTerbit ? (book.isbn ?? "-") : "Segera terbit"}</dd>
          </div>

          {sudahTerbit ? (
            <>
              <div className="kat-card-row">
                <dt>Harga cetak</dt>
                <dd>{formatRupiah(book.pricePrint)}</dd>
              </div>
              <div className="kat-card-row">
                <dt>Sewa ebook</dt>
                <dd>{formatRupiah(book.priceEbook)}</dd>
              </div>
            </>
          ) : book.estimatedRelease ? (
            <div className="kat-card-row">
              <dt>Estimasi terbit</dt>
              <dd>{book.estimatedRelease}</dd>
            </div>
          ) : null}
        </dl>

        {/*
          Tombol hanya untuk buku yang sudah terbit. Buku yang belum terbit
          tidak boleh punya tautan `wa.me` sama sekali — itu janji penjualan
          untuk buku yang belum ada, dan aturan ini dikunci tes.
        */}
        {sudahTerbit ? (
          <div className="kat-card-actions">
            <a
              href={buildBookOrderUrl(book.title, "cetak")}
              target="_blank"
              rel="noopener noreferrer"
              className="kat-card-cta kat-card-cta--primary"
            >
              Beli Buku Cetak
            </a>
            <a
              href={buildBookOrderUrl(book.title, "ebook")}
              target="_blank"
              rel="noopener noreferrer"
              className="kat-card-cta"
            >
              Sewa Ebook
            </a>
          </div>
        ) : (
          <p className="kat-card-note">
            Buku ini sedang disiapkan dan belum dapat dipesan.
          </p>
        )}

        <Link href={href} className="kat-card-detail">
          Lihat detail buku <ArrowUpRight aria-hidden="true" size={14} />
        </Link>
      </div>
    </article>
  );
}
