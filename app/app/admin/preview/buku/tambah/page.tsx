import Link from "next/link";
import { ArrowLeft, FilePlus2, Lightbulb } from "lucide-react";
import { AdminDemoBookForm } from "@/components/AdminDemoBookForm";

export default function Page() {
  return <div className="admin-page"><Link href="/admin/preview/buku" className="admin-back-link"><ArrowLeft size={15} /> Kembali ke daftar buku</Link><div className="admin-page-heading admin-form-page-heading"><div><p className="admin-eyebrow">KATALOG / TAMBAH</p><h1>Tambah buku</h1><p>Contoh tampilan formulir untuk menambahkan buku ke katalog.</p></div><span className="admin-page-heading-icon"><FilePlus2 size={21} /></span></div><div className="admin-form-layout"><div className="admin-form-main"><AdminDemoBookForm /></div><aside className="admin-form-aside"><div className="admin-aside-note"><span><Lightbulb size={17} /></span><div><strong>Slug otomatis</strong><p>Alamat halaman buku akan dibentuk dari judul ketika form terhubung ke database.</p></div></div><div className="admin-aside-note admin-aside-note-soft"><span><FilePlus2 size={17} /></span><div><strong>Pratinjau saja</strong><p>Form demo tidak mengirim atau menyimpan data.</p></div></div></aside></div></div>;
}
