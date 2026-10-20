import { KATEGORI_JURNAL } from "@/content/site";
import { FormAsistensi } from "@/components/FormAsistensi";

/**
 * Halaman asistensi penulisan artikel jurnal — komponen sinkron, tanpa
 * pengambilan data, jadi tanpa `force-dynamic`. Formulir topiknya ada di
 * `<FormAsistensi />` (komponen klien): topik hanya pernah masuk isi
 * pesan WhatsApp lewat `pesanAsistensi`, tidak pernah dikirim ke server.
 *
 * `<main>` dokumen dimiliki layout `(publik)`, jadi pembungkus terluarnya
 * `<div>` — `<main>` bersarang adalah HTML tidak sah. Tiga kategori jurnal
 * sama dengan `/publish-jurnal/kirim-artikel`; halaman ini tidak menambah
 * statistik, janji terbit, atau data lain di luar kategori.
 */
export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-teks sm:text-4xl">
          Asistensi Penulisan Artikel.
        </h1>
        <p className="mt-2 text-teks-sec">
          Tuliskan topik yang sedang Anda kerjakan, lalu lanjutkan ke admin
          lewat WhatsApp.
        </p>
      </section>

      <ul className="mt-8 grid gap-4">
        {KATEGORI_JURNAL.map((kategori) => (
          <li key={kategori} className="rounded border border-garis bg-latar-alt p-5">
            <h2 className="text-lg font-semibold text-teks sm:text-xl">{kategori}</h2>
          </li>
        ))}
      </ul>

      <FormAsistensi />
    </div>
  );
}
