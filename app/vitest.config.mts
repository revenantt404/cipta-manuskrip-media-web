import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    // Sama dengan `paths` di tsconfig.json (`@/*` → `./*`). Tanpa ini,
    // tes komponen gagal me-resolve impor bergaya `@/lib/...`.
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**"],
    setupFiles: ["./vitest.setup.ts"],
    // Wajib: tes berbagi satu database, dan `repository.test.ts` menghapus
    // isi tabel `books` di setiap beforeEach. Dijalankan paralel, ia akan
    // menghapus baris yang sedang diuji berkas tes lain secara acak.
    fileParallelism: false,
  },
});
