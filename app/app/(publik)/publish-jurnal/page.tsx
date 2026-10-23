import Link from "next/link";
import { ArrowDown, ArrowUpRight, BadgeCheck, Eye, FileText, Fingerprint, GraduationCap, Languages, Layers3, LayoutTemplate, Link2, MessageSquareText, MessagesSquare, PanelsTopLeft, PenLine, ScanSearch, ShieldCheck, Timer } from "lucide-react";
import type { Metadata } from "next";
import { FASILITAS_JURNAL } from "@/content/site";

/** Judul tab halaman layanan jurnal. */
export const metadata: Metadata = {
  title: "Publish Jurnal",
  description:
    "Fasilitas publikasi, dokumentasi, dan pilihan layanan artikel ilmiah dari CV Cipta Manuskrip Media.",
};

const IKON_FASILITAS = [
  Timer,
  Link2,
  MessagesSquare,
  Eye,
  ShieldCheck,
  PenLine,
  Fingerprint,
  GraduationCap,
  Languages,
  ScanSearch,
  PanelsTopLeft,
  LayoutTemplate,
  BadgeCheck,
] as const;

const AREA_ASET = [
  { id: "bukti", judul: "Bukti Submission", penanda: "01", ikon: FileText },
  { id: "korespondensi", judul: "Dokumentasi Korespondensi", penanda: "02", ikon: MessageSquareText },
  { id: "indeksasi", judul: "Logo Indeksasi", penanda: "03", ikon: ScanSearch },
];

/** UI editorial jurnal; seluruh konten layanan tetap mengikuti brief. */
export default function Page() {
  return (
    <div className="journal-page journal-overview">
      <section className="journal-hero">
        <div className="journal-hero-copy">
          <p className="journal-kicker"><span className="journal-kicker-line" /> LAYANAN PUBLIKASI JURNAL</p>
          <h1>Publikasi Artikel Ilmiah Sekali Klik.</h1>
          <p className="journal-hero-description">Jelajahi fasilitas publikasi, dokumentasi, dan pilihan layanan artikel ilmiah.</p>
          <div className="journal-hero-actions">
            <Link href="/publish-jurnal/kirim-artikel" className="journal-button journal-button-bright">Kirim Artikel <ArrowUpRight size={17} /></Link>
            <Link href="/publish-jurnal/asistensi" className="journal-button journal-button-outline">Belum Ada Artikel <ArrowUpRight size={17} /></Link>
          </div>
          <a className="journal-scroll" href="#fasilitas">Lihat fasilitas <ArrowDown size={14} /></a>
        </div>
        <div className="journal-hero-visual" aria-hidden="true">
          <div className="journal-visual-ring journal-ring-one" />
          <div className="journal-visual-ring journal-ring-two" />
          <div className="journal-paper-back"><i /><i /><i /><i /></div>
          <div className="journal-paper-front">
            <span className="paper-index">JOURNAL / ARTICLE</span>
            <span className="paper-glyph">J.</span>
            <span className="paper-rule" /><span className="paper-rule short" />
            <span className="paper-stamp"><Layers3 size={17} /></span>
          </div>
          <span className="journal-visual-caption">NASKAH · DOKUMENTASI · PUBLIKASI</span>
        </div>
      </section>

      <section className="journal-assets-section" aria-labelledby="journal-assets-title">
        <div className="journal-section-heading">
          <div><p className="journal-section-kicker">DOKUMENTASI</p><h2 id="journal-assets-title">Ruang untuk bukti publikasi.</h2></div>
          <p>Aset akan ditampilkan setelah materi dari klien tersedia.</p>
        </div>
        <div className="journal-assets-grid">
          {AREA_ASET.map(({ id, judul, penanda, ikon: Icon }) => (
            <section id={id} key={id} className="journal-asset-card">
              <div className="journal-asset-top"><span className="journal-asset-number">{penanda} / 03</span><Icon size={19} strokeWidth={1.6} /></div>
              <h3>{judul}</h3>
              <div className="journal-asset-placeholder"><span className="asset-placeholder-icon"><Icon size={21} /></span><span>[Aset dari klien]</span><i /></div>
            </section>
          ))}
        </div>
      </section>

      <section id="fasilitas" className="journal-facilities-section">
        <div className="journal-facilities-heading">
          <div><p className="journal-section-kicker">CAKUPAN LAYANAN</p><h2>Fasilitas</h2></div>
          <p>Daftar fasilitas publikasi artikel ilmiah.</p>
        </div>
        <ul className="journal-facilities-grid">
          {FASILITAS_JURNAL.map((fasilitas, i) => {
            const IkonFasilitas = IKON_FASILITAS[i];
            return (
              <li key={fasilitas} className="journal-facility">
                <span className="facility-number">{String(i + 1).padStart(2, "0")}</span>
                <span className="facility-check" aria-hidden="true"><IkonFasilitas size={14} strokeWidth={1.8} /></span>
                <span>{fasilitas}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="journal-next-step">
        <div><p className="journal-section-kicker">LANGKAH BERIKUTNYA</p><h2>Siap melanjutkan artikel?</h2></div>
        <div className="journal-next-actions">
          <Link href="/publish-jurnal/kirim-artikel" className="journal-button journal-button-dark">Kirim Artikel <ArrowUpRight size={16} /></Link>
          <Link href="/publish-jurnal/asistensi" className="journal-text-link">Belum Ada Artikel <ArrowUpRight size={15} /></Link>
        </div>
      </section>
    </div>
  );
}
