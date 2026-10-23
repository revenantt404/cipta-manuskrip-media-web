import type { Metadata } from "next";
import { metadataSitus } from "@/lib/site-metadata";
import "./globals.css";

/**
 * Metadata root dibentuk fungsi murni di `lib/site-metadata.ts`.
 *
 * Font tidak lagi diambil dari Google Fonts saat build. `next/font/google`
 * mengunduh berkasnya pada waktu kompilasi; di mesin tanpa akses keluar
 * (CI tertutup, hosting dengan firewall, atau jaringan yang memblokir
 * fonts.googleapis.com) langkah itu gagal dan **seluruh build berhenti** —
 * bukan hanya fontnya yang mundur ke cadangan. Karena situs ini hanya
 * memakai huruf sans biasa, tumpukan font sistem di `globals.css` memberi
 * hasil yang sama tanpa satu pun permintaan jaringan, tanpa FOUT, dan tanpa
 * ketergantungan pihak ketiga.
 */
export const metadata: Metadata = metadataSitus();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
