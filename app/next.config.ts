import type { NextConfig } from "next";

/**
 * Batas body Server Action.
 *
 * Bawaan Next.js 1 MB, sementara brief mengizinkan sampul sampai 5 MB
 * (`COVER_MAX_BYTES`). Tanpa dinaikkan, unggahan sah mana pun di atas 1 MB
 * ditolak framework dengan 413 sebelum kode aplikasi sempat berjalan, dan
 * admin melihat kegagalan tanpa pesan yang bisa ditindaklanjuti.
 *
 * Nilainya environment variable supaya bisa diturunkan di lingkungan yang
 * tidak menerima unggahan besar, tanpa menyentuh kode. Sisanya 1 MB di atas
 * batas bawaan sampul adalah ruang untuk overhead multipart — batas ini
 * berlaku pada body HTTP mentah, termasuk boundary dan header tiap bagian.
 */
const batasSampul = Number(process.env.COVER_MAX_BYTES ?? "") || 5 * 1024 * 1024;

// `SizeLimit` Next.js bertipe template literal (`${number}mb`), bukan
// `string`, jadi bentuknya ditegaskan di sini alih-alih di-cast di tempat
// pemakaian.
const batasBodyAksi: `${number}mb` = `${Math.ceil(
  (batasSampul + 1024 * 1024) / (1024 * 1024)
)}mb`;

const nextConfig: NextConfig = {
  // Wajib false: dengan `cacheComponents` aktif (default di 16.4.2),
  // route segment config ditolak saat build dan halaman yang membaca
  // database gagal di-prerender. `partialPrefetching` juga harus hilang —
  // ia menuntut `cacheComponents` menyala.
  cacheComponents: false,
  experimental: {
    serverActions: {
      bodySizeLimit: batasBodyAksi,
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
