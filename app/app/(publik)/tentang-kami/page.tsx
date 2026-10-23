import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  FileText,
  Share2,
  Lightbulb,
  MessageCircle,
  PenLine,
  Phone,
  Sparkles,
} from "lucide-react";
import { KONTAK } from "@/content/site";

/** Judul tab halaman profil. */
export const metadata: Metadata = {
  title: "Tentang Kami",
  description:
    "CV Cipta Manuskrip Media membantu penulis merapikan perjalanan naskah, dari gagasan awal hingga menjadi karya yang siap dibagikan.",
};

/**
 * Halaman profil sementara. Narasi pengenalan dan nilai kerja di sini adalah
 * draf simulasi untuk kebutuhan desain, bukan klaim tentang legalitas,
 * rekam jejak, atau capaian. Bagian dokumen dan media sosial tetap menunggu
 * materi resmi dari klien. `<main>` dimiliki layout publik.
 */
export default function Page() {
  return (
    <div className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <div className="about-hero-copy">
          <div className="about-draft-pill"><Sparkles size={13} /> Profil sementara <span>•</span> Draf narasi</div>
          <p className="about-eyebrow"><span /> TENTANG CIPTA MANUSKRIP MEDIA</p>
          <h1 id="about-title">Gagasan baik, <em>layak</em> dirawat dengan baik.</h1>
          <p className="about-hero-lede">Kami ingin membantu penulis merapikan perjalanan naskah—dari gagasan awal hingga menjadi karya yang siap dibagikan.</p>
          <div className="about-hero-actions">
            <Link href="/publish-buku" className="about-button about-button-light">Jelajahi layanan buku <ArrowUpRight size={15} /></Link>
            <Link href="/publish-jurnal" className="about-hero-link">Layanan jurnal <ArrowRight size={14} /></Link>
          </div>
          <a className="about-scroll-cue" href="#profil"><ArrowDown size={14} /> Kenali cara pandang kami</a>
        </div>
        <div className="about-art about-art-studio" aria-hidden="true">
          <div className="about-art-orbit about-art-orbit-a" /><div className="about-art-orbit about-art-orbit-b" />
          <svg className="about-art-connections" viewBox="0 0 420 360" fill="none" aria-hidden="true">
            <path d="M103 106C142 129 150 163 183 180M285 102C255 127 245 151 231 175M108 264C143 237 158 214 185 199M296 253C266 232 251 211 231 197" />
            <circle cx="103" cy="106" r="4"/><circle cx="285" cy="102" r="4"/><circle cx="108" cy="264" r="4"/><circle cx="296" cy="253" r="4"/>
          </svg>
          <div className="about-art-core"><span className="about-art-core-glow" /><Sparkles size={45} strokeWidth={1.25} /><small>IDE</small></div>
          <div className="about-art-node about-art-node-chat"><span><MessageCircle size={21} strokeWidth={1.5} /></span><small>DISKUSI</small></div>
          <div className="about-art-node about-art-node-edit"><span><PenLine size={21} strokeWidth={1.5} /></span><small>EDITORIAL</small></div>
          <div className="about-art-node about-art-node-draft"><span><FileText size={20} strokeWidth={1.5} /></span><small>NASKAH</small></div>
          <div className="about-art-node about-art-node-share"><span><ArrowUpRight size={20} strokeWidth={1.5} /></span><small>BERBAGI</small></div>
          <div className="about-art-caption"><span /> RUANG UNTUK BERTUMBUH</div>
          <span className="about-art-spark about-spark-one">✳</span><span className="about-art-spark about-spark-two">✦</span>
        </div>
      </section>

      <section className="about-intro" id="profil">
        <div className="about-section-heading">
          <p className="about-kicker">01 / PROFIL</p>
          <h2>Setiap naskah punya perjalanan. <em>Kami hadir untuk mendampingi prosesnya.</em></h2>
        </div>
        <div className="about-intro-body">
          <p>Cipta Manuskrip Media adalah ruang pendampingan penerbitan yang berangkat dari satu keyakinan: gagasan yang bernilai perlu disajikan dengan cermat agar lebih mudah dipahami dan dibagikan.</p>
          <p>Kami melayani kebutuhan penerbitan buku dan pendampingan publikasi jurnal. Dosen menjadi salah satu audiens utama kami, bersama penulis dan masyarakat umum yang ingin mengembangkan naskahnya.</p>
          <div className="about-note"><Lightbulb size={17} /><span><strong>Catatan draf</strong> Narasi profil ini bersifat sementara dan akan disesuaikan dengan informasi resmi dari klien.</span></div>
        </div>
      </section>

      <section className="about-values" aria-labelledby="values-title">
        <div className="about-values-heading"><div><p className="about-kicker">02 / NILAI KERJA</p><h2 id="values-title">Hal-hal kecil yang <em>membentuk proses.</em></h2></div><p>Prinsip editorial yang menjadi arah dalam mendampingi setiap naskah.</p></div>
        <div className="about-values-grid">
          <article className="about-value-card"><span className="about-value-index">01</span><span className="about-value-icon"><Compass size={19} /></span><h3>Arah yang jelas</h3><p>Memulai dengan memahami kebutuhan naskah, lalu menyepakati langkah yang relevan bersama penulis.</p><span className="about-value-rule" /></article>
          <article className="about-value-card"><span className="about-value-index">02</span><span className="about-value-icon"><PenLine size={19} /></span><h3>Cermat dalam detail</h3><p>Menaruh perhatian pada kerapian bahasa, struktur, dan penyajian agar gagasan tersampaikan dengan baik.</p><span className="about-value-rule" /></article>
          <article className="about-value-card"><span className="about-value-index">03</span><span className="about-value-icon"><MessageCircle size={19} /></span><h3>Komunikasi terbuka</h3><p>Menjaga ruang diskusi yang hangat supaya penulis memahami proses dan pilihan yang sedang dijalani.</p><span className="about-value-rule" /></article>
        </div>
      </section>

      <section className="about-journey" aria-labelledby="journey-title">
        <div className="about-journey-copy"><p className="about-kicker">03 / SEBUAH PERJALANAN</p><h2 id="journey-title">Dari ide menuju <em>bentuk yang siap dibagikan.</em></h2><p>Setiap naskah berangkat dari kebutuhan yang berbeda. Gambaran ini adalah pengantar sederhana—detail proses dapat dibicarakan sesuai kebutuhan karya Anda.</p><Link href="/publish-jurnal" className="about-inline-link">Lihat layanan kami <ArrowUpRight size={15} /></Link></div>
        <ol className="about-steps">
          <li><span className="about-step-icon"><MessageCircle size={17} /></span><div><span>LANGKAH 01</span><h3>Mulai dengan percakapan</h3><p>Ceritakan naskah dan tujuan yang ingin dicapai.</p></div><Check size={15} className="about-step-check" /></li>
          <li><span className="about-step-icon"><FileText size={17} /></span><div><span>LANGKAH 02</span><h3>Petakan kebutuhan</h3><p>Kenali bentuk pendampingan yang sesuai untuk naskah.</p></div><Check size={15} className="about-step-check" /></li>
          <li><span className="about-step-icon"><BookOpen size={17} /></span><div><span>LANGKAH 03</span><h3>Rawat proses bersama</h3><p>Lanjutkan langkah editorial dengan komunikasi yang terbuka.</p></div><Check size={15} className="about-step-check" /></li>
        </ol>
      </section>

      <section className="about-contact" aria-labelledby="about-contact-title">
        <div className="about-contact-heading"><p className="about-kicker">04 / HUBUNGI KAMI</p><h2 id="about-contact-title">Kontak dan konsultasi naskah</h2><p>Silakan pilih tim yang sesuai dengan kebutuhan Anda.</p></div>
        <div className="about-contact-grid">
          <a className="about-contact-card" href={`tel:${KONTAK.adminBuku}`}><span className="about-contact-icon"><BookOpen size={18} /></span><span className="about-contact-copy"><small>UNTUK PENERBITAN BUKU</small><strong>Admin Buku</strong><b>{KONTAK.adminBuku}</b></span><Phone size={16} className="about-contact-arrow" /></a>
          <a className="about-contact-card" href={`tel:${KONTAK.adminJurnal}`}><span className="about-contact-icon about-contact-icon-journal"><FileText size={18} /></span><span className="about-contact-copy"><small>UNTUK PUBLIKASI JURNAL</small><strong>Admin Jurnal</strong><b>{KONTAK.adminJurnal}</b></span><Phone size={16} className="about-contact-arrow" /></a>
        </div>
      </section>

      <section className="about-pending" aria-label="Informasi yang menunggu materi resmi">
        <article className="about-pending-card"><span className="about-pending-icon"><FileText size={17} /></span><div><p className="about-kicker">INFORMASI MENYUSUL</p><h2>Dokumen Resmi</h2><p>Informasi dokumen perusahaan akan ditambahkan setelah materi resmi tersedia.</p></div><span className="about-pending-tag">BELUM TERSEDIA</span></article>
        <article className="about-pending-card"><span className="about-pending-icon"><Share2 size={17} /></span><div><p className="about-kicker">INFORMASI MENYUSUL</p><h2>Media Sosial</h2><p>Akun media sosial resmi akan ditautkan setelah detailnya dikonfirmasi.</p></div><span className="about-pending-tag">BELUM TERSEDIA</span></article>
      </section>
      <div className="about-endnote"><span>CV CIPTA MANUSKRIP MEDIA</span><span>PROFIL SEMENTARA — NARASI SIMULASI</span></div>
    </div>
  );
}
