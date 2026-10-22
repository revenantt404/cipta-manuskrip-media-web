import Link from "next/link";
import { ArrowRight, FilePlus2, BookOpen } from "lucide-react";
import { DEMO_BUKU } from "../demo-data";

export default function Page() {
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><p className="admin-eyebrow">KATALOG / BUKU</p><h1>Kelola buku</h1><p>Pratinjau daftar buku dan navigasi aksi.</p></div><Link href="/admin/preview/buku/tambah" className="admin-primary-button"><FilePlus2 size={17} /> Tambah buku</Link></div>
      <div className="admin-notice admin-notice-demo"><span className="admin-notice-mark">i</span><div><strong>Data simulasi</strong><p>Contoh ini tidak berasal dari database dan tidak dapat disunting atau dihapus.</p></div></div>
      <section className="admin-panel admin-books-panel"><div className="admin-list-toolbar"><div className="admin-list-count"><span className="admin-list-count-icon"><BookOpen size={17} /></span><span><strong>Daftar contoh</strong><small>Struktur mengikuti field katalog</small></span></div><span className="admin-search-hint">Urutan terbaru</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th scope="col">Judul &amp; penulis</th><th scope="col">Status</th><th scope="col">Diperbarui</th><th scope="col"><span className="sr-only">Aksi</span></th></tr></thead><tbody>{DEMO_BUKU.map((book) => <tr key={book.id}><td><div className="admin-book-cell"><span className="admin-demo-cover"><BookOpen size={18} /></span><div><strong>{book.title}</strong><span>{book.author}</span><small>/buku/{book.slug}</small></div></div></td><td><span className={`admin-status-badge ${book.status === "published" ? "is-published" : "is-upcoming"}`}><i />{book.status === "published" ? "Telah terbit" : "Segera terbit"}</span></td><td className="admin-date-cell">{book.updated}</td><td><Link href={`/admin/preview/buku/${book.id}/edit`} className="admin-table-action">Detail <ArrowRight size={14} /></Link></td></tr>)}</tbody></table></div><div className="admin-list-footer"><span>Contoh tampilan saja</span><span className="admin-pagination"><span>Data demo</span></span></div></section>
    </div>
  );
}
