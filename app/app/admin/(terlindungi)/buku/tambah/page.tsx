import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FilePlus2, Info, Lightbulb } from "lucide-react";
import { createBookAction } from "../actions";
import { STATE_BUKU_AWAL } from "../form-state";
import { FormBuku } from "../FormBuku";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="admin-page">
      <Link href="/admin/buku" className="admin-back-link"><ArrowLeft size={15} /> Kembali ke daftar buku</Link>
      <div className="admin-page-heading admin-form-page-heading"><div><p className="admin-eyebrow">KATALOG / TAMBAH</p><h1>Tambah buku</h1><p>Lengkapi informasi berikut untuk menambahkan buku ke katalog.</p></div><span className="admin-page-heading-icon"><FilePlus2 size={21} /></span></div>
      <div className="admin-form-layout"><div className="admin-form-main"><FormBuku action={createBookAction} awal={STATE_BUKU_AWAL} /></div><aside className="admin-form-aside"><div className="admin-aside-note"><span><Lightbulb size={17} /></span><div><strong>Tips mengisi katalog</strong><p>Tulis judul dan nama penulis sesuai naskah. Slug halaman akan dibentuk otomatis dari judul.</p></div></div><div className="admin-aside-note admin-aside-note-soft"><span><Info size={17} /></span><div><strong>Periksa status terbit</strong><p>Informasi ISBN dan harga hanya berlaku untuk buku yang telah terbit.</p></div></div></aside></div>
    </div>
  );
}
