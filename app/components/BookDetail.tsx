import { buildBookOrderUrl } from "@/lib/whatsapp";
import { resolveCoverUrl } from "@/lib/storage/path";
import type { Book } from "@/lib/books/types";

const KELAS_TOMBOL = "rounded border px-4 py-2 hover:bg-zinc-50";

/**
 * Halaman detail buku — komponen presentasi murni.
 *
 * Tidak menyentuh database sama sekali: seluruh datanya datang lewat props
 * dan URL sampul dibentuk resolver terpisah. Karena itu perombakan tampilan
 * di Arena tidak bisa merusak aliran data maupun aturan pesan WhatsApp.
 */
export function BookDetail({ book }: { book: Book }) {
  const sampul = resolveCoverUrl(book.coverPath);
  const sudahTerbit = book.status === "published";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <article className="flex flex-col gap-6 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element -- sampul sudah
            diperkecil dan dikompres sharp saat diunggah; next/image baru
            dikonfigurasi bersama perombakan tampilan di Fase 3. */}
        <img
          src={sampul}
          alt={`Sampul buku ${book.title}`}
          className="aspect-[2/3] w-full max-w-[200px] rounded border object-cover"
        />

        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          <p className="mt-1 text-zinc-600">{book.author}</p>

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
                  Pesan Buku Cetak
                </a>
                <a
                  href={buildBookOrderUrl(book.title, "ebook")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={KELAS_TOMBOL}
                >
                  Sewa E-book
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
