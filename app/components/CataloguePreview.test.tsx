import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CataloguePreview } from "./CataloguePreview";
import type { Book } from "@/lib/books/types";

/**
 * Objek `Book` lengkap — kartu tak membaca semua field, tetapi tipe
 * komponennya menuntutnya, dan membuat objek seutuhnya di sini menjaga tes
 * tetap lulus bila tipe kelak diperluas.
 */
function buku(judul: string, slug: string): Book {
  return {
    id: `22222222-2222-2222-2222-${slug.length.toString().padStart(12, "0")}`,
    title: judul,
    slug,
    author: "Penulis Contoh",
    synopsis: "Sinopsis singkat.",
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
  };
}

describe("CataloguePreview", () => {
  it("merender kartu buku dan tautan Lihat Semua ke katalog status terkait", () => {
    const html = renderToStaticMarkup(
      <CataloguePreview
        heading="Buku yang Telah Terbit"
        emptyMessage="Belum ada buku yang diterbitkan."
        items={[buku("Algoritma", "algoritma")]}
        lihatSemuaHref="/katalog/telah-terbit"
      />
    );
    expect(html).toContain("Algoritma");
    expect(html).toContain('href="/katalog/telah-terbit"');
    expect(html).toContain("Lihat Semua");
  });

  it("menampilkan empty state statusnya sendiri saat daftar kosong", () => {
    const html = renderToStaticMarkup(
      <CataloguePreview
        heading="Buku Segera Terbit"
        emptyMessage="Belum ada buku yang segera terbit."
        items={[]}
        lihatSemuaHref="/katalog/segera-terbit"
      />
    );
    expect(html).toContain("Belum ada buku yang segera terbit.");
  });
});
