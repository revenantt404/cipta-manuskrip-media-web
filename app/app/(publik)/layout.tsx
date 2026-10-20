import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Layout semua halaman publik (route group `(publik)` — grupnya tidak ikut
 * dalam URL, jadi tipe jalurnya "/" sesuai `LayoutRoutes` hasil typegen).
 *
 * Kunci artefak HTML: hanya layout ini yang memakai `<main>` — halaman di
 * dalam grup dirender sebagai `<div>`, sehingga dokumen punya tepat satu
 * landmark `<main>` (header → main → footer).
 */
export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
