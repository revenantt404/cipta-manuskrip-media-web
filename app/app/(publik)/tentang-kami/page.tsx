import { KONTAK } from "@/content/site";

/**
 * Halaman tentang kami — komponen sinkron, tanpa pengambilan data, jadi
 * tanpa `force-dynamic`. `<main>` dokumen dimiliki layout `(publik)`, jadi
 * pembungkus terluarnya `<div>` — `<main>` bersarang adalah HTML tidak sah.
 *
 * Halaman paling rawan mengarang data perusahaan, jadi tegas: Profil,
 * Dokumen Resmi, dan Media Sosial hanya menampilkan penanda kurung siku
 * yang menyatakan materinya belum diserahkan klien — bukan paragraf yang
 * berpura-pura profil perusahaan sudah ada (brief §3; DESIGN-STACK §8).
 * Nama perusahaan dan kalimat audiens bersumber dari brief; sesuatu di
 * luar itu tidak ditulis.
 *
 * Kontak memakai nomor tampil dari `KONTAK` apa adanya; tautannya `tel:`
 * (bukan wa.me — brief hanya menetapkan format WhatsApp untuk pesan
 * buku/jurnal), dengan nomor yang sama sebagai teks tautan.
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-teks sm:text-4xl">
          Tentang CV Cipta Manuskrip Media.
        </h1>
        <p className="mt-2 text-teks-sec">
          Audiens utama layanan kami adalah dosen, tanpa menutup layanan
          untuk penulis dan masyarakat umum.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Profil</h2>
        <div className="mt-4 rounded border border-garis bg-latar-alt p-5">
          <p className="text-teks-sec">[Profil perusahaan — materi belum diserahkan klien]</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Dokumen Resmi</h2>
        <div className="mt-4 rounded border border-garis bg-latar-alt p-5">
          <p className="text-teks-sec">[Dokumen resmi — materi belum diserahkan klien]</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Kontak</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded border border-garis bg-latar-alt p-5">
            <p className="text-sm font-medium text-teks-sec">Admin Buku</p>
            <a
              href={`tel:${KONTAK.adminBuku}`}
              className="mt-1 block text-lg font-semibold text-teks hover:underline"
            >
              {KONTAK.adminBuku}
            </a>
          </div>
          <div className="rounded border border-garis bg-latar-alt p-5">
            <p className="text-sm font-medium text-teks-sec">Admin Jurnal</p>
            <a
              href={`tel:${KONTAK.adminJurnal}`}
              className="mt-1 block text-lg font-semibold text-teks hover:underline"
            >
              {KONTAK.adminJurnal}
            </a>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Media Sosial</h2>
        <div className="mt-4 rounded border border-garis bg-latar-alt p-5">
          <p className="text-teks-sec">[Akun media sosial — materi belum diserahkan klien]</p>
        </div>
      </section>
    </div>
  );
}
