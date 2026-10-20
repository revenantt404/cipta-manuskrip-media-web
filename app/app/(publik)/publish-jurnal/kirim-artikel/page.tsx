import { KATEGORI_JURNAL } from "@/content/site";
import { buildJournalSubmitUrl } from "@/lib/whatsapp";

/**
 * Halaman kirim artikel jurnal — komponen sinkron, tanpa pengambilan
 * data, jadi tanpa `force-dynamic` (build me-prarender halaman ini).
 * `<main>` dokumen dimiliki layout `(publik)`, jadi pembungkus terluarnya
 * `<div>` — `<main>` bersarang adalah HTML tidak sah.
 *
 * Naskah tidak pernah diunggah ke server: hanya tiga kategori jurnal,
 * masing-masing satu tautan WhatsApp ke admin jurnal melalui
 * `buildJournalSubmitUrl()` (nomor dan pesannya dikunci brief, jadi URL
 * tidak pernah dibangun tangan di sini). Tidak ada `<form>`, tidak ada
 * `type="file"`, dan tidak ada janji statistik/terbit di luar kategori.
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-teks sm:text-4xl">
          Kirim Artikel Jurnal Anda.
        </h1>
        <p className="mt-2 text-teks-sec">
          Pilih kategori jurnal tujuan, lalu kirimkan naskah Anda langsung ke
          admin lewat WhatsApp.
        </p>
      </section>

      <ul className="mt-8 grid gap-4">
        {KATEGORI_JURNAL.map((kategori) => (
          <li key={kategori} className="rounded border border-garis bg-latar-alt p-5">
            <h2 className="text-lg font-semibold text-teks sm:text-xl">{kategori}</h2>
            <a
              href={buildJournalSubmitUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-md bg-teal px-5 py-2.5 font-medium text-white hover:bg-teal-hover"
            >
              Kirim naskah via WhatsApp
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
