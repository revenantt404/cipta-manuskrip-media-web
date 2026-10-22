import { ImagePlus, LockKeyhole } from "lucide-react";

export function AdminDemoBookForm({ mode = "tambah" }: { mode?: "tambah" | "edit" }) {
  const editing = mode === "edit";
  return (
    <div className="admin-book-form admin-demo-form" aria-label="Contoh formulir buku">
      <div className="admin-demo-form-notice"><LockKeyhole size={15} /><span>Mode pratinjau — isian tidak tersimpan.</span></div>
      <div className="admin-field"><label htmlFor="demo-title">Judul <b>*</b></label><input id="demo-title" className="admin-control" name="title" disabled placeholder="Judul buku" /></div>
      <div className="admin-field"><label htmlFor="demo-author">Penulis <b>*</b></label><input id="demo-author" className="admin-control" name="author" disabled placeholder="Nama penulis" /></div>
      {editing ? <div className="admin-field"><label htmlFor="demo-slug">Slug (alamat halaman)</label><input id="demo-slug" className="admin-control" name="slug" disabled placeholder="slug-buku" /><small>Alamat publik: /buku/slug-buku</small></div> : null}
      <div className="admin-field"><label htmlFor="demo-status">Status</label><select id="demo-status" className="admin-control" name="status" disabled defaultValue="published"><option value="published">Telah terbit</option><option value="upcoming">Segera terbit</option></select></div>
      <div className="admin-field"><label htmlFor="demo-synopsis">Sinopsis</label><textarea id="demo-synopsis" className="admin-control" name="synopsis" rows={4} disabled placeholder="Tulis sinopsis buku…" /><small>Wajib untuk buku yang telah terbit.</small></div>
      <div className="admin-field"><label htmlFor="demo-release">Estimasi terbit</label><input id="demo-release" className="admin-control" name="estimatedRelease" disabled placeholder="Contoh: Desember 2026" /><small>Wajib untuk buku yang segera terbit.</small></div>
      <div className="admin-field"><label htmlFor="demo-publisher">Keterangan penerbit</label><input id="demo-publisher" className="admin-control" name="publisherInfo" disabled placeholder="CV Cipta Manuskrip Media" /></div>
      <div className="admin-field"><label htmlFor="demo-isbn">ISBN</label><input id="demo-isbn" className="admin-control" name="isbn" disabled placeholder="Diisi bila tersedia" /></div>
      <div className="admin-form-two-col"><div className="admin-field"><label htmlFor="demo-print">Harga buku cetak</label><input id="demo-print" className="admin-control" name="pricePrint" disabled placeholder="—" /></div><div className="admin-field"><label htmlFor="demo-ebook">Harga sewa ebook</label><input id="demo-ebook" className="admin-control" name="priceEbook" disabled placeholder="—" /></div></div>
      <div className="admin-field"><label htmlFor="demo-info">Informasi buku</label><textarea id="demo-info" className="admin-control" name="bookInfo" rows={3} disabled placeholder="Informasi tambahan…" /></div>
      <div className="admin-field"><label htmlFor="demo-cover">Sampul</label><div className="admin-demo-upload"><ImagePlus size={19} /><span>JPEG, PNG, atau WebP</span><small>Maksimal 5 MB</small></div></div>
      <button type="button" className="admin-form-submit" disabled><LockKeyhole size={15} /> {editing ? "Simpan perubahan" : "Simpan buku"}</button>
    </div>
  );
}
