import { describe, it, expect } from "vitest";
import { buildBookOrderUrl } from "./whatsapp";

describe("buildBookOrderUrl", () => {
  it("membentuk tautan pemesanan buku cetak dengan format persis", () => {
    const url = buildBookOrderUrl("Filsafat Ilmu", "cetak");
    expect(url).toBe(
      "https://wa.me/6289671894900?text=Mau%20pesan%20buku%20cetak%20judul%20Filsafat%20Ilmu"
    );
  });

  it("membentuk tautan sewa ebook dengan penulisan ebook tetap persis", () => {
    const url = buildBookOrderUrl("Panduan Menulis 'Karya Ilmiah'", "ebook");
    expect(url).toBe(
      "https://wa.me/6289671894900?text=Mau%20sewa%20ebook%20judul%20Panduan%20Menulis%20'Karya%20Ilmiah'"
    );
  });

  it("judul dengan &, +, tanda kurung, dan huruf beraksen tetap utuh saat pesan didekode", () => {
    const judul = "Kiat Menulis Cepat & Efektif (Edisi 2+1) — Résumé";
    const url = buildBookOrderUrl(judul, "cetak");

    expect(decodeURIComponent(new URL(url).searchParams.get("text") ?? "")).toBe(
      `Mau pesan buku cetak judul ${judul}`
    );
  });
});
