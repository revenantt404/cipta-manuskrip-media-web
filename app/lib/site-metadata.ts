import type { Metadata } from "next";
import { siteUrl, type EnvSource } from "./env";

/**
 * Metadata root seluruh aplikasi, dipakai `app/app/layout.tsx`.
 *
 * Terpisah dari layout karena layout mengimpor `next/font/google`, yang
 * tidak dapat diimpor di Vitest (`TypeError: Geist is not a function`).
 * Metadata dibentuk fungsi murni di sini agar tes bisa menguncinya tanpa
 * menyentuh komponen, dan layout tinggal mengimpornya.
 */
export function metadataSitus(source: EnvSource = process.env): Metadata {
  return {
    // Tanpa `metadataBase`, Next.js 16.4.2 hanya memberi peringatan, tetapi
    // canonical dan OG image diam-diam memakai `http://localhost:3000` dan
    // itu bocor ke produksi. Nilainya dari `siteUrl()` agar mengikuti
    // `SITE_URL` environment.
    metadataBase: new URL(siteUrl(source)),
    // `default` wajib ada ketika `template` dipakai; tanpa itu build gagal.
    title: {
      default: "CV Cipta Manuskrip Media",
      template: "%s — CV Cipta Manuskrip Media",
    },
    description: "Layanan penerbitan buku dan publikasi artikel ilmiah.",
  };
}
