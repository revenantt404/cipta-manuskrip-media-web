import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "../actions";
import { LOGIN_AWAL } from "../login-state";
import { FormLogin } from "./FormLogin";

// Halaman login tidak boleh masuk indeks mesin pencari. Brief bagian 7
// menegaskan ini BUKAN mekanisme keamanan — penjaganya tetap sesi di server.
export const metadata: Metadata = {
  title: "Masuk — CV Cipta Manuskrip Media",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Masuk</h1>
        <p className="mt-1 text-sm text-zinc-600">Panel admin CV Cipta Manuskrip Media.</p>
      </div>

      <FormLogin action={loginAction} awal={LOGIN_AWAL} />

      <Link href="/" className="text-sm text-zinc-600 underline">
        Kembali ke situs
      </Link>
    </main>
  );
}
