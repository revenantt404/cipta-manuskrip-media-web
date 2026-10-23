import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, FilePlus2, Search } from "lucide-react";
import { listAllBooks } from "@/lib/books/repository";
import { resolveCoverUrl } from "@/lib/storage/path";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const STATUS: Record<string, string> = { published: "Telah terbit", upcoming: "Segera terbit" };
const TANGGAL = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  let hasil;
  try {
    hasil = await listAllBooks({ page: Number(page ?? 1) });
  } catch {
    return <div className="admin-page"><div className="admin-page-heading"><div><p className="admin-eyebrow">KATALOG / BUKU</p><h1>Kelola buku</h1><p>Semua buku dalam satu tempat.</p></div></div><div className="admin-notice admin-notice-error"><span className="admin-notice-mark">!</span><div><strong>Daftar buku belum dapat dimuat</strong><p>Periksa koneksi database, lalu coba muat ulang halaman.</p></div></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><p className="admin-eyebrow">KATALOG / BUKU</p><h1>Kelola buku</h1><p>Semua buku, status, dan detail katalog dalam satu tempat.</p></div><Link href="/admin/buku/tambah" className="admin-primary-button"><FilePlus2 size={17} /> Tambah buku</Link></div>
      <section className="admin-panel admin-books-panel">
        <div className="admin-list-toolbar"><div className="admin-list-count"><span className="admin-list-count-icon"><BookOpen size={17} /></span><span><strong>{hasil.total} buku</strong><small>Seluruh status dalam katalog</small></span></div><span className="admin-search-hint"><Search size={15} /> Diurutkan dari yang terbaru</span></div>
        {hasil.items.length === 0 ? (
          <div className="admin-empty-state"><span><BookOpen size={22} /></span><strong>Belum ada buku di katalog</strong><p>Tambahkan entri pertama, lalu kelola informasinya dari sini.</p><Link href="/admin/buku/tambah" className="admin-primary-button"><FilePlus2 size={16} /> Tambah buku</Link></div>
        ) : (
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Judul &amp; penulis</th><th scope="col">Status</th><th scope="col">Terakhir diperbarui</th><th scope="col" className="admin-action-heading"><span className="sr-only">Aksi</span></th></tr></thead><tbody>{hasil.items.map((book) => (
            <tr key={book.id}>
              <td data-label="Buku"><div className="admin-book-cell">
                {/* eslint-disable-next-line @next/next/no-img-element -- stored user cover */}
                <img src={resolveCoverUrl(book.coverPath)} alt="" />
                <div><strong>{book.title}</strong><span>{book.author}</span><small>/buku/{book.slug}</small></div>
              </div></td>
              <td data-label="Status"><span className={`admin-status-badge ${book.status === "published" ? "is-published" : "is-upcoming"}`}><i />{STATUS[book.status] ?? book.status}</span></td>
              <td className="admin-date-cell" data-label="Diperbarui">{TANGGAL.format(book.updatedAt)}</td>
              <td data-label="Aksi"><div className="admin-row-actions"><Link href={`/buku/${book.slug}`} target="_blank" rel="noreferrer" className="admin-table-action admin-view-action">Lihat <ArrowUpRightIcon /></Link><Link href={`/admin/buku/${book.id}/edit`} className="admin-table-action">Sunting <ArrowRight size={14} /></Link></div></td>
            </tr>
          ))}</tbody></table></div>
        )}
        {hasil.items.length > 0 ? <div className="admin-list-footer"><span>Menampilkan {hasil.items.length} dari {hasil.total} buku</span>{hasil.totalPages > 1 ? <nav className="admin-pagination" aria-label="Navigasi halaman daftar buku">{hasil.page > 1 ? <Link href={`?page=${hasil.page - 1}`} aria-label="Halaman sebelumnya"><ArrowLeft size={15} /></Link> : null}<span>Halaman <strong>{hasil.page}</strong> dari {hasil.totalPages}</span>{hasil.page < hasil.totalPages ? <Link href={`?page=${hasil.page + 1}`} aria-label="Halaman selanjutnya"><ArrowRight size={15} /></Link> : null}</nav> : null}</div> : null}
      </section>
    </div>
  );
}

function ArrowUpRightIcon() {
  return <span aria-hidden="true" className="admin-arrow-up-right">↗</span>;
}
