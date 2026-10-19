import { notFound } from "next/navigation";
import { listBooks } from "@/lib/books/repository";
import { catalogueKind } from "@/lib/books/status";
import { BookCard } from "@/components/BookCard";

// Wajib: tanpa ini Next.js membekukan hasil query saat build dan katalog
// berhenti menampilkan buku yang baru ditambahkan. `/admin` juga bergantung
// padanya agar tidak di-cache.
export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ status: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { status } = await params;
  const kind = catalogueKind(status);
  if (kind === null) notFound();

  const { page } = await searchParams;

  let hasil;
  try {
    hasil = await listBooks({ status: kind.status, page: Number(page ?? 1) });
  } catch {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold">{kind.heading}</h1>
        <p data-testid="db-error" className="mt-4 text-red-700">
          Katalog sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">{kind.heading}</h1>

      {hasil.items.length === 0 ? (
        <p data-testid="empty" className="mt-4">
          {kind.emptyMessage}
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {hasil.items.map((buku) => (
            <li key={buku.id}>
              <BookCard book={buku} />
            </li>
          ))}
        </ul>
      )}

      {hasil.totalPages > 1 ? (
        <nav className="mt-8 flex gap-2" aria-label="Navigasi halaman">
          {hasil.page > 1 ? (
            <a href={`?page=${hasil.page - 1}`} className="rounded border px-3 py-1">
              Prev
            </a>
          ) : null}
          {Array.from({ length: hasil.totalPages }, (_, i) => i + 1).map((n) => (
            <a
              key={n}
              href={`?page=${n}`}
              aria-current={n === hasil.page ? "page" : undefined}
              className="rounded border px-3 py-1"
            >
              {n}
            </a>
          ))}
          {hasil.page < hasil.totalPages ? (
            <a href={`?page=${hasil.page + 1}`} className="rounded border px-3 py-1">
              Next
            </a>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
