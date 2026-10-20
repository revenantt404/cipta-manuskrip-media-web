// app/components/SiteFooter.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  const html = renderToStaticMarkup(<SiteFooter />);

  it("mengulang tautan kedua layanan", () => {
    expect(html).toContain('href="/publish-buku"');
    expect(html).toContain('href="/publish-jurnal"');
  });

  it("menyebut nama perusahaan tanpa data karangan", () => {
    expect(html).toContain("CV Cipta Manuskrip Media");
    expect(html).not.toMatch(/NIB|NPWP|@gmail|@yahoo/);
  });
});
