import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Info, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getBookById } from "@/lib/books/repository";
import { nilaiFormHarga } from "@/lib/books/price";
import { resolveCoverUrl } from "@/lib/storage/path";
import { FormBuku } from "../../FormBuku";
import { TombolHapus } from "../../TombolHapus";
import { updateBookAction, deleteBookAction } from "../../actions";
import type { AksiFormBuku, AksiHapusBuku, StateFormBuku } from "../../form-state";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let buku;
  try {
    buku = await getBookById(id);
  } catch {
    return <div className="admin-page"><Link href="/admin/buku" className="admin-back-link"><ArrowLeft size={15} /> Kembali ke daftar buku</Link><div className="admin-notice admin-notice-error"><span className="admin-notice-mark">!</span><div><strong>Data buku belum dapat dimuat</strong><p>Periksa koneksi database, lalu coba muat ulang halaman.</p></div></div></div>;
  }
  if (buku === null) notFound();

  const awal: StateFormBuku = {
    errors: {},
    nilai: {
      title: buku.title, slug: buku.slug, author: buku.author,
      synopsis: buku.synopsis ?? "", publisherInfo: buku.publisherInfo,
      bookInfo: buku.bookInfo ?? "", status: buku.status,
      estimatedRelease: buku.estimatedRelease ?? "", isbn: buku.isbn ?? "",
      pricePrint: nilaiFormHarga(buku.pricePrint), priceEbook: nilaiFormHarga(buku.priceEbook),
    },
    percobaan: 0,
    ulangiSampul: false,
  };
  const ubahBuku: AksiFormBuku = updateBookAction.bind(null, buku.id);
  const hapusBukuAksi: AksiHapusBuku = deleteBookAction.bind(null, buku.id);

  return (
    <div className="admin-page">
      <Link href="/admin/buku" className="admin-back-link"><ArrowLeft size={15} /> Kembali ke daftar buku</Link>
      <div className="admin-page-heading admin-form-page-heading"><div><p className="admin-eyebrow">KATALOG / SUNTING</p><h1>Sunting buku</h1><p>Perbarui detail dan status entri katalog.</p></div><Link href={`/buku/${buku.slug}`} target="_blank" rel="noreferrer" className="admin-secondary-button"><ExternalLink size={15} /> Lihat halaman publik</Link></div>
      <div className="admin-form-layout admin-edit-layout">
        <div className="admin-form-main"><FormBuku action={ubahBuku} awal={awal} mode="edit" /></div>
        <aside className="admin-form-aside admin-edit-aside">
          <div className="admin-cover-preview">
            <div className="admin-cover-preview-head"><span><FileText size={15} /> Sampul saat ini</span><span className="admin-cover-preview-status">{buku.status === "published" ? "TERBIT" : "SEGERA"}</span></div>
            {/* eslint-disable-next-line @next/next/no-img-element -- stored user cover */}
            <img src={resolveCoverUrl(buku.coverPath)} alt={`Sampul ${buku.title}`} />
            <strong>{buku.title}</strong><small>{buku.author}</small><p>Kosongkan pilihan sampul di formulir bila tidak ingin menggantinya.</p>
          </div>
          <div className="admin-danger-zone"><div className="admin-danger-heading"><span><Trash2 size={16} /></span><strong>Hapus buku</strong></div><p>Entri katalog dan berkas sampul akan dihapus. Tindakan ini tidak dapat dibatalkan.</p><TombolHapus action={hapusBukuAksi} judul={buku.title} /></div>
          <div className="admin-aside-note admin-aside-note-soft"><span><Info size={16} /></span><div><strong>Perubahan slug</strong><p>Jika slug diubah, tautan publik lama tidak lagi mengarah ke halaman buku ini.</p></div></div>
        </aside>
      </div>
    </div>
  );
}
