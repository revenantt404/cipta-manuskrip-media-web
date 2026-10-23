import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollReveal } from "@/components/ScrollReveal";

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
      {/*
        Tautan lompat: pengguna keyboard tidak perlu menekan Tab melewati
        seluruh navigasi di setiap halaman. Tersembunyi sampai menerima
        fokus, dan mengarah ke `<main>` yang memang satu-satunya landmark
        utama dokumen.
      */}
      <a href="#konten-utama" className="skip-link">
        Lompat ke konten utama
      </a>
      <SiteHeader />
      <ScrollReveal />
      <main id="konten-utama" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
