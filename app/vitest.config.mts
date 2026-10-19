import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    setupFiles: ["./vitest.setup.ts"],
    // Wajib: tes berbagi satu database, dan `repository.test.ts` menghapus
    // isi tabel `books` di setiap beforeEach. Dijalankan paralel, ia akan
    // menghapus baris yang sedang diuji berkas tes lain secara acak.
    fileParallelism: false,
  },
});
