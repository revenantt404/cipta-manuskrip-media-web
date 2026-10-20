import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookCard } from "./BookCard";
import type { Book } from "@/lib/books/types";

function buku(ubah: Partial<Book> = {}): Book {
  return {
    id: "22222222-2222-2222-2222-222222222222",
    title: "Metodologi Penelitian",
    slug: "metodologi-penelitian",
    author: "Dr. Budi",
    synopsis: "Buku tentang metodologi penelitian.",
    publisherInfo: "CV Cipta Manuskrip Media",
    bookInfo: null,
    coverPath: "covers/8f14e45f-ceea-467a-9c1b-1d0b0e9a7c31.webp",
    status: "published",
    estimatedRelease: null,
    isbn: "978-602-1234-56-7",
    pricePrint: 85000,
    priceEbook: 45000,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...ubah,
  };
}

describe("BookCard", () => {
  const html = renderToStaticMarkup(<BookCard book={buku()} />);

  it("menampilkan judul dan penulis", () => {
    expect(html).toContain("Metodologi Penelitian");
    expect(html).toContain("Dr. Budi");
  });

  it("menautkan ke halaman detail buku", () => {
    expect(html).toContain('href="/buku/metodologi-penelitian"');
  });

  /**
   * Sampul harus benar-benar tampil, bukan kotak penanda.
   *
   * Brief bagian 8 dan 9 mensyaratkan sampul muncul di daftar admin, katalog,
   * dan detail. Sejak Fase 2 berkasnya sudah ada — diunggah admin, diproses
   * sharp, dan disajikan `/covers/[berkas]` — jadi kotak abu penanda tempat
   * sudah tidak punya alasan.
   */
  it("menampilkan gambar sampul dari resolver URL, bukan kotak penanda", () => {
    expect(html).toContain('src="/covers/8f14e45f-ceea-467a-9c1b-1d0b0e9a7c31.webp"');
  });

  it("memberi alt text yang menyebut judul buku", () => {
    expect(html).toMatch(/alt="[^"]*Metodologi Penelitian[^"]*"/);
  });

  /**
   * Nama berkas memuat UUID baru setiap kali sampul diganti, jadi URL kartu
   * ikut berubah tanpa perlu cache busting tambahan.
   */
  it("mengikuti berkas sampul yang berbeda", () => {
    const lain = renderToStaticMarkup(
      <BookCard book={buku({ coverPath: "covers/00000000-0000-0000-0000-000000000001.webp" })} />
    );

    expect(lain).toContain('src="/covers/00000000-0000-0000-0000-000000000001.webp"');
  });
});

/**
 * Katalog Perpusnas: setiap judul yang sudah terbit menampilkan ISBN dan
 * dua harga, dengan tombol pesan langsung ke WhatsApp admin.
 */
describe("BookCard — buku telah terbit", () => {
  const html = renderToStaticMarkup(<BookCard book={buku()} />);

  it("menampilkan ISBN", () => {
    expect(html).toContain("978-602-1234-56-7");
  });

  it("menampilkan harga cetak dan harga sewa ebook, terformat rupiah", () => {
    expect(html).toContain("Rp85.000");
    expect(html).toContain("Rp45.000");
    expect(html).toContain("Harga cetak");
    expect(html).toContain("Sewa ebook");
  });

  it("menautkan beli cetak dan sewa ebook ke pesan WhatsApp yang ditentukan brief", () => {
    expect(html).toContain(
      'href="https://wa.me/6289671894900?text=Mau%20pesan%20buku%20cetak%20judul%20Metodologi%20Penelitian"'
    );
    expect(html).toContain(
      'href="https://wa.me/6289671894900?text=Mau%20sewa%20ebook%20judul%20Metodologi%20Penelitian"'
    );
    expect(html).toContain("Beli Buku Cetak");
    expect(html).toContain("Sewa Ebook");
  });

  it("membuka kedua tautan di tab baru tanpa membocorkan referrer", () => {
    const tautan = html.match(/<a[^>]+wa\.me[^>]*>/g) ?? [];
    expect(tautan).toHaveLength(2);
    for (const a of tautan) {
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener noreferrer"');
    }
  });

  /**
   * Harga yang belum ditetapkan bukan nol. `-` adalah keputusan pemilik
   * proyek supaya kolom kosong tidak terbaca sebagai gratis.
   */
  it("menampilkan tanda hubung bila harga belum ditetapkan", () => {
    const kosong = renderToStaticMarkup(
      <BookCard book={buku({ pricePrint: null, priceEbook: null })} />
    );
    expect(kosong).toContain(">-<");
    expect(kosong).not.toContain("Rp0");
  });

  it("menampilkan tanda hubung bila ISBN belum diisi", () => {
    const kosong = renderToStaticMarkup(<BookCard book={buku({ isbn: null })} />);
    expect(kosong).toContain(">-<");
  });
});

/**
 * Buku yang belum terbit tidak dijual. Katalog ini dipakai untuk pengajuan
 * Perpusnas, jadi yang tampil adalah status ISBN — bukan angka, harga, atau
 * tombol pesan.
 */
describe("BookCard — buku segera terbit", () => {
  const html = renderToStaticMarkup(
    <BookCard
      book={buku({
        status: "upcoming",
        synopsis: null,
        estimatedRelease: "Januari 2027",
        isbn: null,
        pricePrint: null,
        priceEbook: null,
      })}
    />
  );

  it("menampilkan status segera terbit pada baris ISBN", () => {
    expect(html).toContain("Segera terbit");
  });

  it("tidak menampilkan harga maupun tanda hubung harga", () => {
    expect(html).not.toContain("Harga cetak");
    expect(html).not.toContain("Sewa ebook");
    expect(html).not.toContain("Rp");
    expect(html).not.toContain(">-<");
  });

  it("tidak menawarkan pembelian lewat WhatsApp", () => {
    expect(html).not.toContain("wa.me");
    expect(html).not.toContain("Beli Buku Cetak");
    expect(html).not.toContain("Sewa Ebook");
  });
});
