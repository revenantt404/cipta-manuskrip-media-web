import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Wajib false: dengan `cacheComponents` aktif (default di 16.4.2),
  // route segment config ditolak saat build dan halaman yang membaca
  // database gagal di-prerender. `partialPrefetching` juga harus hilang —
  // ia menuntut `cacheComponents` menyala.
  cacheComponents: false,
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
