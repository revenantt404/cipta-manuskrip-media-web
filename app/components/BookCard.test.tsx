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
