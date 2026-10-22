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

  it("menu navigasi hanya berisi Beranda dan Tentang Kami", () => {
    const menu = html.match(/<div class="nav-links">([\s\S]*?)<\/div>/)?.[1] ?? "";
    expect(menu).toContain('href="/"');
    expect(menu).toContain('href="/tentang-kami"');
    expect(menu).not.toContain('href="/publish-buku"');
    expect(menu).not.toContain('href="/publish-jurnal"');
    expect(menu).not.toContain('href="/katalog/');
  });
});
