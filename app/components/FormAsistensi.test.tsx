// app/components/FormAsistensi.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FormAsistensi } from "./FormAsistensi";

/**
 * Markup awal `FormAsistensi` — komponen klien, tapi render statisnya
 * tetap bisa diperiksa. Aturan trim/kosong dan isi pesan dikunci
 * `lib/whatsapp.test.ts`; tes ini memastikan label, input, tombol, dan
 * area galat yang dijanjikan memang ada, dan bahwa kedua jenis
 * asistensi tidak saling tertukar.
 */
describe("FormAsistensi", () => {
  it("memakai label buku dan id input buku untuk asistensi buku", () => {
    const html = renderToStaticMarkup(<FormAsistensi jenis="buku" />);
    expect(html).toContain("Topik Asistensi Penulisan Buku");
    expect(html).toContain('id="topik-buku"');
    expect(html).toContain('for="topik-buku"');
  });

  it("memakai label artikel jurnal dan id input jurnal untuk asistensi jurnal", () => {
    const html = renderToStaticMarkup(<FormAsistensi jenis="jurnal" />);
    expect(html).toContain("Topik Asistensi Penulisan Artikel Jurnal Ilmiah");
    expect(html).toContain('id="topik-jurnal"');
    expect(html).toContain('for="topik-jurnal"');
  });

  it("merender tombol kirim dan area pesan galat untuk kedua jenis", () => {
    for (const jenis of ["buku", "jurnal"] as const) {
      const html = renderToStaticMarkup(<FormAsistensi jenis={jenis} />);
      expect(html).toContain("Lanjut ke WhatsApp");
      expect(html).toContain('role="alert"');
      expect(html).toContain('name="topik"');
    }
  });
});
