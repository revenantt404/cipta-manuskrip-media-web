import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, FilePlus2, LibraryBig, Plus } from "lucide-react";
import { countBooksByStatus, listAllBooks } from "@/lib/books/repository";
import { resolveCoverUrl } from "@/lib/storage/path";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { published: "Telah terbit", upcoming: "Segera terbit" };
const TANGGAL = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

export default async function Page() {
  let counts;
  let latest;
  try {
    [counts, latest] = await Promise.all([
      countBooksByStatus(),
      listAllBooks({ page: 1, pageSize: 5 }),
    ]);
  } catch {
    return (
      <div className="admin-page">
        <div className="admin-page-heading"><div><p className="admin-eyebrow">RUANG KERJA / RINGKASAN</p><h1>Ringkasan katalog</h1><p>Ikhtisar buku yang dikelola di situs Anda.</p></div></div>
        <div className="admin-notice admin-notice-error"><span className="admin-notice-mark">!</span><div><strong>Data belum dapat dimuat</strong><p>Sambungan ke database sedang tidak tersedia. Periksa konfigurasi dan koneksi database, lalu muat ulang halaman.</p></div></div>
        <div className="admin-quick-actions"><Link href="/admin/buku" className="admin-quick-card"><span className="admin-quick-icon"><BookOpen size={19} /></span><span><strong>Kelola katalog</strong><small>Buka daftar buku</small></span><ArrowRight size={16} /></Link></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div><p className="admin-eyebrow">RUANG KERJA / RINGKASAN</p><h1>Selamat datang kembali</h1><p>Pantau dan kelola katalog buku Cipta Manuskrip Media.</p></div>
        <Link href="/admin/buku/tambah" className="admin-primary-button"><Plus size={17} /> Tambah buku</Link>
      </div>

      <section className="admin-stats-grid" aria-label="Ringkasan katalog">
        <article className="admin-stat-card"><div className="admin-stat-top"><span>Total buku</span><span className="admin-stat-icon"><LibraryBig size={18} /></span></div><strong>{counts.published + counts.upcoming}</strong><small>Seluruh entri katalog</small></article>
        <article className="admin-stat-card admin-stat-published"><div className="admin-stat-top"><span>Telah terbit</span><span className="admin-stat-icon"><BookOpen size={18} /></span></div><strong>{counts.published}</strong><small>Buku tersedia di katalog</small></article>
        <article className="admin-stat-card admin-stat-upcoming"><div className="admin-stat-top"><span>Segera terbit</span><span className="admin-stat-icon"><Clock3 size={18} /></span></div><strong>{counts.upcoming}</strong><small>Dalam persiapan penerbitan</small></article>
      </section>

      <section className="admin-panel admin-recent-panel">
        <div className="admin-panel-heading"><div><p className="admin-eyebrow">PEMBARUAN TERAKHIR</p><h2>Buku terbaru</h2><p>Entri yang terakhir diperbarui akan tampil di sini.</p></div><Link href="/admin/buku" className="admin-inline-link">Lihat semua <ArrowRight size={15} /></Link></div>
        {latest.items.length === 0 ? (
          <div className="admin-empty-state"><span><BookOpen size={22} /></span><strong>Katalog masih kosong</strong><p>Mulai dengan menambahkan buku pertama ke katalog.</p><Link href="/admin/buku/tambah" className="admin-secondary-button"><FilePlus2 size={16} /> Tambah buku</Link></div>
        ) : (
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Buku</th><th scope="col">Status</th><th scope="col">Diperbarui</th><th scope="col"><span className="sr-only">Aksi</span></th></tr></thead><tbody>{latest.items.map((book) => (
            <tr key={book.id}>
              <td data-label="Buku"><div className="admin-book-cell">
                {/* eslint-disable-next-line @next/next/no-img-element -- stored user cover */}
                <img src={resolveCoverUrl(book.coverPath)} alt="" />
                <div><strong>{book.title}</strong><span>{book.author}</span></div>
              </div></td>
              <td data-label="Status"><span className={`admin-status-badge ${book.status === "published" ? "is-published" : "is-upcoming"}`}><i />{STATUS[book.status] ?? book.status}</span></td>
              <td className="admin-date-cell" data-label="Diperbarui">{TANGGAL.format(book.updatedAt)}</td>
              <td data-label="Aksi"><Link href={`/admin/buku/${book.id}/edit`} className="admin-table-action">Sunting <ArrowRight size={14} /></Link></td>
            </tr>
          ))}</tbody></table></div>
        )}
      </section>

      <section className="admin-quick-actions" aria-label="Akses cepat"><Link href="/admin/buku" className="admin-quick-card"><span className="admin-quick-icon"><BookOpen size={19} /></span><span><strong>Kelola katalog</strong><small>Telusuri, sunting, atau hapus entri buku</small></span><ArrowRight size={16} /></Link><Link href="/admin/buku/tambah" className="admin-quick-card"><span className="admin-quick-icon admin-quick-icon-gold"><FilePlus2 size={19} /></span><span><strong>Tambah buku</strong><small>Masukkan buku baru ke katalog</small></span><ArrowRight size={16} /></Link></section>
    </div>
  );
}
