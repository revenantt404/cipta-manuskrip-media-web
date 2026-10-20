import { describe, expect, it } from "vitest";
import robots from "./robots";
import { siteUrl } from "@/lib/env";

// robots.txt — brief §12 (noindex halaman non-publik) dan plan Task 10.
// Nilainya dikunci persis: crawler mana pun diizinkan menyusuri seluruh
// situs kecuali /admin, dan peta situs yang ditunjuk harus absolut.
describe("robots", () => {
  const hasil = robots();

  it("melarang /admin", () => {
    const aturan = Array.isArray(hasil.rules) ? hasil.rules[0] : hasil.rules;
    expect(aturan.disallow).toContain("/admin");
  });

  it("mengizinkan seluruh situs untuk semua user-agent", () => {
    const aturan = Array.isArray(hasil.rules) ? hasil.rules[0] : hasil.rules;
    expect(aturan.userAgent).toBe("*");
    expect(aturan.allow).toBe("/");
  });

  it("menunjuk sitemap absolut", () => {
    const dasar = siteUrl();
    expect(hasil.sitemap).toBe(`${dasar}/sitemap.xml`);
    expect(hasil.sitemap).toMatch(/^https?:\/\/.+\/sitemap\.xml$/);
  });
});
