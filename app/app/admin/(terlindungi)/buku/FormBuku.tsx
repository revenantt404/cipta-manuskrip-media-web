"use client";

import { useActionState, useState } from "react";
import { AlertCircle, BookOpen, CalendarClock, ImagePlus, Info, Save, Tag } from "lucide-react";
import { PILIHAN_STATUS } from "./form-state";
import type { AksiFormBuku, StateFormBuku } from "./form-state";

/**
 * Formulir tambah/sunting buku.
 *
 * Satu komponen dengan seluruh kolomnya, bukan kumpulan field terpisah:
 * kesebelas kolom ini selalu muncul bersama, dan memecahnya hanya membuat
 * tiap field perlu diberi tahu keadaan galatnya sendiri.
 *
 * `key` pada form berubah setiap percobaan. Itulah yang membuat isian
 * tidak hilang saat validasi gagal — React mereset form setiap action
 * selesai, sehingga nilai di DOM saja tidak cukup untuk mempertahankannya.
 *
 * Kolomnya dikelompokkan menjadi tiga bagian supaya admin yang baru pertama
 * kali mengisi tidak perlu menebak urutan: identitas buku, isi & penerbitan,
 * lalu data terbit (ISBN dan harga) yang hanya berlaku untuk buku terbit.
 * Atribut `name`, `id`, dan pesan galatnya tidak berubah — perubahan di sini
 * hanya tata letak dan keterangan.
 */

function PesanGalat({ pesan }: { pesan: string | undefined }) {
  if (pesan === undefined) return null;
  return (
    <p className="admin-field-error">
      <AlertCircle aria-hidden="true" size={13} />
      {pesan}
    </p>
  );
}

function Petunjuk({ children }: { children: React.ReactNode }) {
  return <p className="admin-field-hint">{children}</p>;
}

export function FormBuku({
  action,
  awal,
  mode = "tambah",
}: {
  action: AksiFormBuku;
  awal: StateFormBuku;
  mode?: "tambah" | "edit";
}) {
  const [state, formAction, sedangProses] = useActionState(action, awal);
  const { nilai, errors } = state;
  const menyunting = mode === "edit";

  // Status dipantau di klien hanya untuk menonaktifkan isian yang tidak
  // berlaku. Server tetap penentu: `validateBookText` menolak ISBN/harga
  // pada buku segera terbit siapa pun yang menyunting HTML-nya.
  const [status, setStatus] = useState(nilai.status === "" ? "published" : nilai.status);
  const segeraTerbit = status === "upcoming";

  const kelasKontrol = (salah: boolean) => `admin-control${salah ? " is-invalid" : ""}`;

  return (
    <form
      key={state.percobaan}
      action={formAction}
      encType="multipart/form-data"
      className="admin-book-form"
    >
      {errors.form !== undefined ? (
        <p data-testid="galat-form" className="admin-form-error">
          <AlertCircle aria-hidden="true" size={16} />
          {errors.form}
        </p>
      ) : null}

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
            <label htmlFor="title">
              Judul <b aria-hidden="true">*</b>
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={nilai.title}
              aria-invalid={errors.title !== undefined}
              placeholder="Judul buku"
              className={kelasKontrol(errors.title !== undefined)}
            />
            <PesanGalat pesan={errors.title} />
          </div>

          <div className="admin-field">
            <label htmlFor="author">
              Penulis <b aria-hidden="true">*</b>
            </label>
            <input
              id="author"
              name="author"
              required
              defaultValue={nilai.author}
              aria-invalid={errors.author !== undefined}
              placeholder="Nama penulis"
              className={kelasKontrol(errors.author !== undefined)}
            />
            <PesanGalat pesan={errors.author} />
          </div>
        </div>

        {/*
          Slug hanya tampil saat menyunting. Buku baru mendapatkannya otomatis
          dari judul, dan menampilkan kolom yang tidak berpengaruh hanya
          membuat admin mengira ia bisa memilih alamat sebelum ada judulnya.
        */}
        {menyunting ? (
          <div className="admin-field">
            <label htmlFor="slug">Slug (alamat halaman)</label>
            <input
              id="slug"
              name="slug"
              required
              defaultValue={nilai.slug}
              aria-invalid={errors.slug !== undefined}
              className={`${kelasKontrol(errors.slug !== undefined)} is-mono`}
            />
            <PesanGalat pesan={errors.slug} />
            <Petunjuk>
              Alamat publik: <code>/buku/{nilai.slug}</code>. Mengubah slug memutus tautan lama
              ke alamat ini — perbaiki hanya bila perlu.
            </Petunjuk>
          </div>
        ) : null}

        <div className="admin-field">
          <label htmlFor="status">Status terbit</label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="admin-control"
          >
            {PILIHAN_STATUS.map((p) => (
              <option key={p.nilai} value={p.nilai}>
                {p.label}
              </option>
            ))}
          </select>
          <PesanGalat pesan={errors.status} />
          <Petunjuk>
            {segeraTerbit
              ? "Buku segera terbit tampil tanpa harga dan tanpa tombol pesanan."
              : "Buku terbit tampil di katalog lengkap dengan ISBN dan harga."}
          </Petunjuk>
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
          <label htmlFor="synopsis">Sinopsis</label>
          <textarea
            id="synopsis"
            name="synopsis"
            rows={5}
            defaultValue={nilai.synopsis}
            aria-invalid={errors.synopsis !== undefined}
            placeholder="Ringkasan isi buku untuk halaman detail"
            className={kelasKontrol(errors.synopsis !== undefined)}
          />
          <PesanGalat pesan={errors.synopsis} />
          <Petunjuk>Wajib untuk buku yang telah terbit.</Petunjuk>
        </div>

        <div className="admin-field">
          <label htmlFor="bookInfo">Informasi buku</label>
          <textarea
            id="bookInfo"
            name="bookInfo"
            rows={3}
            defaultValue={nilai.bookInfo}
            placeholder="Contoh: jumlah halaman, ukuran, atau edisi"
            className={kelasKontrol(false)}
          />
          <PesanGalat pesan={errors.bookInfo} />
          <Petunjuk>Dipakai halaman detail untuk buku yang belum terbit.</Petunjuk>
        </div>

        <div className="admin-field-grid">
          <div className="admin-field">
            <label htmlFor="publisherInfo">Keterangan penerbit</label>
            <input
              id="publisherInfo"
              name="publisherInfo"
              defaultValue={nilai.publisherInfo}
              placeholder="CV Cipta Manuskrip Media"
              className={kelasKontrol(false)}
            />
            <Petunjuk>Dikosongkan berarti “CV Cipta Manuskrip Media”.</Petunjuk>
          </div>

          <div className="admin-field">
            <label htmlFor="estimatedRelease">
              <CalendarClock aria-hidden="true" size={13} /> Estimasi terbit
            </label>
            <input
              id="estimatedRelease"
              name="estimatedRelease"
              defaultValue={nilai.estimatedRelease}
              aria-invalid={errors.estimatedRelease !== undefined}
              placeholder="Contoh: Maret 2027"
              className={kelasKontrol(errors.estimatedRelease !== undefined)}
            />
            <PesanGalat pesan={errors.estimatedRelease} />
            <Petunjuk>Wajib untuk buku segera terbit; kosongkan bila sudah terbit.</Petunjuk>
          </div>
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
          <label htmlFor="isbn">ISBN</label>
          <input
            id="isbn"
            name="isbn"
            defaultValue={nilai.isbn}
            disabled={segeraTerbit}
            aria-invalid={errors.isbn !== undefined}
            placeholder="978-xxx-xxxx-xx-x"
            className={kelasKontrol(errors.isbn !== undefined)}
          />
          <PesanGalat pesan={errors.isbn} />
          <Petunjuk>
            {segeraTerbit
              ? "Buku yang segera terbit belum punya ISBN — katalog menampilkan statusnya."
              : "Kosongkan bila belum ada; katalog menampilkan “-”."}
          </Petunjuk>
        </div>

        <div className="admin-field-grid">
          <div className="admin-field">
            <label htmlFor="pricePrint">Harga buku cetak</label>
            <input
              id="pricePrint"
              name="pricePrint"
              inputMode="numeric"
              placeholder="—"
              defaultValue={nilai.pricePrint}
              disabled={segeraTerbit}
              aria-invalid={errors.pricePrint !== undefined}
              className={kelasKontrol(errors.pricePrint !== undefined)}
            />
            <PesanGalat pesan={errors.pricePrint} />
          </div>

          <div className="admin-field">
            <label htmlFor="priceEbook">Harga sewa ebook</label>
            <input
              id="priceEbook"
              name="priceEbook"
              inputMode="numeric"
              placeholder="—"
              defaultValue={nilai.priceEbook}
              disabled={segeraTerbit}
              aria-invalid={errors.priceEbook !== undefined}
              className={kelasKontrol(errors.priceEbook !== undefined)}
            />
            <PesanGalat pesan={errors.priceEbook} />
          </div>
        </div>

        <Petunjuk>
          {segeraTerbit
            ? "Buku yang segera terbit tidak dijual, jadi tidak punya harga."
            : "Rupiah tanpa koma; titik ribuan boleh. Kosongkan bila belum ditetapkan — katalog menampilkan “-”."}
        </Petunjuk>
      </section>

      <section className="admin-form-section">
        <header className="admin-form-section-head">
          <span className="admin-form-section-icon" aria-hidden="true">
            <ImagePlus size={16} />
          </span>
          <div>
            <h3>Sampul buku</h3>
            <p>Gambar diproses otomatis menjadi WebP berukuran maksimal 1600px.</p>
          </div>
        </header>

        <div className="admin-field">
          <label htmlFor="cover">Berkas sampul</label>
          <input
            id="cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-invalid={errors.coverPath !== undefined}
            className={kelasKontrol(errors.coverPath !== undefined)}
          />
          <PesanGalat pesan={errors.coverPath} />
          <Petunjuk>
            {state.ulangiSampul
              ? "Pilih ulang berkasnya: berkas yang tadi sudah dibuang karena penyimpanan gagal."
              : menyunting
                ? "Kosongkan bila sampul tidak diganti. JPEG, PNG, atau WebP; maksimal 5 MB."
                : "JPEG, PNG, atau WebP; maksimal 5 MB."}
          </Petunjuk>
        </div>
      </section>

      <div className="admin-form-actions">
        <p className="admin-form-actions-note">
          Perubahan langsung tampil di katalog publik setelah disimpan.
        </p>
        <button type="submit" disabled={sedangProses} className="admin-form-submit">
          <Save aria-hidden="true" size={16} />
          {sedangProses ? "Menyimpan…" : menyunting ? "Simpan perubahan" : "Simpan buku"}
        </button>
      </div>
    </form>
  );
}
