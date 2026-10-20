// app/components/FormAsistensi.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FormAsistensi } from "./FormAsistensi";

/**
 * Markup awal `FormAsistensi` — komponen klien, tapi render statisnya
 * tetap bisa diperiksa. Aturan trim/kosong dikunci `pesanAsistensi`
 * (lib/whatsapp.ts); dispesifikasikan di tesnya sendiri, bukan di sini —
 * tes ini hanya memastikan tiga bagian markup wajibnya ada.
 */
describe("FormAsistensi", () => {
  it("merender input, tombol kirim, dan area pesan galat", () => {
    const html = renderToStaticMarkup(<FormAsistensi />);
    expect(html).toContain('id="topik"');
    expect(html).toContain("Lanjut ke WhatsApp");
    expect(html).toContain('role="alert"');
  });
});
