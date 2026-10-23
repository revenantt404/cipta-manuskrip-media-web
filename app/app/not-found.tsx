import Link from "next/link";
import { ArrowRight, BookOpen, Compass, FileText, Home } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * Halaman 404 untuk seluruh aplikasi.
 *
 * Berkas ini berada di akar `app/`, jadi ia menangkap dua hal sekaligus:
 * `notFound()` yang dilempar dari dalam segmen mana pun (mis. slug buku
 * yang tidak ada), dan alamat yang tidak cocok dengan route mana pun.
 *
 * Tanpa berkas ini Next.js memakai halaman bawaan berbahasa Inggris tanpa
 * header, footer, maupun `<main>` — bertentangan dengan brief §4 yang
 * menuntut antarmuka berbahasa Indonesia.
 *
 * Header dan footer diimpor langsung alih-alih diwarisi dari layout
 * `(publik)`: 404 akar dirender di dalam layout akar, bukan di dalam grup
 * `(publik)`, sehingga layout itu tidak ikut berjalan. Karena layout akar
 * tidak menyediakan `<main>`, landmark-nya dibuat di sini.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="notfound">
        <div className="notfound-card">
          <p className="notfound-code" aria-hidden="true">
            404
          </p>
          <p className="notfound-kicker">
            <Compass aria-hidden="true" size={13} /> Alamat tidak ditemukan
          </p>
          <h1>Halaman tidak ditemukan</h1>
          <p className="notfound-lede">
            Alamat yang Anda buka tidak tersedia. Mungkin tautannya salah ketik, atau buku
            yang Anda cari sudah tidak ditampilkan di katalog.
          </p>

          <div className="notfound-actions">
            <Link href="/" className="notfound-button notfound-button--primary">
              <Home aria-hidden="true" size={16} /> Kembali ke Beranda
            </Link>
            <Link href="/katalog/telah-terbit" className="notfound-button">
              <BookOpen aria-hidden="true" size={16} /> Lihat Katalog
            </Link>
          </div>

          <div className="notfound-shortcuts">
            <p>Atau menuju halaman lain</p>
            <ul>
              <li>
                <Link href="/publish-buku">
                  Penerbitan buku <ArrowRight aria-hidden="true" size={14} />
                </Link>
              </li>
              <li>
                <Link href="/publish-jurnal">
                  Publikasi jurnal <FileText aria-hidden="true" size={14} />
                </Link>
              </li>
              <li>
                <Link href="/tentang-kami">
                  Tentang kami <ArrowRight aria-hidden="true" size={14} />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
