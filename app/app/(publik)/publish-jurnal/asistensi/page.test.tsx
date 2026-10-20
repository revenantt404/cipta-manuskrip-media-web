// app/app/(publik)/publish-jurnal/asistensi/page.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "./page";
import { KATEGORI_JURNAL } from "@/content/site";

/**
 * Halaman `/publish-jurnal/asistensi` — statis, tanpa database. Topik
 * asistensi tidak pernah dikirim ke server: ia hanya pernah masuk isi
 * pesan WhatsApp lewat `pesanAsistensi`, jadi halaman ini tidak punya
 * tes pengiriman data — hanya markup kategori dan input berlabel.
 */
describe("asistensi", () => {
  const html = renderToStaticMarkup(<Page />);

  it("menampilkan tiga kategori yang sama", () => {
    for (const k of KATEGORI_JURNAL) expect(html).toContain(k);
  });

  it("menyediakan input topik yang diberi label", () => {
    expect(html).toContain('name="topik"');
    expect(html).toMatch(/<label[^>]*for="topik"/);
  });
});
