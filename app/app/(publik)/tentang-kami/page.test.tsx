// app/app/(publik)/tentang-kami/page.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "./page";

/**
 * Halaman `/tentang-kami` — brief §10, halaman statis tanpa database.
 *
 * Ini halaman tempat mengarang data perusahaan paling mudah, jadi tesnya
 * justru penjaga jujur: nomor kontak harus persis dari `KONTAK`, keempat
 * area harus ada, dan apa pun yang mirip NIB, NPWP, surel, atau tautan
 * sosial wajib tidak pernah muncul — semuanya menunggu materi klien.
 */
describe("tentang-kami", () => {
  const html = renderToStaticMarkup(<Page />);

  it("menampilkan nomor admin buku dan jurnal persis", () => {
    expect(html).toContain("0896-7189-4900");
    expect(html).toContain("0895-6292-03142");
    expect(html).toContain("Admin Buku");
    expect(html).toContain("Admin Jurnal");
  });

  it("memuat keempat area", () => {
    for (const a of ["Profil", "Dokumen Resmi", "Kontak", "Media Sosial"]) expect(html).toContain(a);
  });

  it("tidak mengarang alamat, NIB, NPWP, email, atau tautan sosial", () => {
    expect(html).not.toMatch(/NIB|NPWP/i);
    expect(html).not.toContain("http://instagram");
    expect(html).not.toContain("http://facebook");
    expect(html).not.toContain("@gmail");
  });
});
