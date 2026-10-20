"use client";

import { useActionState, useState } from "react";
import { PILIHAN_STATUS } from "./form-state";
import type { AksiFormBuku, StateFormBuku } from "./form-state";

const KELAS_INPUT = "rounded border px-3 py-2";

function PesanGalat({ pesan }: { pesan: string | undefined }) {
  if (pesan === undefined) return null;
  return <p className="mt-1 text-sm text-red-700">{pesan}</p>;
}

/**
 * Formulir tambah buku.
 *
 * Satu komponen dengan seluruh kolomnya, bukan kumpulan field terpisah:
 * kesebelas kolom ini selalu muncul bersama, dan memecahnya hanya membuat
 * tiap field perlu diberi tahu keadaan galatnya sendiri.
 *
 * `key` pada form berubah setiap percobaan. Itulah yang membuat isian
 * tidak hilang saat validasi gagal — React mereset form setiap action
 * selesai, sehingga nilai di DOM saja tidak cukup untuk mempertahankannya.
 */
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

  return (
    <form
      key={state.percobaan}
      action={formAction}
      encType="multipart/form-data"
      className="flex flex-col gap-4"
    >
      {errors.form !== undefined ? (
        <p data-testid="galat-form" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {errors.form}
        </p>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="title">Judul</label>
        <input
          id="title"
          name="title"
          required
          defaultValue={nilai.title}
          aria-invalid={errors.title !== undefined}
          className={KELAS_INPUT}
        />
        <PesanGalat pesan={errors.title} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="author">Penulis</label>
        <input
          id="author"
          name="author"
          required
          defaultValue={nilai.author}
          aria-invalid={errors.author !== undefined}
          className={KELAS_INPUT}
        />
        <PesanGalat pesan={errors.author} />
      </div>

      {/*
        Slug hanya tampil saat menyunting. Buku baru mendapatkannya otomatis
        dari judul, dan menampilkan kolom yang tidak berpengaruh hanya
        membuat admin mengira ia bisa memilih alamat sebelum ada judulnya.
      */}
      {menyunting ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="slug">Slug (alamat halaman)</label>
          <input
            id="slug"
            name="slug"
            required
            defaultValue={nilai.slug}
            aria-invalid={errors.slug !== undefined}
            className={`${KELAS_INPUT} font-mono`}
          />
          <PesanGalat pesan={errors.slug} />
          <p className="text-xs text-zinc-600">
            Alamat publik: /buku/<span className="font-mono">{nilai.slug}</span>
          </p>
          <p className="text-xs text-zinc-600">
            Mengubah slug memutus tautan lama ke alamat ini. Perbaiki hanya bila perlu.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={KELAS_INPUT}
        >
          {PILIHAN_STATUS.map((p) => (
            <option key={p.nilai} value={p.nilai}>
              {p.label}
            </option>
          ))}
        </select>
        <PesanGalat pesan={errors.status} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="synopsis">Sinopsis</label>
        <textarea
          id="synopsis"
          name="synopsis"
          rows={5}
          defaultValue={nilai.synopsis}
          aria-invalid={errors.synopsis !== undefined}
          className={KELAS_INPUT}
        />
        <PesanGalat pesan={errors.synopsis} />
        <p className="text-xs text-zinc-600">Wajib untuk buku yang telah terbit.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="estimatedRelease">Estimasi terbit</label>
        <input
          id="estimatedRelease"
          name="estimatedRelease"
          defaultValue={nilai.estimatedRelease}
          aria-invalid={errors.estimatedRelease !== undefined}
          className={KELAS_INPUT}
        />
        <PesanGalat pesan={errors.estimatedRelease} />
        <p className="text-xs text-zinc-600">
          Wajib untuk buku segera terbit; kosongkan bila sudah terbit.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="publisherInfo">Keterangan penerbit</label>
        <input
          id="publisherInfo"
          name="publisherInfo"
          defaultValue={nilai.publisherInfo}
          className={KELAS_INPUT}
        />
        <p className="text-xs text-zinc-600">
          Dikosongkan berarti &ldquo;CV Cipta Manuskrip Media&rdquo;.
        </p>
      </div>

      {/*
        ISBN dan harga hanya bermakna untuk buku yang sudah terbit. Buku
        "segera terbit" tidak dijual, jadi ketiga isian ini dikosongkan dan
        dinonaktifkan saat status itu dipilih — validasi server tetap
        menolak bila isinya terkirim, karena atribut HTML bukan penjaga.
      */}
      <div className="flex flex-col gap-1">
        <label htmlFor="isbn">ISBN</label>
        <input
          id="isbn"
          name="isbn"
          defaultValue={nilai.isbn}
          disabled={segeraTerbit}
          aria-invalid={errors.isbn !== undefined}
          className={`${KELAS_INPUT} disabled:bg-zinc-100 disabled:text-zinc-500`}
        />
        <PesanGalat pesan={errors.isbn} />
        <p className="text-xs text-zinc-600">
          {segeraTerbit
            ? "Buku yang segera terbit belum punya ISBN — katalog menampilkan statusnya."
            : "Kosongkan bila belum ada."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="pricePrint">Harga buku cetak</label>
          <input
            id="pricePrint"
            name="pricePrint"
            inputMode="numeric"
            placeholder="-"
            defaultValue={nilai.pricePrint}
            disabled={segeraTerbit}
            aria-invalid={errors.pricePrint !== undefined}
            className={`${KELAS_INPUT} disabled:bg-zinc-100 disabled:text-zinc-500`}
          />
          <PesanGalat pesan={errors.pricePrint} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="priceEbook">Harga sewa ebook</label>
          <input
            id="priceEbook"
            name="priceEbook"
            inputMode="numeric"
            placeholder="-"
            defaultValue={nilai.priceEbook}
            disabled={segeraTerbit}
            aria-invalid={errors.priceEbook !== undefined}
            className={`${KELAS_INPUT} disabled:bg-zinc-100 disabled:text-zinc-500`}
          />
          <PesanGalat pesan={errors.priceEbook} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-zinc-600">
        {segeraTerbit
          ? "Buku yang segera terbit tidak dijual, jadi tidak punya harga."
          : "Rupiah tanpa koma; titik ribuan boleh. Kosongkan bila belum ditetapkan — katalog akan menampilkan “-”."}
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="bookInfo">Informasi buku</label>
        <textarea id="bookInfo" name="bookInfo" rows={3} defaultValue={nilai.bookInfo} className={KELAS_INPUT} />
        <PesanGalat pesan={errors.bookInfo} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cover">Sampul</label>
        <input
          id="cover"
          name="cover"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-invalid={errors.coverPath !== undefined}
          className={KELAS_INPUT}
        />
        <PesanGalat pesan={errors.coverPath} />
        {state.ulangiSampul ? (
          <p className="text-xs text-zinc-600">
            Pilih ulang berkasnya: berkas yang tadi sudah dibuang karena penyimpanan gagal.
          </p>
        ) : menyunting ? (
          <p className="text-xs text-zinc-600">
            Kosongkan bila sampul tidak diganti. JPEG, PNG, atau WebP; maksimal 5 MB.
          </p>
        ) : (
          <p className="text-xs text-zinc-600">JPEG, PNG, atau WebP. Maksimal 5 MB.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={sedangProses}
        className="self-start rounded border px-4 py-2 hover:bg-zinc-50 disabled:opacity-50"
      >
        {sedangProses ? "Menyimpan…" : menyunting ? "Simpan perubahan" : "Simpan buku"}
      </button>
    </form>
  );
}
