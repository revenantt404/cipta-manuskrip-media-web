import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookBySlug } from "@/lib/books/repository";
import { BookDetail } from "@/components/BookDetail";

// Wajib: tanpa ini Next.js membekukan hasil query saat build dan halaman
// berhenti menampilkan perubahan yang baru disimpan admin.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const book = await getBookBySlug(slug);
    if (book === null) return {};
    return {
      title: `${book.title} — CV Cipta Manuskrip Media`,
      description: book.synopsis ?? book.bookInfo ?? undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Galat database ditangkap di sini dan digambar sebagai pesan, bukan
 * dilempar ke `error.tsx`.
 *
 * Alasannya empiris: pada Next.js 16.4.2, galat yang terjadi saat render
 * server pertama menggantikan seluruh dokumen dengan shell galat bawaan
 * framework, sehingga `error.tsx` tidak terlihat pengunjung. Katalog Fase 1
 * memakai pola ini dan terbukti benar lewat `curl` terhadap build produksi.
 */
export default async function Page({ params }: Props) {
  const { slug } = await params;

  let book;
  try {
    book = await getBookBySlug(slug);
  } catch {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Buku sedang tidak dapat dimuat</h1>
        <p data-testid="db-error" className="mt-3 text-zinc-700">
          Silakan coba beberapa saat lagi atau buka kembali tautan ini nanti.
        </p>
      </main>
    );
  }

  if (book === null) notFound();

  return <BookDetail book={book} />;
}
