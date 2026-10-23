import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

/**
 * `SizeLimit` Next.js bertipe template literal (`${number}mb`), bukan
 * `string`, jadi bentuknya ditegaskan lewat JSDoc, bukan cast di pemakaian.
 *
 * @type {`${number}mb`}
 */
const batasBodyAksi = `${Math.ceil((batasSampul + 1024 * 1024) / (1024 * 1024))}mb`;

/**
 * Id build yang stabil.
 *
 * `.next` boleh dipakai ulang antar-build, tetapi build baru menimpa isinya.
 * Mengunci id ke hash `package-lock.json` membuat dua proses yang berbagi
 * folder (mis. build ulang di hosting saat server lama masih hidup) tidak
 * menghasilkan id berbeda untuk kode yang sama — klien lama tidak dipaksa
 * memuat ulang seluruh aset.
 *
 * `process.cwd()` dipakai karena `next build` dan `next start` selalu
 * dijalankan dari folder aplikasi, yaitu folder yang berisi berkas ini.
 *
 * @returns {string}
 */
function idBuild() {
  const pkg = readFileSync(join(process.cwd(), "package-lock.json"));
  return createHash("sha256").update(pkg).digest("hex").slice(0, 16);
}

/**
 * Konfigurasi Next.js.
 *
 * Berkas ini sengaja berformat `.mjs`, bukan `.ts`. Next hanya men-transpilasi
 * `next.config.ts` lewat SWC sebelum menjalankannya; di server hosting, SWC
 * native gagal dimuat (glibc lebih tua dari 2.29) dan Next jatuh ke SWC WASM.
 * Pada jalur itu build gagal dengan `ERR_MODULE_NOT_FOUND` yang menunjuk ke
 * `<hash>.next.config` — berkas yang tidak pernah ada. Berkas `.mjs` tidak
 * melewati jalur transpilasi sama sekali, sehingga masalah itu tidak bisa
 * terjadi. Tipe tetap terjaga lewat JSDoc di bawah.
 *
 * @type {import("next").NextConfig}
 */
const nextConfig = {
  // Wajib false: dengan `cacheComponents` aktif (default di 16.4.2),
  // route segment config ditolak saat build dan halaman yang membaca
  // database gagal di-prerender. `partialPrefetching` juga harus hilang —
  // ia menuntut `cacheComponents` menyala.
  cacheComponents: false,

  generateBuildId: idBuild,

  /**
   * Origin yang boleh memuat aset pengembangan.
   *
   * Next 16 memblokir permintaan ke resource dev (`/_next/hmr`, dsb.) dari
   * origin yang tidak terdaftar. Pratinjau berjalan di domain proxy
   * platform, bukan localhost, jadi tanpa daftar ini konsol dipenuhi
   * peringatan "Blocked cross-origin request" dan hot reload tidak jalan.
   * Tidak berpengaruh pada build produksi.
   */
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.e2b.app"],

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
