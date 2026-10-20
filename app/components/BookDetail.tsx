import { buildBookOrderUrl } from "@/lib/whatsapp";
import { resolveCoverUrl } from "@/lib/storage/path";
import { formatRupiah } from "@/lib/books/price";
import type { Book } from "@/lib/books/types";

const KELAS_TOMBOL = "rounded border px-4 py-2 hover:bg-zinc-50";

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
  const sampul = resolveCoverUrl(book.coverPath);
  const sudahTerbit = book.status === "published";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <article className="flex flex-col gap-6 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element -- sampul sudah
            diperkecil dan dikompres sharp saat diunggah; next/image belum
            dikonfigurasi. */}
        <img
          src={sampul}
          alt={`Sampul buku ${book.title}`}
          className="aspect-[2/3] w-full max-w-[200px] rounded border object-cover"
        />

        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          <p className="mt-1 text-zinc-600">{book.author}</p>

          <dl className="mt-4 flex flex-col gap-1 border-y border-garis py-3">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-sm text-zinc-600">ISBN</dt>
              <dd className="text-sm font-medium">
                {sudahTerbit ? (book.isbn ?? "-") : "Segera terbit"}
              </dd>
            </div>
            {sudahTerbit ? (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-sm text-zinc-600">Harga buku cetak</dt>
                  <dd className="text-sm font-medium">{formatRupiah(book.pricePrint)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-sm text-zinc-600">Sewa ebook</dt>
                  <dd className="text-sm font-medium">{formatRupiah(book.priceEbook)}</dd>
                </div>
              </>
            ) : null}
          </dl>

          {sudahTerbit ? (
            <>
              <h2 className="mt-6 text-lg font-medium">Sinopsis</h2>
              <p className="mt-2 whitespace-pre-line">{book.synopsis}</p>

              <div className="mt-6 flex flex-wrap gap-3">
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
            </>
          ) : (
            <>
              <h2 className="mt-6 text-lg font-medium">Informasi Buku</h2>
              <p className="mt-2 whitespace-pre-line">{book.bookInfo}</p>
              <p className="mt-4">
                <span className="font-medium">Estimasi terbit:</span>{" "}
                {book.estimatedRelease}
              </p>
            </>
          )}

          <p className="mt-8 text-sm text-zinc-600">{book.publisherInfo}</p>
        </div>
      </article>
    </div>
  );
}
