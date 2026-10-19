import { existsSync } from "node:fs";

// `next` memuat .env.local otomatis; `vitest` tidak. Baris ini menyamakan keduanya.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
