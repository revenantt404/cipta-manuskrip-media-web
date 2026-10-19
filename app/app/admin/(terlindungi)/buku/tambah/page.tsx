import type { Metadata } from "next";
import Link from "next/link";
import { createBookAction } from "../actions";
import { STATE_BUKU_AWAL } from "../form-state";
import { FormBuku } from "../FormBuku";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Page() {
  return (
    <>
      <Link href="/admin/buku" className="text-sm text-zinc-600 hover:underline">
        &larr; Kembali ke daftar buku
      </Link>

      <h1 className="mt-2 text-2xl font-semibold">Tambah buku</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Alamat halaman dibentuk otomatis dari judul.
      </p>

      <div className="mt-6 max-w-2xl">
        <FormBuku action={createBookAction} awal={STATE_BUKU_AWAL} />
      </div>
    </>
  );
}
