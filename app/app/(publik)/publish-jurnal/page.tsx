import Link from "next/link";
import { FASILITAS_JURNAL } from "@/content/site";

/**
 * Halaman layanan publish jurnal — komponen sinkron, tanpa pengambilan
 * data, jadi tanpa `force-dynamic` (berbeda dari `/publish-buku` yang
 * membaca database dan wajib dinamis).
 *
 * Urutan halaman: headline → dua tombol → empat area aset (`#bukti`,
 * `#korespondensi`, `#indeksasi`) plus daftar 13 fasilitas (`#fasilitas`).
 * `<main>` dokumen dimiliki layout `(publik)`, jadi pembungkus terluarnya
 * `<div>` — `<main>` bersarang adalah HTML tidak sah.
 *
 * Tiga area pertama memajang aset yang belum diserahkan klien, jadi
 * slotnya menampilkan `[Aset dari klien]` — jujur, bukan sementara
 * (docs/DESIGN-STACK.md §8). Isi tiap area hanya judul dan slot aset,
 * tanpa prosa deskriptif: deskripsi yang terdengar netral pun tetap
 * karangan bila klien tidak menyebutnya (contoh yang sudah disingkirkan:
 * OJS, github, keanggotaan). Halaman ini tidak menambah statistik,
 * jumlah terbit, atau janji apa pun di luar `FASILITAS_JURNAL`.
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-teks sm:text-4xl">
          Publikasi Artikel Ilmiah Sekali Klik.
        </h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/publish-jurnal/kirim-artikel"
            className="rounded-md bg-teal px-5 py-2.5 font-medium text-white hover:bg-teal-hover"
          >
            Kirim Artikel
          </Link>
          <Link
            href="/publish-jurnal/asistensi"
            className="rounded-md bg-lime px-5 py-2.5 font-medium text-teks hover:bg-lime-hover"
          >
            Belum Ada Artikel
          </Link>
        </div>
      </section>

      <section id="bukti" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Bukti Submission</h2>
        <div className="mt-4 rounded border border-garis bg-latar-alt p-5">
          <p className="text-teks-sec">[Aset dari klien]</p>
        </div>
      </section>

      <section id="korespondensi" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Dokumentasi Korespondensi</h2>
        <div className="mt-4 rounded border border-garis bg-latar-alt p-5">
          <p className="text-teks-sec">[Aset dari klien]</p>
        </div>
      </section>

      <section id="indeksasi" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Logo Indeksasi</h2>
        <div className="mt-4 rounded border border-garis bg-latar-alt p-5">
          <p className="text-teks-sec">[Aset dari klien]</p>
        </div>
      </section>

      <section id="fasilitas" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Fasilitas</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {FASILITAS_JURNAL.map((f) => (
            <li key={f} className="rounded border border-garis bg-latar-alt px-4 py-3 text-teks">
              {f}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
