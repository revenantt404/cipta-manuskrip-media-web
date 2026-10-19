import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookDetail } from "./BookDetail";
import type { Book } from "@/lib/books/types";

function buku(ubah: Partial<Book> = {}): Book {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    title: "Filsafat Ilmu",
    slug: "filsafat-ilmu",
    author: "Dr. Siti",
    synopsis: "Buku tentang dasar-dasar filsafat ilmu.",
    publisherInfo: "CV Cipta Manuskrip Media",
    bookInfo: null,
    coverPath: "covers/uji.webp",
    status: "published",
    estimatedRelease: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...ubah,
  };
}

describe("BookDetail — buku telah terbit", () => {
  const html = renderToStaticMarkup(<BookDetail book={buku()} />);

  it("menampilkan judul, penulis, sinopsis, dan informasi penerbit", () => {
    expect(html).toContain("Filsafat Ilmu");
    expect(html).toContain("Dr. Siti");
    expect(html).toContain("Buku tentang dasar-dasar filsafat ilmu.");
    expect(html).toContain("CV Cipta Manuskrip Media");
  });

  it("menautkan pemesanan buku cetak ke nomor dan pesan yang ditentukan brief", () => {
    expect(html).toContain(
      'href="https://wa.me/6289671894900?text=Mau%20pesan%20buku%20cetak%20judul%20Filsafat%20Ilmu"'
    );
  });

  it("menautkan sewa ebook dengan penulisan ebook yang dipertahankan", () => {
    expect(html).toContain(
      'href="https://wa.me/6289671894900?text=Mau%20sewa%20ebook%20judul%20Filsafat%20Ilmu"'
    );
  });

  it("membuka tautan WhatsApp di tab baru tanpa membocorkan referrer", () => {
    const tautan = html.match(/<a[^>]+wa\.me[^>]*>/g) ?? [];
    expect(tautan).toHaveLength(2);
    for (const a of tautan) {
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener noreferrer"');
    }
  });

  it("menampilkan sampul dengan alt text dari judul buku", () => {
    expect(html).toContain('src="/covers/uji.webp"');
    expect(html).toContain('alt="Sampul buku Filsafat Ilmu"');
  });
});

describe("BookDetail — buku segera terbit", () => {
  const html = renderToStaticMarkup(
    <BookDetail
      book={buku({
        status: "upcoming",
        synopsis: null,
        bookInfo: "Segera hadir dalam rangkaian buku kepenulisan.",
        estimatedRelease: "Januari 2027",
      })}
    />
  );

  it("menampilkan informasi buku dan estimasi terbit", () => {
    expect(html).toContain("Segera hadir dalam rangkaian buku kepenulisan.");
    expect(html).toContain("Januari 2027");
  });

  it("tidak menawarkan pesanan maupun pendaftaran notifikasi", () => {
    expect(html).not.toContain("wa.me");
    expect(html.toLowerCase()).not.toContain("notifikasi");
    expect(html.toLowerCase()).not.toContain("beritahu saya");
  });
});

describe("BookDetail — judul dengan karakter khusus", () => {
  it("meng-encode judul ber-apostrof dan ampersand pada tautan WhatsApp", () => {
    const html = renderToStaticMarkup(
      <BookDetail book={buku({ title: "Kiat Menulis Cepat & Efektif (Edisi 2+1)" })} />
    );

    const cocok = html.match(/https:\/\/wa\.me\/[^"]+/g) ?? [];
    expect(cocok).toHaveLength(2);

    for (const raw of cocok) {
      const pesan = decodeURIComponent(
        new URL(raw.replace(/&amp;/g, "&")).searchParams.get("text") ?? ""
      );
      expect(pesan).toContain("Kiat Menulis Cepat & Efektif (Edisi 2+1)");
    }
  });
});
