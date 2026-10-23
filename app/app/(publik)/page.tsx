import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Feather,
  FileText,
  MessageCircle,
  PenLine,
  Sparkles,
} from "lucide-react";
import { KONTAK } from "@/content/site";

/**
 * Judul dan deskripsi beranda ditulis sendiri supaya hasil pencarian
 * menyebut dua layanan yang tersedia, bukan sekadar nama perusahaan.
 */
export const metadata: Metadata = {
  // Beranda memakai judul lengkap, bukan judul bawaan situs, karena judul
  // bawaan hanya berisi nama perusahaan dan tidak menjelaskan isinya di
  // hasil pencarian.
  title: {
    absolute: "Penerbitan Buku & Publikasi Artikel Ilmiah — CV Cipta Manuskrip Media",
  },
  description:
    "CV Cipta Manuskrip Media menerbitkan buku ber-ISBN dan mendampingi publikasi artikel ilmiah. Katalog, paket penerbitan, dan asistensi penulisan.",
};

const orbitNotes = [
  { icon: BookOpen, label: "Penerbitan buku", className: "orbit-note orbit-note-book" },
  { icon: Feather, label: "Karya & gagasan", className: "orbit-note orbit-note-feather" },
  { icon: FileText, label: "Publikasi artikel", className: "orbit-note orbit-note-paper" },
];

/**
 * Empat langkah ini merangkum alur yang sudah tertulis di halaman Tentang
 * Kami dan halaman layanan: percakapan, pemetaan kebutuhan, proses
 * editorial, lalu terbit. Tidak menambah tahapan atau jangka waktu baru.
 */
const LANGKAH = [
  {
    icon: MessageCircle,
    judul: "Ceritakan naskahnya",
    isi: "Mulai dari percakapan: hubungi admin lewat WhatsApp, atau isi formulir asistensi di halaman layanan.",
  },
  {
    icon: PenLine,
    judul: "Petakan kebutuhan",
    isi: "Kenali bentuk pendampingan yang sesuai — penyuntingan, tata letak, atau publikasi artikel ilmiah.",
  },
  {
    icon: Feather,
    judul: "Rawat prosesnya",
    isi: "Langkah editorial berjalan dengan komunikasi terbuka, sehingga penulis tahu apa yang sedang dikerjakan.",
  },
  {
    icon: BookOpen,
    judul: "Terbit ke katalog",
    isi: "Buku yang sudah terbit tampil di katalog dengan ISBN dan harganya; naskah yang masih disiapkan tampil tanpa harga.",
  },
];

/**
 * Tiga hal yang bisa diperiksa sendiri oleh pengunjung di halaman lain.
 * Sengaja dipilih yang punya bukti di situs ini, bukan klaim pemasaran.
 */
const PEGANGAN = [
  {
    icon: BadgeCheck,
    judul: "Pendampingan ISBN",
    isi: "Pendampingan proses ISBN tercantum pada setiap paket penerbitan buku.",
    tautan: { label: "Lihat paket buku", href: "/publish-buku#paket" },
  },
  {
    icon: BookOpen,
    judul: "Katalog terbuka",
    isi: "Buku yang sudah terbit menampilkan ISBN dan harga; buku yang belum terbit tidak diberi harga.",
    tautan: { label: "Buka katalog", href: "/katalog/telah-terbit" },
  },
  {
    icon: MessageCircle,
    judul: "Satu pintu percakapan",
    isi: "Pesanan dan pertanyaan diteruskan langsung ke admin lewat WhatsApp, tanpa akun atau keranjang.",
    tautan: { label: "Cara memesan", href: "/publish-jurnal/kirim-artikel" },
  },
];

/**
 * Pertanyaan yang benar-benar dijawab oleh halaman lain di situs ini.
 * Setiap jawaban merujuk perilaku yang sudah ada, supaya tidak ada janji
 * baru yang lahir dari bagian FAQ.
 */
const TANYA_JAWAB = [
  {
    tanya: "Bagaimana cara memesan buku dari katalog?",
    jawab:
      "Buka halaman buku, lalu pilih Beli Buku Cetak atau Sewa Ebook. Tautan tersebut membuka WhatsApp admin dengan judul buku sudah terisi otomatis.",
  },
  {
    tanya: "Mengapa buku segera terbit tidak mencantumkan harga?",
    jawab:
      "Karena bukunya belum dapat dipesan. Halamannya menampilkan status ISBN dan estimasi terbit apa adanya, tanpa angka harga.",
  },
  {
    tanya: "Haruskah naskah saya sudah lengkap?",
    jawab:
      "Tidak selalu. Halaman asistensi penulisan menerima topik atau gagasan yang sedang Anda kerjakan untuk dibicarakan lebih dulu dengan admin.",
  },
  {
    tanya: "Bagaimana cara mengirim artikel jurnal?",
    jawab:
      "Pilih kategori jurnal tujuan di halaman Kirim Artikel, lalu kirimkan naskah lewat WhatsApp. Naskah tidak diunggah ke server situs ini.",
  },
  {
    tanya: "Apakah isian formulir disimpan di situs?",
    jawab:
      "Tidak. Formulir asistensi hanya menyusun pesan WhatsApp; topik dan nama yang Anda tulis tidak disimpan di situs ini.",
  },
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
          <div className="hero-actions mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/publish-buku" className="button-primary">
              Publish Buku <ArrowUpRight size={17} />
            </Link>
            <Link href="/publish-jurnal" className="button-secondary">
              Publish Jurnal <ArrowUpRight size={17} />
            </Link>
          </div>

          <div className="book-scene" aria-label="Ilustrasi buku dan naskah">
            <div className="scene-glow" />
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
      </section>

      {/* Alur kerja: garis waktu yang menyala saat masuk layar. */}
      <section className="home-flow mx-auto max-w-6xl px-5 pb-24 sm:px-8" aria-labelledby="alur-title">
        <div className="home-section-head">
          <p className="section-kicker">Alur kerja</p>
          <h2 id="alur-title" className="section-title">Empat langkah, <em>satu perjalanan naskah.</em></h2>
          <p className="home-section-lede">
            Gambaran sederhana bagaimana sebuah naskah berjalan dari percakapan pertama sampai muncul di katalog.
          </p>
        </div>

        <ol className="home-steps">
          {LANGKAH.map(({ icon: Icon, judul, isi }, urutan) => (
            <li key={judul} className="home-step">
              <span className="home-step-rail" aria-hidden="true" />
              <span className="home-step-index">{String(urutan + 1).padStart(2, "0")}</span>
              <span className="home-step-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.7} /></span>
              <h3>{judul}</h3>
              <p>{isi}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Pegangan kerja: tiga hal yang bisa diperiksa sendiri di halaman lain. */}
      <section className="home-ground mx-auto max-w-6xl px-5 pb-24 sm:px-8" aria-labelledby="pegang-title">
        <div className="home-section-head home-section-head-row">
          <div>
            <p className="section-kicker">Yang kami pegang</p>
            <h2 id="pegang-title" className="section-title">Bukan janji besar, <em>melainkan hal yang bisa diperiksa.</em></h2>
          </div>
          <p className="home-section-lede">
            Semua tautan di bawah membuka halaman yang memang sudah memuat keterangan ini.
          </p>
        </div>

        <div className="home-ground-grid">
          {PEGANGAN.map(({ icon: Icon, judul, isi, tautan }) => (
            <article key={judul} className="home-ground-card">
              <span className="home-ground-icon" aria-hidden="true"><Icon size={19} strokeWidth={1.7} /></span>
              <h3>{judul}</h3>
              <p>{isi}</p>
              <Link href={tautan.href} className="home-ground-link">
                {tautan.label} <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Pintasan katalog: tanpa membaca database, jadi beranda tetap ringan. */}
      <section className="home-catalog mx-auto max-w-6xl px-5 pb-24 sm:px-8" aria-labelledby="katalog-title">
        <div className="home-catalog-panel">
          <div className="home-catalog-copy">
            <p className="section-kicker">Katalog penerbitan</p>
            <h2 id="katalog-title" className="section-title">Lihat naskah yang <em>sudah dan akan terbit.</em></h2>
            <p className="home-section-lede">
              Katalog disusun menurut abjad judul. Buku yang telah terbit mencantumkan ISBN dan harga.
            </p>
          </div>
          <div className="home-catalog-links">
            <Link href="/katalog/telah-terbit" className="home-catalog-card">
              <span className="home-catalog-icon" aria-hidden="true"><BookOpen size={19} strokeWidth={1.7} /></span>
              <span>
                <strong>Buku telah terbit</strong>
                <small>ISBN, harga cetak, dan sewa ebook.</small>
              </span>
              <ArrowUpRight size={16} className="home-catalog-arrow" />
            </Link>
            <Link href="/katalog/segera-terbit" className="home-catalog-card">
              <span className="home-catalog-icon home-catalog-icon-lime" aria-hidden="true"><Clock3 size={19} strokeWidth={1.7} /></span>
              <span>
                <strong>Buku segera terbit</strong>
                <small>Naskah yang sedang disiapkan, tanpa harga.</small>
              </span>
              <ArrowUpRight size={16} className="home-catalog-arrow" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tanya jawab memakai <details> bawaan browser: bisa dibuka tanpa JavaScript. */}
      <section className="home-faq mx-auto max-w-6xl px-5 pb-24 sm:px-8" aria-labelledby="faq-title">
        <div className="home-section-head">
          <p className="section-kicker">Tanya jawab</p>
          <h2 id="faq-title" className="section-title">Hal yang sering ditanyakan <em>sebelum mulai.</em></h2>
        </div>

        <div className="home-faq-list">
          {TANYA_JAWAB.map(({ tanya, jawab }) => (
            <details key={tanya} className="home-faq-item">
              <summary className="home-faq-question">
                <span>{tanya}</span>
                <ChevronDown size={17} className="home-faq-chevron" aria-hidden="true" />
              </summary>
              <div className="home-faq-answer"><p>{jawab}</p></div>
            </details>
          ))}
        </div>
      </section>

      {/* Kontak: nomor yang sama dengan footer dan halaman Tentang Kami. */}
      <section className="home-contact mx-auto max-w-6xl px-5 pb-24 sm:px-8" aria-labelledby="kontak-title">
        <div className="home-contact-panel">
          <div className="home-contact-copy">
            <p className="home-contact-kicker"><span aria-hidden="true" /> Mulai dari percakapan</p>
            <h2 id="kontak-title">Punya naskah yang ingin <em>dibicarakan?</em></h2>
            <p>
              Pilih tim yang paling dekat dengan kebutuhan Anda. Keduanya dihubungi lewat telepon atau WhatsApp
              dengan nomor yang sama seperti di halaman kontak.
            </p>
            <ul className="home-contact-points">
              <li><Check size={14} aria-hidden="true" /> Tanpa akun, tanpa keranjang</li>
              <li><Check size={14} aria-hidden="true" /> Naskah tidak diunggah ke situs</li>
            </ul>
          </div>

          <div className="home-contact-cards">
            <a className="home-contact-card" href={`tel:${KONTAK.adminBuku}`}>
              <span className="home-contact-icon" aria-hidden="true"><BookOpen size={18} strokeWidth={1.7} /></span>
              <span className="home-contact-body">
                <small>Penerbitan buku</small>
                <strong>Admin Buku</strong>
                <b>{KONTAK.adminBuku}</b>
              </span>
              <ArrowUpRight size={16} className="home-contact-arrow" aria-hidden="true" />
            </a>
            <a className="home-contact-card" href={`tel:${KONTAK.adminJurnal}`}>
              <span className="home-contact-icon home-contact-icon-lime" aria-hidden="true"><FileText size={18} strokeWidth={1.7} /></span>
              <span className="home-contact-body">
                <small>Publikasi jurnal</small>
                <strong>Admin Jurnal</strong>
                <b>{KONTAK.adminJurnal}</b>
              </span>
              <ArrowUpRight size={16} className="home-contact-arrow" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <div className="home-closing mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="closing-note">
          <div className="closing-mark">
            {/* eslint-disable-next-line @next/next/no-img-element -- local transparent client mark; preserve direct src as required by handoff tests */}
            <img src="/logo-cmm-trim.png" alt="" />
          </div>
          <p><strong>Setiap karya punya cerita.</strong><br /><span>Mulai ceritakan karya Anda bersama Cipta Manuskrip Media.</span></p>
          <Link href="/tentang-kami" aria-label="Kenali Cipta Manuskrip Media"><ArrowUpRight size={20} /></Link>
        </div>
      </div>
    </div>
  );
}
