"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

/**
 * Sampul buku untuk katalog, pratinjau, dan halaman detail.
 *
 * Dipisahkan sebagai komponen klien karena satu hal yang tidak bisa
 * dikerjakan CSS: berkas sampul yang gagal dimuat. Sebelumnya `img` yang
 * rusak tampil sebagai ikon gambar pecah milik browser — terlihat seperti
 * situs yang belum jadi. Sekarang kegagalan itu diganti bidang bertekstur
 * dengan judul buku, sehingga kartu tetap utuh dan keterangannya terbaca.
 *
 * Markup awalnya tetap `<img src alt>` biasa: tes komponen memeriksa kedua
 * atribut itu pada render statis, dan pembaca layar menerima alt yang sama
 * sebelum JavaScript sempat berjalan.
 */
export function BookCover({
  src,
  alt,
  title,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  title: string;
  className?: string;
  sizes?: string;
}) {
  const [gagal, setGagal] = useState(false);

  if (gagal) {
    return (
      <span className={`book-cover-fallback${className ? ` ${className}` : ""}`} role="img" aria-label={alt}>
        <BookOpen aria-hidden="true" size={22} strokeWidth={1.4} />
        <span className="book-cover-fallback-title">{title}</span>
      </span>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element -- sampul sudah
       diperkecil dan dikompres sharp saat diunggah; next/image belum
       dikonfigurasi. */
    <img
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      loading="lazy"
      decoding="async"
      onError={() => setGagal(true)}
    />
  );
}
