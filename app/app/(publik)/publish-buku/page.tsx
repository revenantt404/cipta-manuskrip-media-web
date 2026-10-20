import { listBooks } from "@/lib/books/repository";
import { catalogueKind } from "@/lib/books/status";
import { CataloguePreview } from "@/components/CataloguePreview";
import { FormAsistensi } from "@/components/FormAsistensi";
import { PAKET_BUKU, PREVIEW_LIMIT } from "@/content/site";

// Wajib: halaman membaca database. Tanpa ini Next.js membekukan hasil query
// saat build dan previewnya tidak melihat buku yang baru ditambahkan admin —
// kelas bug yang sama dengan katalog.
export const dynamic = "force-dynamic";

/**
 * Halaman layanan publish buku.
 *
 * Urutan halaman dikunci brief §10: headline → dua tombol scroll → tiga
 * kartu paket (`#paket`) → section asistensi (`#asistensi`) → preview
 * published → preview upcoming. `<main>` dokumen dimiliki layout `(publik)`,
 * jadi di sini pembungkus terluarnya `<div>` — `<main>` bersarang adalah
 * HTML tidak sah.
 *
 * Kedua preview mengambil status, heading, dan empty message dari
 * `catalogueKind`, bukan literl yang diketik ulang di sini; nilai `status`
 * dari konstanta membuat kedua blok tidak pernah tumpah satu ke lainnya.
 */
export default async function Page() {
  const sudahTerbit = catalogueKind("telah-terbit");
  const segeraTerbit = catalogueKind("segera-terbit");

  let hasil: Awaited<ReturnType<typeof duaPreview>> | null;
  try {
    hasil = sudahTerbit === null || segeraTerbit === null ? null : await duaPreview();
  } catch {
    hasil = null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-teks sm:text-4xl">
          Terbit Buku Sekali Klik.
        </h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#paket"
            className="rounded-md bg-teal px-5 py-2.5 font-medium text-white hover:bg-teal-hover"
          >
            Kirim Naskah
          </a>
          <a
            href="#asistensi"
            className="rounded-md bg-lime px-5 py-2.5 font-medium text-teks hover:bg-lime-hover"
          >
            Asistensi Penulisan
          </a>
        </div>
      </section>

      <section id="paket" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Paket Terbit Buku</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PAKET_BUKU.map((paket, i) => (
            <div
              key={`${paket.nama}-${i}`}
              className="rounded border border-garis bg-latar-alt p-5"
            >
              <p className="font-medium text-teks">{paket.nama}</p>
              <p className="mt-2 text-teks-sec">{paket.harga}</p>
              <p className="mt-2 text-sm text-teks-sec">{paket.fasilitas}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="asistensi" className="mt-12 scroll-mt-24">
        <h2 className="text-xl font-semibold text-teks sm:text-2xl">Asistensi Penulisan</h2>
        <p className="mt-2 text-teks-sec">
          Pendampingan penulisan untuk artikel dan naskah buku. Hubungi admin
          untuk menanyakan ruang lingkup dan jadwalnya.
        </p>
        <FormAsistensi jenis="buku" />
      </section>

      <section className="mt-12">
        {sudahTerbit === null || hasil === null ? (
          <p data-testid="db-error" className="text-red-700">
            Preview katalog sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.
          </p>
        ) : (
          <>
            <div data-testid="preview-telah-terbit">
              <CataloguePreview
                heading={sudahTerbit.heading}
                emptyMessage={sudahTerbit.emptyMessage}
                items={hasil.terbit.items}
                lihatSemuaHref="/katalog/telah-terbit"
              />
            </div>
            {segeraTerbit === null ? null : (
              <div data-testid="preview-segera-terbit">
                <CataloguePreview
                  heading={segeraTerbit.heading}
                  emptyMessage={segeraTerbit.emptyMessage}
                  items={hasil.segera.items}
                  lihatSemuaHref="/katalog/segera-terbit"
                />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

async function duaPreview() {
  const sudah = await listBooks({ status: "published", page: 1, pageSize: PREVIEW_LIMIT });
  const akan = await listBooks({ status: "upcoming", page: 1, pageSize: PREVIEW_LIMIT });
  return { terbit: sudah, segera: akan };
}
