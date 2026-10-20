import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookById } from "@/lib/books/repository";
import { nilaiFormHarga } from "@/lib/books/price";
import { resolveCoverUrl } from "@/lib/storage/path";
import { FormBuku } from "../../FormBuku";
import { TombolHapus } from "../../TombolHapus";
import { updateBookAction, deleteBookAction } from "../../actions";
import type {
  AksiFormBuku,
  AksiHapusBuku,
  StateFormBuku,
} from "../../form-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Menyunting buku.
 *
 * `id` diikat ke action di sini, di sisi server. Kalau ia dibaca dari field
 * tersembunyi di form, siapa pun yang menyunting HTML bisa menggantinya dan
 * menyimpan perubahan ke buku lain — penjaga sesi tetap ada, tetapi admin
 * yang sah pun tidak boleh bisa menulis ke baris yang tidak ia pilih.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let buku;
  try {
    buku = await getBookById(id);
  } catch {
    return (
      <>
        <h1 className="text-2xl font-semibold">Sunting Buku</h1>
        <p data-testid="db-error" className="mt-4 text-red-700">
          Data buku sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.
        </p>
      </>
    );
  }

  if (buku === null) notFound();

  const awal: StateFormBuku = {
    errors: {},
    nilai: {
      title: buku.title,
      slug: buku.slug,
      author: buku.author,
      synopsis: buku.synopsis ?? "",
      publisherInfo: buku.publisherInfo,
      bookInfo: buku.bookInfo ?? "",
      status: buku.status,
      estimatedRelease: buku.estimatedRelease ?? "",
      isbn: buku.isbn ?? "",
      pricePrint: nilaiFormHarga(buku.pricePrint),
      priceEbook: nilaiFormHarga(buku.priceEbook),
    },
    percobaan: 0,
    ulangiSampul: false,
  };

  const ubahBuku: AksiFormBuku = updateBookAction.bind(null, buku.id);
  const hapusBukuAksi: AksiHapusBuku = deleteBookAction.bind(null, buku.id);

  return (
    <>
      <Link href="/admin/buku" className="text-sm text-zinc-600 hover:underline">
        ← Kembali ke daftar buku
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">Sunting Buku</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Alamat publik: <span className="font-mono">/buku/{buku.slug}</span>
      </p>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <FormBuku action={ubahBuku} awal={awal} mode="edit" />
        </div>

        <aside className="flex w-full max-w-xs flex-col gap-3 rounded border p-4">
          <p className="text-sm font-medium">Sampul saat ini</p>
          {/* Sampul sudah diperkecil dan dikompres sharp saat diunggah;
              next/image baru dikonfigurasi di Fase 3. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveCoverUrl(buku.coverPath)}
            alt={`Sampul ${buku.title}`}
            className="h-48 w-32 rounded border object-cover"
          />
          <p className="text-xs text-zinc-600">
            Pilih berkas baru di formulir bila ingin menggantinya.
          </p>

          <hr className="my-1 border-zinc-200" />

          <p className="text-sm font-medium">Hapus buku</p>
          <p className="text-xs text-zinc-600">
            Baris database dan berkas sampulnya ikut dihapus. Tindakan ini tidak bisa dibatalkan.
          </p>
          <TombolHapus action={hapusBukuAksi} judul={buku.title} />
        </aside>
      </div>
    </>
  );
}
