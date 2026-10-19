import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold tracking-tight">Publikasi Semudah Beli Kopi.</h1>
      <p className="mt-3 text-zinc-700">
        Layanan penerbitan buku dan publikasi artikel ilmiah.
      </p>

      <nav className="mt-6 flex flex-wrap gap-3">
        <Link href="/katalog/telah-terbit" className="rounded border px-4 py-2 hover:bg-zinc-50">
          Buku yang Telah Terbit
        </Link>
        <Link href="/katalog/segera-terbit" className="rounded border px-4 py-2 hover:bg-zinc-50">
          Buku Segera Terbit
        </Link>
      </nav>
    </main>
  );
}
