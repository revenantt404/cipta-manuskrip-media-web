import Link from "next/link";
import { NAV_UTAMA } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav aria-label="Navigasi utama" className="site-nav">
        <Link href="/" aria-label="CV Cipta Manuskrip Media — Beranda" className="brand-lockup">
          {/* eslint-disable-next-line @next/next/no-img-element -- keep the logo as a plain local image per UI handoff */}
          <img src="/logo-cmm-trim.png" alt="" className="brand-logo" />
          <span className="brand-name"><strong>CIPTA</strong><small>MANUSKRIP MEDIA</small></span>
        </Link>
        <div className="nav-links">
          {NAV_UTAMA.map((tautan) => (
            <Link key={tautan.href} href={tautan.href} className="nav-link">{tautan.label}</Link>
          ))}
        </div>
        <Link href="/publish-buku" className="nav-cta">Mulai berkarya <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
