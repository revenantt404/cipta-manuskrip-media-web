import Link from "next/link";
import { countBooksByStatus } from "@/lib/books/repository";

export const dynamic = "force-dynamic";

export default async function Page() {
  let jumlah;
  try {
    jumlah = await countBooksByStatus();
  } catch {
    return (
      <>
        <h1 className="text-2xl font-semibold">Panel Admin</h1>
        <p data-testid="db-error" className="mt-4 text-red-700">
          Data buku sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Panel Admin</h1>
      <p className="mt-1 text-zinc-600">Ringkasan isi katalog.</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="rounded border p-4">
          <dt className="text-sm text-zinc-600">Telah terbit</dt>
          <dd data-testid="jumlah-published" className="mt-1 text-3xl font-semibold">
            {jumlah.published}
          </dd>
        </div>
        <div className="rounded border p-4">
          <dt className="text-sm text-zinc-600">Segera terbit</dt>
          <dd data-testid="jumlah-upcoming" className="mt-1 text-3xl font-semibold">
            {jumlah.upcoming}
          </dd>
        </div>
      </dl>

      <p className="mt-6">
        <Link href="/admin/buku" className="rounded border px-4 py-2 hover:bg-zinc-50">
          Kelola Buku
        </Link>
      </p>
    </>
  );
}
