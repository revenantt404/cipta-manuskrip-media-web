import type { ReactNode } from "react";

/**
 * Bingkai transisi antarhalaman.
 *
 * `template.tsx` — bukan `layout.tsx` — dipakai karena Next memasang ulang
 * template pada setiap navigasi. Itu yang membuat animasi masuk di bawah ini
 * diputar lagi saat pindah halaman, tanpa perlu JavaScript tambahan dan tanpa
 * perlu mendeteksi perubahan `pathname` di klien.
 *
 * Header, footer, dan panel samping panel admin berada di `layout`, jadi
 * mereka tidak ikut beranimasi: yang bergerak hanya isi halaman. Bingkainya
 * sengaja tidak memakai `overflow` maupun `position`, supaya tidak memotong
 * bayangan kartu dan tidak menggeser acuan elemen `sticky` di dalam halaman.
 *
 * Gerak dimatikan lewat `prefers-reduced-motion` di `globals.css`.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="route-transition">{children}</div>;
}
