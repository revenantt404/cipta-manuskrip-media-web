import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, LockKeyhole, Sparkles } from "lucide-react";
import { loginAction } from "../actions";
import { LOGIN_AWAL } from "../login-state";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="admin-login-page">
      <section className="admin-login-story" aria-label="Informasi panel admin">
        <Link href="/" className="admin-login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- local brand mark */}
          <img src="/logo-cmm-trim.png" alt="" />
          <span><strong>CIPTA</strong><small>MANUSKRIP MEDIA</small></span>
        </Link>
        <div className="admin-login-story-copy">
          <span className="admin-login-kicker"><Sparkles size={14} /> AREA PENGELOLAAN</span>
          <h1>Ruang kerja untuk merawat setiap <em>karya.</em></h1>
          <p>Kelola katalog buku, informasi terbit, dan naskah dengan lebih teratur.</p>
        </div>
        <div className="admin-login-visual" aria-hidden="true">
          <div className="admin-login-orbit admin-login-orbit-one" />
          <div className="admin-login-orbit admin-login-orbit-two" />
          <div className="admin-login-visual-core"><BookOpen size={31} strokeWidth={1.3} /><span>CIPTA<br />MANUSKRIP</span></div>
          <div className="admin-login-float admin-login-float-one"><span className="admin-login-float-dot" /><i /><i /></div>
          <div className="admin-login-float admin-login-float-two"><LockKeyhole size={17} /><span>RUANG ADMIN</span></div>
          <span className="admin-login-star admin-login-star-one">✳</span><span className="admin-login-star admin-login-star-two">✦</span>
        </div>
        <div className="admin-login-story-foot"><span>CV CIPTA MANUSKRIP MEDIA</span><span>BUKU · KARYA · PUBLIKASI</span></div>
      </section>

      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div className="admin-login-mobile-brand">
          {/* eslint-disable-next-line @next/next/no-img-element -- local brand mark */}
          <img src="/logo-cmm-trim.png" alt="" />
          <span><strong>CIPTA</strong><small>MANUSKRIP MEDIA</small></span>
        </div>
        <div className="admin-login-card">
          <span className="admin-login-card-icon"><LockKeyhole size={19} /></span>
          <p className="admin-login-overline">SELAMAT DATANG KEMBALI</p>
          <h2 id="admin-login-title">Masuk ke panel admin</h2>
          <p className="admin-login-subtitle">Gunakan akun admin untuk melanjutkan ke ruang kerja.</p>
          <FormLogin action={loginAction} awal={LOGIN_AWAL} />
          <div className="admin-login-demo-note"><span>Butuh melihat tampilannya?</span><Link href="/admin/preview">Buka pratinjau demo <ArrowUpRight size={14} /></Link></div>
          <Link href="/" className="admin-login-back"><ArrowLeft size={14} /> Kembali ke situs utama</Link>
        </div>
        <p className="admin-login-footnote">Akses admin terbatas untuk pengelola situs.</p>
      </section>
    </main>
  );
}
