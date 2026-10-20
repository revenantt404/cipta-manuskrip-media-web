import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { listBooksForSitemap } from "@/lib/books/repository";

/**
 * sitemap.xml — seluruh route publik plus satu entri per buku nyata.
 *
 * Wajib `force-dynamic`: berkas konvensi ini adalah Route Handler yang
 * di-cache bawaan, jadi tanpa itu daftar buku dibekukan saat build dan
 * buku baru tidak pernah muncul sampai server di-restart.
 */
export const dynamic = "force-dynamic";

/** Route publik statis, tanpa database. Entri `/buku/...` menyusul di belakangnya. */
export const ROUTE_STATIS = [
  "/",
  "/tentang-kami",
  "/publish-buku",
  "/publish-jurnal",
  "/publish-jurnal/kirim-artikel",
  "/publish-jurnal/asistensi",
  "/katalog/telah-terbit",
  "/katalog/segera-terbit",
] as const;

/** Entri statis seluruhnya, dipakai juga saat pembacaan database gagal. */
function entriStatis(dasar: string): MetadataRoute.Sitemap {
  return ROUTE_STATIS.map((jalur) => ({ url: `${dasar}${jalur}` }));
}

/**
 * Setiap URL absolut dari `siteUrl()`. `sitemap.ts` tidak dapat membaca
 * `metadataBase`; bila URL ditulis relatif, bawaan framework
 * `http://localhost:3000` yang dipakai dan itu bocor ke produksi.
 *
 * Galat database tidak boleh menggagalkan sitemap — peta yang berisi
 * route statis saja masih lebih berguna daripada 500.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dasar = siteUrl();
  const statis = entriStatis(dasar);

  try {
    const buku = await listBooksForSitemap();
    return [
      ...statis,
      ...buku.map((book) => ({
        url: `${dasar}/buku/${book.slug}`,
        lastModified: book.updatedAt,
      })),
    ];
  } catch {
    return statis;
  }
}
