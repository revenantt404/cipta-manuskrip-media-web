/**
 * Dipakai hanya oleh jalur webpack.
 *
 * Jalur Turbopack tidak membaca berkas ini: Tailwind di sana ditangani lewat
 * `turbopack.rules` di `next.config.ts`. Berkas ini ada karena server hosting
 * jatuh ke webpack (Turbopack menuntut SWC native, sedangkan server itu hanya
 * bisa memuat SWC WASM), dan webpack memproses CSS lewat PostCSS.
 *
 * Tanpa plugin ini, `@import "tailwindcss"` dan `@theme` lolos mentah ke
 * peramban sehingga seluruh kelas utilitas tidak pernah dibuat.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
