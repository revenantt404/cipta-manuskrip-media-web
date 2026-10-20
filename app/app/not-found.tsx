import Link from "next/link";
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
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-16 sm:px-6">
        <p className="text-sm font-medium text-teks-sec">404</p>
        <h1 className="text-3xl font-semibold tracking-tight text-teks">
          Halaman tidak ditemukan
        </h1>
        <p className="text-teks-sec">
          Alamat yang Anda buka tidak tersedia. Mungkin tautannya salah ketik,
          atau buku yang Anda cari sudah tidak ditampilkan.
        </p>

        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-md bg-teal px-5 py-2.5 font-medium text-white hover:bg-teal-hover"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/katalog/telah-terbit"
            className="rounded-md border border-garis px-5 py-2.5 font-medium text-teks hover:bg-latar-alt"
          >
            Lihat Katalog
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
