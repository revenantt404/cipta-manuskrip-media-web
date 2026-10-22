// app/app/(publik)/page.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "./page";

describe("beranda", () => {
  const html = renderToStaticMarkup(<Home />);

  it("memakai headline dan pendukung persis dari brief", () => {
    const visibleText = html.replace(/<[^>]*>/g, "");
    expect(visibleText).toContain("Publikasi Semudah Beli Kopi.");
    expect(visibleText).toContain("Layanan penerbitan buku dan publikasi artikel ilmiah.");
  });

  it("tombol mengarah ke dua halaman layanan, bukan katalog", () => {
    expect(html).toContain('href="/publish-buku"');
    expect(html).toContain('href="/publish-jurnal"');
    expect(html).toContain("Publish Buku");
    expect(html).toContain("Publish Jurnal");
  });
});
