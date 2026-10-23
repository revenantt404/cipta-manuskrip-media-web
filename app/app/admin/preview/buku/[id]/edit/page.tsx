import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminDemoBookForm } from "@/components/AdminDemoBookForm";
import { DEMO_BUKU } from "../../../demo-data";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = DEMO_BUKU.find((item) => item.id === id);
  if (!book) notFound();

  return <div className="admin-page"><Link href="/admin/preview/buku" className="admin-back-link"><ArrowLeft size={15} /> Kembali ke daftar buku</Link><div className="admin-page-heading admin-form-page-heading"><div><p className="admin-eyebrow">KATALOG / SUNTING</p><h1>Sunting buku</h1><p>Pratinjau tampilan detail pengelolaan buku.</p></div><Link href="/" className="admin-secondary-button"><ExternalLink size={15} /> Lihat situs</Link></div><div className="admin-notice admin-notice-demo"><span className="admin-notice-mark">i</span><div><strong>Data contoh</strong><p>Perubahan tidak disimpan dan tidak memengaruhi katalog.</p></div></div><div className="admin-form-layout admin-edit-layout"><div className="admin-form-main"><AdminDemoBookForm mode="edit" /></div><aside className="admin-form-aside"><div className="admin-cover-preview"><div className="admin-cover-preview-head"><span><FileText size={15} /> Sampul saat ini</span><span className="admin-cover-preview-status">CONTOH</span></div><div className="admin-cover-placeholder"><FileText size={27} /><small>SAMPUL PRATINJAU</small></div><strong>{book.title}</strong><small>{book.author}</small></div><div className="admin-danger-zone"><div className="admin-danger-heading"><span><Trash2 size={16} /></span><strong>Hapus buku</strong></div><p>Aksi penghapusan hanya tersedia pada panel yang terhubung ke database.</p><button className="admin-delete-button" type="button" disabled>Hapus buku</button></div></aside></div></div>;
}
