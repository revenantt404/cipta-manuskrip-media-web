// app/components/SiteHeader.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  const html = renderToStaticMarkup(<SiteHeader />);

  it("menautkan Beranda dan Tentang Kami", () => {
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/tentang-kami"');
  });

  it("tidak menautkan layanan — brief membatasi header pada dua tautan", () => {
    expect(html).not.toContain('href="/publish-buku"');
    expect(html).not.toContain('href="/publish-jurnal"');
    expect(html).not.toContain('href="/katalog/');
  });
});
