// app/app/(publik)/publish-jurnal/kirim-artikel/page.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "./page";
import { KATEGORI_JURNAL } from "@/content/site";

/**
 * Halaman `/publish-jurnal/kirim-artikel` — brief §10, halaman statis
 * tanpa database. Tepat tiga kategori dan tepat tiga tautan WhatsApp
 * (nomor jurnal + pesan persis `ini naskah artikel saya, admin.`);
 * naskah tidak pernah diunggah ke server, jadi tidak ada `<form>` dan
 * tidak ada `input type="file"` di halaman.
 */
describe("kirim-artikel", () => {
  const html = renderToStaticMarkup(<Page />);

  it("tepat tiga kategori, tidak lebih", () => {
    for (const k of KATEGORI_JURNAL) expect(html).toContain(k);
    expect(html).toContain("SINTA 1–4");
    expect(KATEGORI_JURNAL).toHaveLength(3);
  });

  it("setiap tautan WhatsApp memakai nomor jurnal dan pesan persis", () => {
    const tautan = html.match(/href="https:\/\/wa\.me\/[^"]+"/g) ?? [];
    expect(tautan).toHaveLength(3);
    for (const t of tautan) {
      expect(t).toContain("wa.me/62895629203142?text=ini%20naskah%20artikel%20saya%2C%20admin.");
    }
  });

  it("tidak ada form unggah artikel", () => {
    expect(html).not.toContain('type="file"');
    expect(html).not.toContain("<form");
  });

  it("setiap tautan WhatsApp membuka tab baru dengan rel aman", () => {
    // Tepat tiga tautan di halaman ini (dua tes di atas menghitungnya),
    // jadi hitungan atribut yang sama-sama tiga berarti setiap tautan
    // membawanya — pelengkap brief agar pelanggaran terdeteksi tes.
    expect(html.match(/target="_blank"/g) ?? []).toHaveLength(3);
    expect(html.match(/rel="noopener noreferrer"/g) ?? []).toHaveLength(3);
  });
});
