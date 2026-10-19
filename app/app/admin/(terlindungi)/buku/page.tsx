import type { Metadata } from "next";
import Link from "next/link";
import { listAllBooks } from "@/lib/books/repository";
import { resolveCoverUrl } from "@/lib/storage/path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const LABEL_STATUS: Record<string, string> = {
  published: "Telah terbit",
  upcoming: "Segera terbit",
};

/**
 * Daftar seluruh buku untuk admin.
 *
 * Kedua status tampil di satu halaman: admin perlu melihat seluruh isi
 * katalog sekaligus, bukan dua halaman terpisah yang harus ia ingat.
 * Halaman publik tetap memisahkannya lewat `/katalog/[status]`.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;

  let hasil;
  try {
    hasil = await listAllBooks({ page: Number(page ?? 1) });
  } catch {
    return (
      <>
        <h1 className="text-2xl font-semibold">Kelola Buku</h1>
        <p data-testid="db-error" className="mt-4 text-red-700">
          Daftar buku sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Kelola Buku</h1>
        <Link
          href="/admin/buku/tambah"
          className="rounded border px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Tambah buku
        </Link>
      </div>

      <p className="mt-1 text-sm text-zinc-600">
        {hasil.total} buku di katalog.
      </p>

      {hasil.items.length === 0 ? (
        <p data-testid="empty" className="mt-6">
          Belum ada buku. Mulai dengan menambahkannya.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {hasil.items.map((buku) => (
            <li
              key={buku.id}
              className="flex flex-wrap items-center gap-4 rounded border p-3"
            >
              {/* Sampul sudah diperkecil dan dikompres sharp saat diunggah;
                  next/image baru dikonfigurasi di Fase 3. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveCoverUrl(buku.coverPath)}
                alt={`Sampul ${buku.title}`}
                className="h-24 w-16 rounded border object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">{buku.title}</p>
                <p className="text-sm text-zinc-600">{buku.author}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {LABEL_STATUS[buku.status] ?? buku.status}
                  {" · "}
                  <span className="font-mono">{buku.slug}</span>
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/buku/${buku.slug}`}
                  className="rounded border px-3 py-1 text-sm hover:bg-zinc-50"
                >
                  Lihat
                </Link>
                <Link
                  href={`/admin/buku/${buku.id}/edit`}
                  className="rounded border px-3 py-1 text-sm hover:bg-zinc-50"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasil.totalPages > 1 ? (
        <nav className="mt-8 flex gap-2" aria-label="Navigasi halaman">
          {Array.from({ length: hasil.totalPages }, (_, i) => i + 1).map((n) => (
            <a
              key={n}
              href={`?page=${n}`}
              aria-current={n === hasil.page ? "page" : undefined}
              className={
                n === hasil.page
                  ? "rounded border bg-zinc-900 px-3 py-1 text-white"
                  : "rounded border px-3 py-1"
              }
            >
              {n}
            </a>
          ))}
        </nav>
      ) : null}
    </>
  );
}
