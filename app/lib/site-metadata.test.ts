import { describe, expect, it } from "vitest";
import { metadataSitus } from "./site-metadata";

/**
 * Metadata root yang dipakai `layout.tsx` — plan Task 10.
 *
 * Metadata root tidak boleh dikunci lewat `layout.tsx` sendiri: berkas itu
 * mengimpor `next/font/google`, yang tidak dapat diimpor di Vitest
 * (TypeError: Geist is not a function). Karena itu metadata dibentuk oleh
 * fungsi murni di sini, dan layout hanya mengimpornya.
 */
describe("metadataSitus", () => {
  it("memakai judul bawaan CV Cipta Manuskrip Media", () => {
    const metadata = metadataSitus({});

    expect(metadata.title).toEqual({
      default: "CV Cipta Manuskrip Media",
      template: "%s — CV Cipta Manuskrip Media",
    });
  });

  it("metadataBase berasal dari siteUrl()", () => {
    const metadata = metadataSitus({ SITE_URL: "https://ciptamanuskrip.com" });

    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(String(metadata.metadataBase)).toBe("https://ciptamanuskrip.com/");
  });

  it("meski SITE_URL tidak valid, metadataBase tetap terisi localhost", () => {
    const metadata = metadataSitus({ SITE_URL: "bukan-url" });

    expect(String(metadata.metadataBase)).toBe("http://localhost:3000/");
  });

  it("memuat deskripsi situs", () => {
    const metadata = metadataSitus({});

    expect(metadata.description).toBe("Layanan penerbitan buku dan publikasi artikel ilmiah.");
  });
});
