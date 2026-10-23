import { BookOpen, ImagePlus, Info, LockKeyhole, Save, Tag } from "lucide-react";

/**
 * Contoh formulir buku untuk mode pratinjau admin.
 *
 * Struktur kolomnya sengaja mengikuti `FormBuku` yang sebenarnya: bagian
 * identitas, isi & penerbitan, data terbit, lalu sampul. Kalau pratinjau
 * menampilkan susunan lain, pemilik CV belajar tata letak yang tidak akan
 * ia temui saat masuk sungguhan.
 */
export function AdminDemoBookForm({ mode = "tambah" }: { mode?: "tambah" | "edit" }) {
  const editing = mode === "edit";

  return (
    <div className="admin-book-form admin-demo-form" aria-label="Contoh formulir buku">
      <div className="admin-demo-form-notice">
        <LockKeyhole size={15} />
        <span>Mode pratinjau — isian tidak tersimpan.</span>
      </div>

      <section className="admin-form-section">
        <header className="admin-form-section-head">
          <span className="admin-form-section-icon" aria-hidden="true">
            <BookOpen size={16} />
          </span>
          <div>
            <h3>Identitas buku</h3>
            <p>Judul, penulis, dan status yang tampil di katalog.</p>
          </div>
        </header>

        <div className="admin-field-grid">
          <div className="admin-field">
            <label htmlFor="demo-title">Judul <b aria-hidden="true">*</b></label>
            <input id="demo-title" className="admin-control" name="title" disabled placeholder="Judul buku" />
          </div>
          <div className="admin-field">
            <label htmlFor="demo-author">Penulis <b aria-hidden="true">*</b></label>
            <input id="demo-author" className="admin-control" name="author" disabled placeholder="Nama penulis" />
          </div>
        </div>

        {editing ? (
          <div className="admin-field">
            <label htmlFor="demo-slug">Slug (alamat halaman)</label>
            <input id="demo-slug" className="admin-control" name="slug" disabled placeholder="slug-buku" />
            <p className="admin-field-hint">Alamat publik: <code>/buku/slug-buku</code></p>
          </div>
        ) : null}

        <div className="admin-field">
          <label htmlFor="demo-status">Status terbit</label>
          <select id="demo-status" className="admin-control" name="status" disabled defaultValue="published">
            <option value="published">Telah terbit</option>
            <option value="upcoming">Segera terbit</option>
          </select>
          <p className="admin-field-hint">Buku terbit tampil lengkap dengan ISBN dan harga.</p>
        </div>
      </section>

      <section className="admin-form-section">
        <header className="admin-form-section-head">
          <span className="admin-form-section-icon" aria-hidden="true">
            <Info size={16} />
          </span>
          <div>
            <h3>Isi &amp; penerbitan</h3>
            <p>Teks yang dibaca pengunjung di halaman detail buku.</p>
          </div>
        </header>

        <div className="admin-field">
          <label htmlFor="demo-synopsis">Sinopsis</label>
          <textarea id="demo-synopsis" className="admin-control" name="synopsis" rows={4} disabled placeholder="Tulis sinopsis buku…" />
          <p className="admin-field-hint">Wajib untuk buku yang telah terbit.</p>
        </div>

        <div className="admin-field">
          <label htmlFor="demo-release">Estimasi terbit</label>
          <input id="demo-release" className="admin-control" name="estimatedRelease" disabled placeholder="Contoh: Desember 2026" />
          <p className="admin-field-hint">Wajib untuk buku yang segera terbit.</p>
        </div>

        <div className="admin-field">
          <label htmlFor="demo-publisher">Keterangan penerbit</label>
          <input id="demo-publisher" className="admin-control" name="publisherInfo" disabled placeholder="CV Cipta Manuskrip Media" />
        </div>
      </section>

      <section className="admin-form-section">
        <header className="admin-form-section-head">
          <span className="admin-form-section-icon" aria-hidden="true">
            <Tag size={16} />
          </span>
          <div>
            <h3>Data terbit</h3>
            <p>ISBN dan harga ditampilkan di katalog publik.</p>
          </div>
        </header>

        <div className="admin-field">
          <label htmlFor="demo-isbn">ISBN</label>
          <input id="demo-isbn" className="admin-control" name="isbn" disabled placeholder="Diisi bila tersedia" />
        </div>

        <div className="admin-field-grid">
          <div className="admin-field">
            <label htmlFor="demo-print">Harga buku cetak</label>
            <input id="demo-print" className="admin-control" name="pricePrint" disabled placeholder="—" />
          </div>
          <div className="admin-field">
            <label htmlFor="demo-ebook">Harga sewa ebook</label>
            <input id="demo-ebook" className="admin-control" name="priceEbook" disabled placeholder="—" />
          </div>
        </div>
      </section>

      <section className="admin-form-section">
        <header className="admin-form-section-head">
          <span className="admin-form-section-icon" aria-hidden="true">
            <ImagePlus size={16} />
          </span>
          <div>
            <h3>Sampul buku</h3>
            <p>Gambar diproses otomatis menjadi WebP.</p>
          </div>
        </header>

        <div className="admin-field">
          <label htmlFor="demo-cover">Berkas sampul</label>
          <input id="demo-cover" type="file" className="admin-control" disabled />
          <p className="admin-field-hint">JPEG, PNG, atau WebP; maksimal 5 MB.</p>
        </div>
      </section>

      <div className="admin-form-actions">
        <p className="admin-form-actions-note">Pratinjau saja — tombol ini tidak menyimpan apa pun.</p>
        <button type="button" className="admin-form-submit" disabled>
          <Save aria-hidden="true" size={16} />
          {editing ? "Simpan perubahan" : "Simpan buku"}
        </button>
      </div>
    </div>
  );
}
