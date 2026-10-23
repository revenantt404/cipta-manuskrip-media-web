import Link from "next/link";
import { ArrowUpRight, BookOpen, FileText } from "lucide-react";
import { KONTAK, TAUTAN_LAYANAN } from "@/content/site";

const KATALOG = [
  { label: "Buku telah terbit", href: "/katalog/telah-terbit" },
  { label: "Buku segera terbit", href: "/katalog/segera-terbit" },
] as const;

const HALAMAN = [
  { label: "Beranda", href: "/" },
  { label: "Tentang Kami", href: "/tentang-kami" },
] as const;

/**
 * Footer situs publik — komponen presentasi murni, sinkron.
 *
 * Nama perusahaan dan tautan layanan bersumber dari brief §10; tanpa NIB,
 * NPWP, alamat, surel, atau tautan sosial apa pun karena semuanya
 * menunggu materi klien (brief §3).
 *
 * Katalog ikut ditautkan di sini. Sebelumnya kedua halaman katalog hanya
 * bisa dicapai lewat tombol "Lihat Semua" di halaman penerbitan buku,
 * sehingga pengunjung yang membuka Beranda tidak punya jalan menuju
 * katalog sama sekali.
 */
export function SiteFooter() {
  const tahun = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-glow" aria-hidden="true" />

      <div className="site-footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-brand-lockup" aria-label="CV Cipta Manuskrip Media — Beranda">
            <span className="footer-brand-mark">
              {/* eslint-disable-next-line @next/next/no-img-element -- local brand mark */}
              <img src="/logo-cmm-mark.png" alt="" />
            </span>
            <span className="footer-brand-name">
              <strong>CIPTA</strong>
              <small>MANUSKRIP MEDIA</small>
            </span>
          </Link>

          <p className="footer-tagline">Publikasi Semudah Beli Kopi.</p>
          <p className="footer-description">
            Layanan penerbitan buku dan publikasi artikel ilmiah untuk dosen, penulis,
            serta masyarakat umum.
          </p>
        </div>

        <div className="footer-col">
          <h2 className="footer-title">Layanan</h2>
          <nav aria-label="Tautan layanan" className="footer-nav">
            {TAUTAN_LAYANAN.map((tautan) => (
              <Link key={tautan.href} href={tautan.href} className="footer-link">
                {tautan.label}
                <ArrowUpRight aria-hidden="true" size={13} />
              </Link>
            ))}
            <Link href="/publish-jurnal/asistensi" className="footer-link">
              Asistensi penulisan
            </Link>
          </nav>
        </div>

        <div className="footer-col">
          <h2 className="footer-title">Katalog</h2>
          <nav aria-label="Tautan katalog" className="footer-nav">
            {KATALOG.map((tautan) => (
              <Link key={tautan.href} href={tautan.href} className="footer-link">
                {tautan.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer-col">
          <h2 className="footer-title">Kontak admin</h2>
          <ul className="footer-contact">
            <li>
              <span className="footer-contact-icon">
                <BookOpen aria-hidden="true" size={15} strokeWidth={1.7} />
              </span>
              <span className="footer-contact-copy">
                <small>Penerbitan buku</small>
                <a href={`tel:${KONTAK.adminBuku}`}>{KONTAK.adminBuku}</a>
              </span>
            </li>
            <li>
              <span className="footer-contact-icon footer-contact-icon--journal">
                <FileText aria-hidden="true" size={15} strokeWidth={1.7} />
              </span>
              <span className="footer-contact-copy">
                <small>Publikasi jurnal</small>
                <a href={`tel:${KONTAK.adminJurnal}`}>{KONTAK.adminJurnal}</a>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p>© {tahun} CV Cipta Manuskrip Media</p>
        <nav aria-label="Tautan halaman" className="site-footer-bottom-nav">
          {HALAMAN.map((tautan) => (
            <Link key={tautan.href} href={tautan.href}>
              {tautan.label}
            </Link>
          ))}
        </nav>
        <p className="site-footer-note">
          Katalog buku menjadi rujukan data terbit. Setiap tindak lanjut berlangsung lewat
          percakapan WhatsApp dengan admin.
        </p>
      </div>
    </footer>
  );
}
