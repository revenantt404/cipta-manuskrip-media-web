import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { logoutAction } from "../actions";

// Dashboard membaca sesi lewat cookie dan data lewat database; keduanya
// harus dinilai saat permintaan datang, bukan dibekukan saat build.
export const dynamic = "force-dynamic";

// Brief bagian 7: route admin noindex. Ini BUKAN mekanisme keamanan —
// penjaganya tetap `requireAdmin` di bawah.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function Layout({ children }: LayoutProps<"/admin">) {
  // Satu-satunya penjaga seluruh route di bawah `/admin` kecuali login
  // (login ada di route group terpisah yang tidak memakai layout ini).
  // Diletakkan di layout, bukan di tiap halaman, supaya tidak ada halaman
  // baru yang bisa lupa memasangnya.
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 p-4 text-sm">
          <Link href="/admin" className="font-medium">
            Panel Admin
          </Link>
          <Link href="/admin/buku" className="text-zinc-600 hover:underline">
            Kelola Buku
          </Link>

          <span className="ml-auto text-zinc-600">{admin.email}</span>
          <form action={logoutAction}>
            <button type="submit" className="rounded border px-3 py-1 hover:bg-zinc-50">
              Keluar
            </button>
          </form>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 p-6">{children}</main>
    </div>
  );
}
