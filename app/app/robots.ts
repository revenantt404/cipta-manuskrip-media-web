import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

/**
 * robots.txt — brief §12: hanya admin yang ditutup dari mesin pencari;
 * halaman publik lain mungkin diindeks.
 *
 * Default export adalah kontrak Next.js 16.4.2 (dibaca dari
 * node_modules/next/dist/docs/.../01-metadata/robots.md); named export
 * tidak dipedulikan framework.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin"],
    },
    // Absolut, dari `siteUrl()`: relatif terhadap `metadataBase` tidak
    // dimungkinkan di sini dan nilai bawaan framework justru localhost.
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
