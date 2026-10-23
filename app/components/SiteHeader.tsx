import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NAV_UTAMA } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav aria-label="Navigasi utama" className="site-nav">
        <Link href="/" aria-label="CV Cipta Manuskrip Media — Beranda" className="brand-lockup">
          {/* eslint-disable-next-line @next/next/no-img-element -- lambang lokal,
              dipotong dari berkas logo penuh agar tidak ada teks ganda di samping
              wordmark yang sudah dirender sebagai teks. */}
          <img src="/logo-cmm-mark.png" alt="" className="brand-logo" />
          <span className="brand-name"><strong>CIPTA</strong><small>MANUSKRIP MEDIA</small></span>
        </Link>
        <div className="nav-links">
          {NAV_UTAMA.map((tautan) => (
            <Link key={tautan.href} href={tautan.href} className="nav-link">{tautan.label}</Link>
          ))}
        </div>
        <Link href="/publish-buku" className="nav-cta">
          Mulai berkarya <ArrowUpRight aria-hidden="true" size={15} />
        </Link>
      </nav>
    </header>
  );
}
