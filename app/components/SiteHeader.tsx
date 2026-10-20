import Link from "next/link";
import { NAV_UTAMA } from "@/content/site";

/**
 * Header situs publik — komponen presentasi murni, sinkron.
 *
 * Satu-satunya sumber teksnya adalah `content/site.ts` (NAV_UTAMA), jadi
 * perombakan UI di Arena nanti tidak menyalin teks menautan ke dua tempat.
 *
 * Brief §9 membatasi header pada dua tautan nav saja — tautan layanan
 * (`TAUTAN_LAYANAN`) hidup di footer, bukan di sini.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-garis bg-latar-alt">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-5xl items-center gap-6 p-4 text-sm"
      >
        {NAV_UTAMA.map((tautan) => (
          <Link
            key={tautan.href}
            href={tautan.href}
            className="text-teks hover:underline"
          >
            {tautan.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
