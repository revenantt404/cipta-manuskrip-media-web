// app/app/(publik)/publish-jurnal/page.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "./page";
import { FASILITAS_JURNAL } from "@/content/site";

/**
 * Halaman `/publish-jurnal` — brief §10, halaman statis tanpa database.
 *
 * Teks dan jangkar dikunci persis (headline, dua tombol, placeholder
 * aset, en dash pada `revisi minor–mayor`); halaman tidak boleh menambah
 * janji lain dari hasil editannya sendiri.
 */
describe("publish-jurnal", () => {
  const html = renderToStaticMarkup(<Page />);

  it("memakai headline persis", () => {
    expect(html).toContain("Publikasi Artikel Ilmiah Sekali Klik.");
  });

  it("memuat keempat area dengan satu placeholder aset yang jujur", () => {
    for (const area of ["Bukti Submission", "Dokumentasi Korespondensi", "Logo Indeksasi", "Fasilitas"]) {
      expect(html).toContain(area);
    }
    expect(html).toContain("[Aset dari klien]");
  });

  it("memuat seluruh 13 fasilitas tanpa menambah janji", () => {
    for (const f of FASILITAS_JURNAL) expect(html).toContain(f);
    expect(html).toContain("revisi minor–mayor");
  });

  it("kedua tombol menuju halaman yang benar", () => {
    expect(html).toContain('href="/publish-jurnal/kirim-artikel"');
    expect(html).toContain('href="/publish-jurnal/asistensi"');
    expect(html).toContain("Kirim Artikel");
    expect(html).toContain("Belum Ada Artikel");
  });
});
