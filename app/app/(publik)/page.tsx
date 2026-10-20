import Link from "next/link";

/**
 * Beranda — komponen sinkron, tanpa pengambilan data.
 *
 * Headline, paragraf pendukung, dan tombolnya dikunci brief §10. Tautan
 * katalog lama (`/katalog/telah-terbit`, `/katalog/segera-terbit`) sengaja
 * tidak ada di sini — katalog terjangkau lewat halaman layanan.
 */
export default function Home() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-teks sm:text-4xl">
        Publikasi Semudah Beli Kopi.
      </h1>
      <p className="mt-3 text-teks-sec sm:text-lg">
        Layanan penerbitan buku dan publikasi artikel ilmiah.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/publish-buku"
          className="rounded-md bg-teal px-5 py-2.5 font-medium text-white hover:bg-teal-hover"
        >
          Publish Buku
        </Link>
        <Link
          href="/publish-jurnal"
          className="rounded-md bg-lime px-5 py-2.5 font-medium text-teks hover:bg-lime-hover"
        >
          Publish Jurnal
        </Link>
      </div>
    </section>
  );
}
