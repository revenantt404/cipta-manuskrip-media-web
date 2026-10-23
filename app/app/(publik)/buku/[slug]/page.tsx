import type { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, ServerCrash } from "lucide-react";
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
      // Judul polos: template root (`%s — CV Cipta Manuskrip Media`) yang
      // menambahkan akhiran; menulis lengkap di sini menggandakannya.
      title: book.title,
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
      <div className="detail-page">
        <div data-testid="db-error" className="detail-error" role="status">
          <span className="detail-error-icon" aria-hidden="true">
            <ServerCrash size={20} strokeWidth={1.6} />
          </span>
          <div>
            <h1>Buku sedang tidak dapat dimuat</h1>
            <p>
              Silakan coba beberapa saat lagi atau buka kembali tautan ini nanti.
              Katalog lain di situs ini tetap dapat dibuka.
            </p>
            <div className="detail-error-actions">
              <Link href={`/buku/${slug}`} className="detail-error-retry">
                <RefreshCw aria-hidden="true" size={14} /> Muat ulang halaman
              </Link>
              <Link href="/publish-buku" className="detail-error-link">
                Kembali ke halaman penerbitan buku
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (book === null) notFound();

  return <BookDetail book={book} />;
}
