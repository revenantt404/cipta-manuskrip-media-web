import Link from "next/link";
import { ArrowDown, ArrowUpRight, BookOpen, Feather, FileText, Sparkles } from "lucide-react";

const orbitNotes = [
  { icon: BookOpen, label: "Penerbitan buku", className: "orbit-note orbit-note-book" },
  { icon: Feather, label: "Karya & gagasan", className: "orbit-note orbit-note-feather" },
  { icon: FileText, label: "Publikasi artikel", className: "orbit-note orbit-note-paper" },
];

export default function Home() {
  return (
    <div>
      <section className="home-hero relative isolate overflow-hidden">
        <div aria-hidden="true" className="hero-grid" />
        <div aria-hidden="true" className="orbit orbit-outer" />
        <div aria-hidden="true" className="orbit orbit-middle" />
        <div aria-hidden="true" className="orbit orbit-inner" />

        {orbitNotes.map(({ icon: Icon, label, className }) => (
          <div key={label} aria-hidden="true" className={className}>
            <Icon size={19} strokeWidth={1.7} />
          </div>
        ))}

        <div className="hero-copy relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 text-center">
          <div className="eyebrow-pill"><Sparkles size={13} /> Ruang untuk karya yang berarti</div>
          <h1 className="hero-title mt-7 text-teks">
            Publikasi Semudah <span className="headline-accent">Beli Kopi.</span>
          </h1>
          <p className="hero-description mt-5 max-w-xl text-teks-sec">
            Layanan penerbitan buku dan publikasi artikel ilmiah.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/publish-buku" className="button-primary">
              Publish Buku <ArrowUpRight size={17} />
            </Link>
            <Link href="/publish-jurnal" className="button-secondary">
              Publish Jurnal <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className="book-scene" aria-label="Ilustrasi buku dan naskah">
            <div className="scene-glow" />
            <div className="orbit-dot orbit-dot-a" />
            <div className="orbit-dot orbit-dot-b" />
            <div className="orbit-dot orbit-dot-c" />
            <div className="scene-caption scene-caption-left"><span className="caption-rule" /> NASKAH</div>
            <div className="scene-caption scene-caption-right">GAGASAN <span className="caption-rule" /></div>
            <div className="book book-back"><div className="book-spine" /><div className="book-cover-lines" /></div>
            <div className="book book-front">
              <div className="cover-mark">CMM</div>
              <div className="cover-lines" aria-hidden="true"><span /><span /><span /><i /></div>
              <div className="cover-ornament" />
              <div className="book-page-edge" />
            </div>
            <div className="floating-note"><span className="note-icon"><Feather size={15} /></span><span><strong>Dari ide menjadi karya</strong><small>Mulai perjalanan publikasi</small></span></div>
          </div>
          <Link href="#pilih-layanan" className="scroll-cue"><span>Jelajahi layanan</span><ArrowDown size={15} /></Link>
        </div>
      </section>

      <section id="pilih-layanan" className="services-section mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Publikasikan karya Anda</p>
            <h2 className="section-title">Satu tujuan, <em>dua jalan berkarya.</em></h2>
          </div>
          <p className="section-intro">Temukan layanan yang paling sesuai dengan karya dan rencana publikasi Anda.</p>
        </div>

        <div className="service-grid mt-10">
          <Link href="/publish-buku" className="service-card service-card-book">
            <div className="service-card-top"><span className="service-icon"><BookOpen size={21} /></span><span className="service-index">01 / BUKU</span></div>
            <div className="service-card-content"><h3>Penerbitan Buku</h3><p>Wujudkan naskah menjadi buku yang siap menemani pembaca.</p><span className="service-link">Jelajahi layanan <ArrowUpRight size={16} /></span></div>
            <div className="card-decoration card-decoration-book" aria-hidden="true"><div /><div /><div /></div>
          </Link>
          <Link href="/publish-jurnal" className="service-card service-card-journal">
            <div className="service-card-top"><span className="service-icon"><FileText size={21} /></span><span className="service-index">02 / JURNAL</span></div>
            <div className="service-card-content"><h3>Publikasi Artikel Ilmiah</h3><p>Kenali layanan publikasi dan asistensi untuk artikel ilmiah Anda.</p><span className="service-link">Jelajahi layanan <ArrowUpRight size={16} /></span></div>
            <div className="card-decoration card-decoration-journal" aria-hidden="true"><div /><div /><div /><div /></div>
          </Link>
        </div>

        <div className="closing-note mt-16">
          <div className="closing-mark">
            {/* eslint-disable-next-line @next/next/no-img-element -- local transparent client mark; preserve direct src as required by handoff tests */}
            <img src="/logo-cmm-trim.png" alt="" />
          </div>
          <p><strong>Setiap karya punya cerita.</strong><br /><span>Mulai ceritakan karya Anda bersama Cipta Manuskrip Media.</span></p>
          <Link href="/tentang-kami" aria-label="Kenali Cipta Manuskrip Media"><ArrowUpRight size={20} /></Link>
        </div>
      </section>
    </div>
  );
}
