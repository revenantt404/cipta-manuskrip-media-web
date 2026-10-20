import Link from "next/link";
import { resolveCoverUrl } from "@/lib/storage/path";
import { formatRupiah } from "@/lib/books/price";
import { buildBookOrderUrl } from "@/lib/whatsapp";
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

const KELAS_TOMBOL =
  "block rounded border px-3 py-1.5 text-center text-sm hover:bg-zinc-50";

function BarisHarga({ label, nilai }: { label: string; nilai: number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-sm text-zinc-600">{label}</dt>
      <dd className="text-sm font-medium">{formatRupiah(nilai)}</dd>
    </div>
  );
}

export function BookCard({ book }: { book: Book }) {
  const sudahTerbit = book.status === "published";

  return (
    <article className="flex flex-col rounded border p-3">
      <Link href={`/buku/${book.slug}`} className="block">
        {/* eslint-disable-next-line @next/next/no-img-element -- sampul sudah
            diperkecil dan dikompres sharp saat diunggah; next/image belum
            dikonfigurasi. */}
        <img
          src={resolveCoverUrl(book.coverPath)}
          alt={`Sampul buku ${book.title}`}
          className="mb-3 aspect-[2/3] w-full rounded object-cover"
        />
        <p className="font-medium leading-snug">{book.title}</p>
        <p className="mt-1 text-sm text-zinc-600">{book.author}</p>
      </Link>

      <dl className="mt-2 flex flex-col gap-1 border-t border-garis pt-2">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-sm text-zinc-600">ISBN</dt>
          <dd className="text-sm font-medium">
            {sudahTerbit ? (book.isbn ?? "-") : "Segera terbit"}
          </dd>
        </div>

        {sudahTerbit ? (
          <>
            <BarisHarga label="Harga cetak" nilai={book.pricePrint} />
            <BarisHarga label="Sewa ebook" nilai={book.priceEbook} />
          </>
        ) : null}
      </dl>

      {/*
        Tombol hanya untuk buku yang sudah terbit. Buku yang belum terbit
        tidak boleh punya tautan `wa.me` sama sekali — itu janji penjualan
        untuk buku yang belum ada, dan aturan ini dikunci tes.
      */}
      {sudahTerbit ? (
        <div className="mt-3 flex flex-col gap-2">
          <a
            href={buildBookOrderUrl(book.title, "cetak")}
            target="_blank"
            rel="noopener noreferrer"
            className={KELAS_TOMBOL}
          >
            Beli Buku Cetak
          </a>
          <a
            href={buildBookOrderUrl(book.title, "ebook")}
            target="_blank"
            rel="noopener noreferrer"
            className={KELAS_TOMBOL}
          >
            Sewa Ebook
          </a>
        </div>
      ) : null}
    </article>
  );
}
