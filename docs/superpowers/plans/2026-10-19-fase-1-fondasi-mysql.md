# Fase 1 — Fondasi & Koneksi Database MySQL: Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun fondasi aplikasi Next.js yang benar-benar terhubung ke database MySQL, lengkap dengan skema database, satu halaman publik yang membaca data nyata, perintah pembuatan akun admin, dan dokumentasi setup — sehingga Fase 2 (admin end-to-end) bisa langsung dikerjakan di atasnya.

**Architecture:** Aplikasi Next.js App Router dengan TypeScript strict, memakai MySQL 8.4 lewat driver `mysql2` dengan connection pool. Tidak memakai ORM dan tidak memakai Supabase. Skema database dibuat lewat file migration SQL bernomor yang idempoten. Data mengalir lewat satu lapisan repository tipis (`lib/db/`, `lib/books/`) sehingga komponen presentasi tidak pernah menyentuh SQL — inilah yang membuat perombakan UI di Arena nanti tidak menyentuh backend.

**Tech Stack:** Next.js 16.4.2 (App Router, Turbopack), React 19.3.0, TypeScript 5 (strict), Tailwind CSS 4, `mysql2` 3.24.6, `@node-rs/argon2` 2.2.2, Vitest 5.0.5, npm.

**Spec:** `docs/DESIGN-STACK.md` (desain lengkap), `docs/SPEC-AMENDMENT-01.md` (perubahan terhadap brief), `PROJECT-BACKEND-FIRST.md` (brief asli; bagian 2, 5, 6, 7, 11, 12, 13, 14 digantikan amandemen)

## Global Constraints

- **Versi terkunci, jangan di-upgrade tanpa alasan:** Next.js `16.4.2`, React `19.3.0`, `mysql2` `3.24.6`, `@node-rs/argon2` `2.2.2`, `vitest` `5.0.5`, TypeScript `5` (bukan 7 — lihat Task 1), Tailwind `4`.
- **`cacheComponents: false` wajib di `next.config.ts`.** Versi 16.4.2 menyalakannya secara default; dengan itu menyala, route segment config ditolak saat build dan halaman berdatabase gagal di-prerender. Sudah diuji: mematikannya membuat build lulus.
- **`partialPrefetching` wajib dihapus** (bukan disetel `false` — cukup dihilangkan). Hasil scaffold 16.4.2 menyalakannya, dan ia menuntut `cacheComponents` menyala. Membiarkannya sambil mematikan `cacheComponents` menggagalkan build dengan `partialPrefetching requires cacheComponents to be enabled`. Keduanya hilang dengan menimpa seluruh isi `next.config.ts` di Task 1.
- **Halaman yang membaca database wajib `export const dynamic = "force-dynamic"`.** Tanpa itu Next.js membekukan data saat build sehingga perubahan admin tidak pernah muncul di publik. Sudah diuji.
- **Jangan pakai `export const runtime`.** Ditolak saat `cacheComponents` aktif; penggantinya tidak diperlukan karena App Router sudah memakai runtime Node.js secara default.
- **Basis data:** MySQL 8.4, charset `utf8mb4`, collation `utf8mb4_0900_ai_ci` di tingkat database maupun tabel. Collation inilah yang membuat pengurutan A–Z tidak peka huruf besar-kecil tanpa functional index.
- **Semua query memakai parameter terikat (`?`).** Tidak ada penggabungan string ke dalam SQL dalam bentuk apa pun.
- **Tidak ada trigger database.** `updated_at` memakai `ON UPDATE CURRENT_TIMESTAMP`, yang perilakunya identik dan sudah diuji. Trigger berbadan `BEGIN ... END` tidak dapat dijalankan lewat driver MySQL tanpa penanganan `DELIMITER` khusus.
- **Bahasa antarmuka Indonesia.** Teks yang ditetapkan brief harus persis, termasuk `Belum ada buku yang diterbitkan.` dan `Belum ada buku yang segera terbit.`
- **Tidak ada data buku fiktif.** Database publik dimulai kosong. Data uji hanya hidup di dalam tes.
- **Jangan menambah fitur di luar brief.** Tidak ada akun member, registrasi, pembayaran, pencarian, filter, atau notifikasi.
- **Semua file teks disimpan UTF-8 tanpa BOM.**

**Catatan cakupan folder:** brief bagian 11 menyebut `lib/auth/`, `lib/storage/`, dan `lib/whatsapp.ts`. Ketiganya **tidak dibuat di Fase 1** karena belum ada kode yang mengisinya. Dibuat pada fase yang membutuhkannya: `lib/storage/` dan `lib/whatsapp.ts` di Fase 3, `lib/auth/` di Fase 2.

## Review Focus

Lima hal yang paling mungkin menggigit pengguna versi pertama. Setiap baris menyebut task yang menguji perilakunya:

1. **Database kosong vs database tidak dapat dihubungi.** Keduanya harus tampil berbeda: yang pertama `Belum ada buku yang diterbitkan.`, yang kedua pesan kegagalan koneksi. Menampilkan empty state saat koneksi putus adalah kebohongan yang membuat admin mengira buku hilang. → diuji di Task 8 langkah 7.
2. **Judul buku yang mengandung apostrof.** `Panduan Menulis 'Karya Ilmiah'` harus tersimpan, terbaca, dan tampil utuh. Query yang dirangkai dengan string akan rusak di sini; query terikat tidak. → diuji di Task 7 dan Task 8 langkah 8.
3. **Judul yang hanya berisi spasi.** `"   "` harus ditolak, bukan dianggap judul sah. → diuji di Task 6 dan Task 7.
4. **Urutan A–Z untuk judul dengan huruf besar-kecil campur.** `apel manis` harus muncul setelah `Apel`, dan `Bandung` sebelum `bandung laut`. → diuji di Task 7.
5. **Permintaan halaman di luar rentang.** `?page=99` pada katalog yang hanya punya satu halaman harus dinormalkan, bukan menampilkan daftar kosong atau galat. → diuji di Task 7.

---

### Task 1: Bootstrap proyek Next.js

**Files:**
- Create: `app/` (seluruh hasil scaffold)
- Modify: `app/next.config.ts`, `app/package.json`

**Interfaces:**
- Consumes: tidak ada
- Produces: proyek Next.js yang bisa `npm run build` dan `npm run start`, serta skrip `typecheck`

**Catatan penting:** `create-next-app` **menolak** dijalankan di direktori yang sudah berisi file — sudah diuji, gagal dengan pesan `The directory contains files that could conflict`. Karena direktori proyek sudah berisi PDF perjanjian, brief, dan folder `docs/`, aplikasi di-scaffold ke **subdirektori `app/`**.

- [ ] **Step 1: Scaffold aplikasi ke subdirektori `app/`**

Jalankan dari `C:\Users\ocako\Downloads\CiptaManuskripMedia`:

```bash
npx create-next-app@16.4.2 app --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --yes
```

Kalau muncul pertanyaan interaktif yang tidak tercakup flag di atas, terima nilai bawaan. Hasil yang diharapkan: folder `app/` berisi `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.gitignore`, dan subfolder `app/app/` berisi `layout.tsx`, `page.tsx`, `globals.css`.

- [ ] **Step 2: Verifikasi versi yang benar-benar terpasang**

```bash
cd app && node -p "JSON.stringify(require('./package.json').dependencies, null, 2)"
```

Hasil yang diharapkan: `next` `16.4.2`, `react` `19.3.0`, `react-dom` `19.3.0`.

- [ ] **Step 3: Kunci versi TypeScript ke 5**

`create-next-app` menulis `typescript: "^5"` tetapi npm dapat memasang 7.x yang belum tentu cocok dengan `eslint-config-next` 16.4.2:

```bash
cd app && npm install --save-exact --save-dev typescript@5
```

Verifikasi: `node -p "require('./package.json').devDependencies.typescript"` menampilkan versi pasti (tanpa `^`), berawalan `5.`.

- [ ] **Step 4: Matikan `cacheComponents` di `app/next.config.ts`**

**Timpa seluruh isi file**, jangan hanya mengubah satu baris. Hasil scaffold `create-next-app@16.4.2` berisi **dua** baris yang harus hilang:

```ts
cacheComponents: true,
partialPrefetching: true,
```

`partialPrefetching: true` **tidak boleh dibiarkan menyala** sementara `cacheComponents` dimatikan. Sudah diuji: build langsung mati dengan

```
Error: `partialPrefetching` requires `cacheComponents` to be enabled.
```

Menimpa seluruh isi file menghapus keduanya sekaligus. Kalau hanya baris `cacheComponents` yang diubah, Task 1 langkah 6 akan gagal dengan pesan di atas.

```ts
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
```

- [ ] **Step 5: Tambahkan skrip `typecheck` ke `app/package.json`**

Sisipkan ke dalam objek `scripts` sehingga menjadi:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 6: Verifikasi build lulus**

```bash
cd app && npm run build
```

Hasil yang diharapkan: `✓ Compiled successfully`, lalu exit code 0. Daftar route menampilkan `/` sebagai `○ (Static)`.

Kalau yang muncul `Error: \`partialPrefetching\` requires \`cacheComponents\` to be enabled.`, berarti langkah 4 hanya mengubah satu baris alih-alih menimpa seluruh isi file. Kembali ke langkah 4.

- [ ] **Step 7: Inisialisasi git dan commit**

PDF perjanjian dan brief ikut di-commit: keduanya dokumen induk proyek ini, dan repositorinya privat.

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git init
git add app docs PROJECT-BACKEND-FIRST.md "PERJANJIAN KESEPAKATAN KERJASAMA.pdf"
git commit -m "chore: bootstrap Next.js 16 + TypeScript strict + Tailwind" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

`.gitignore` dari scaffold sudah menutup `node_modules`, `.next`, dan `.env*`. Verifikasi `git status --porcelain` tidak menampilkan `node_modules`.

---

### Task 2: Konfigurasi environment dan kredensial database

**Files:**
- Create: `app/.env.example`, `app/.env.local`, `app/lib/env.ts`
- Modify: `app/.gitignore`

**Interfaces:**
- Consumes: proyek dari Task 1
- Produces: `type DbConfig = { host: string; port: number; user: string; password: string; database: string }` dan `readEnv(source?: NodeJS.ProcessEnv): DbConfig` dari `app/lib/env.ts`

- [ ] **Step 1: Tulis `app/.env.example`**

Nilai di bawah **bukan rahasia** — hanya contoh. Yang asli ada di `.env.local` yang tidak pernah di-commit.

```
# Koneksi database MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cipta_manuskrip_media

# Katalog: jumlah buku per halaman (brief bagian 9 menetapkan 12)
BOOKS_PER_PAGE=12

# Ukuran maksimum file sampul dalam byte (brief bagian 6 menetapkan 5 MiB).
# Dipakai mulai Fase 3.
COVER_MAX_BYTES=5242880
```

- [ ] **Step 2: Buat `app/.env.local`**

Nilai ini cocok dengan MySQL 8.4.3 Laragon yang sudah terverifikasi berjalan di komputer ini (root tanpa password):

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cipta_manuskrip_media
BOOKS_PER_PAGE=12
COVER_MAX_BYTES=5242880
```

- [ ] **Step 3: Pastikan `.env.local` diabaikan git**

Tambahkan ke akhir `app/.gitignore`:

```
# kredensial lokal
.env.local
.env*.local
```

Verifikasi: `cd app && git check-ignore -v .env.local` menampilkan baris `.gitignore` yang cocok.

- [ ] **Step 4: Tulis `app/lib/env.ts`**

```ts
export type DbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export function readEnv(source: NodeJS.ProcessEnv = process.env): DbConfig {
  const missing: string[] = [];
  const required = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"] as const;

  for (const key of required) {
    const value = source[key];
    if (value === undefined || value.trim() === "") missing.push(key);
  }

  if (missing.length > 0) {
    throw new Error(
      `Variabel environment belum diisi: ${missing.join(", ")}. Salin .env.example menjadi .env.local lalu isi nilainya.`
    );
  }

  const port = Number(source.DB_PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`DB_PORT harus bilangan bulat 1-65535, diterima: ${source.DB_PORT}`);
  }

  return {
    host: source.DB_HOST as string,
    port,
    user: source.DB_USER as string,
    password: source.DB_PASSWORD ?? "",
    database: source.DB_NAME as string,
  };
}
```

`DB_PASSWORD` sengaja tidak wajib: MySQL lokal Laragon memakai root tanpa password, sementara hosting akan mengisinya.

- [ ] **Step 5: Verifikasi type-check lulus**

```bash
cd app && npm run typecheck
```

Hasil yang diharapkan: tidak ada output, exit code 0.

- [ ] **Step 6: Commit**

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git add app/.env.example app/lib/env.ts app/.gitignore
git commit -m "chore: tambah konfigurasi environment dan validasi kredensial database" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

`.env.local` sengaja tidak ikut — sudah diabaikan git.

---

### Task 3: Migration SQL, skrip migrasi, dan skema database

**Files:**
- Create: `app/db/migrations/001_init.sql`, `app/db/README.md`, `app/scripts/migrate.mjs`
- Modify: `app/package.json`

**Interfaces:**
- Consumes: `readEnv()` dari Task 2 (skrip `.mjs` membaca env sendiri — lihat Step 2)
- Produces: tabel `books`, `admin_users`, `sessions`; skrip `npm run db:migrate` yang idempoten

**Catatan desain yang sudah diuji:** `id` memakai `CHAR(36) DEFAULT (UUID())` dan berfungsi di MySQL 8.4.3. `UUID()` di MySQL menghasilkan UUID versi 1 (berbasis waktu), bukan versi 4 — tetap unik, tetapi jangan diasumsikan v4.

- [ ] **Step 1: Tulis `app/db/migrations/001_init.sql`**

```sql
-- Migration 001 — skema awal CV Cipta Manuskrip Media
-- Idempoten: aman dijalankan ulang.

CREATE TABLE IF NOT EXISTS books (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  author VARCHAR(200) NOT NULL,
  synopsis TEXT NULL,
  publisher_info VARCHAR(255) NOT NULL DEFAULT 'CV Cipta Manuskrip Media',
  book_info TEXT NULL,
  cover_path VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  estimated_release VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_books_slug (slug),
  KEY idx_books_status_title (status, title, id),
  CONSTRAINT chk_books_status CHECK (status IN ('published', 'upcoming')),
  CONSTRAINT chk_books_title_not_blank CHECK (TRIM(title) <> ''),
  CONSTRAINT chk_books_author_not_blank CHECK (TRIM(author) <> ''),
  CONSTRAINT chk_books_cover_not_blank CHECK (TRIM(cover_path) <> ''),
  CONSTRAINT chk_books_published_synopsis CHECK (
    status <> 'published' OR (synopsis IS NOT NULL AND TRIM(synopsis) <> '')
  ),
  CONSTRAINT chk_books_upcoming_release CHECK (
    status <> 'upcoming' OR (estimated_release IS NOT NULL AND TRIM(estimated_release) <> '')
  ),
  CONSTRAINT chk_books_published_no_release CHECK (
    status <> 'published' OR estimated_release IS NULL
  )
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS admin_users (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email),
  CONSTRAINT chk_admin_users_email_not_blank CHECK (TRIM(email) <> '')
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) NOT NULL,
  admin_id CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY idx_sessions_admin (admin_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_admin
    FOREIGN KEY (admin_id) REFERENCES admin_users (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
```

`failed_attempts` dan `locked_until` ada di sini, bukan di memori proses: penghitung di memori hilang saat restart dan tidak berlaku lintas proses, sehingga pembatasan login gagal tidak nyata.

- [ ] **Step 2: Tulis `app/scripts/migrate.mjs`**

Skrip ini membaca setiap file `.sql` di `db/migrations/` berurutan, menjalankannya dengan `multipleStatements`, dan berhenti pada galat pertama. Skrip `.mjs` tidak meng-import `lib/env.ts` supaya tidak bergantung pada TypeScript — pembacaan env digandakan di sini.

```js
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "..", "db", "migrations");

function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Variabel environment belum diisi: ${name}`);
  }
  return value;
}

const connection = await mysql.createConnection({
  host: env("DB_HOST"),
  port: Number(env("DB_PORT")),
  user: env("DB_USER"),
  password: process.env.DB_PASSWORD ?? "",
  multipleStatements: true,
});

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${env("DB_NAME")}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
  );
  await connection.changeUser({ database: env("DB_NAME") });

  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    throw new Error(`Tidak ada file migration di ${migrationsDir}`);
  }

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    process.stdout.write(`Menjalankan ${file} ... `);
    await connection.query(sql);
    process.stdout.write("selesai\n");
  }

  console.log(`\n${files.length} migration diterapkan ke database "${env("DB_NAME")}".`);
} catch (error) {
  console.error("\nMigration gagal:", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
```

`DB_NAME` di-escape dengan backtick karena nilainya masuk ke DDL, sementara semua nilai lain di proyek ini memakai parameter terikat.

- [ ] **Step 3: Tambahkan skrip npm**

Tambahkan ke `scripts` di `app/package.json`:

```json
"db:migrate": "node --env-file=.env.local scripts/migrate.mjs"
```

`--env-file` fitur bawaan Node (diverifikasi pada Node 24.22.0) — tidak perlu paket `dotenv`.

- [ ] **Step 4: Jalankan migration**

```bash
cd app && npm run db:migrate
```

Hasil yang diharapkan:

```
Menjalankan 001_init.sql ... selesai

1 migration diterapkan ke database "cipta_manuskrip_media".
```

- [ ] **Step 5: Verifikasi skema benar-benar terbentuk**

```bash
"/c/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysql.exe" -u root -e "USE cipta_manuskrip_media; SHOW TABLES; SHOW CREATE TABLE books\G" | head -40
```

Hasil yang diharapkan: tiga tabel (`admin_users`, `books`, `sessions`), dan definisi `books` memuat seluruh constraint `chk_books_*` serta `UNIQUE KEY uq_books_slug`.

Catatan: `SHOW CREATE TABLE` dapat menampilkan `_cp850''` pada definisi CHECK karena charset klien Windows. Itu hanya masalah tampilan klien — sudah diuji bahwa data UTF-8 dan apostrof tersimpan benar.

- [ ] **Step 6: Verifikasi migration idempoten**

```bash
cd app && npm run db:migrate
```

Hasil yang diharapkan: sukses lagi tanpa galat — bukti `IF NOT EXISTS` bekerja.

- [ ] **Step 7: Tulis `app/db/README.md`**

Isi: cara menjalankan migration, aturan penamaan file (`NNN_nama.sql`, urut naik), peringatan bahwa migration wajib idempoten (`IF NOT EXISTS`), dan aturan bahwa setiap perubahan skema wajib lewat file migration — bukan lewat phpMyAdmin tanpa catatan.

- [ ] **Step 8: Commit**

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git add app/db app/scripts/migrate.mjs app/package.json
git commit -m "feat: tambah migration SQL dan skrip pembuatan skema database" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Koneksi database dan pengujiannya

**Files:**
- Create: `app/lib/db/pool.ts`, `app/lib/db/query.ts`, `app/lib/db/query.test.ts`
- Create: `app/vitest.config.ts`, `app/vitest.setup.ts`
- Modify: `app/package.json`

**Interfaces:**
- Consumes: `readEnv()` dari Task 2; tabel `books` dari Task 3
- Produces:
  - `getPool(): mysql.Pool`
  - `closePool(): Promise<void>`
  - `query<T>(sql: string, params?: unknown[]): Promise<T[]>`
  - `type ExecuteResult = { affectedRows: number; insertId: number }`
  - `execute(sql: string, params?: unknown[]): Promise<ExecuteResult>`

- [ ] **Step 1: Pasang dependensi**

```bash
cd app && npm install --save-exact mysql2@3.24.6 @node-rs/argon2@2.2.2 && npm install --save-exact --save-dev vitest@5.0.5
```

Verifikasi: `node -p "require('./package.json').dependencies"` menampilkan `mysql2` dan `@node-rs/argon2` tanpa tanda `^`.

- [ ] **Step 2: Tulis `app/vitest.setup.ts`**

Vitest **tidak** memuat `.env.local` sendiri seperti Next.js. Tanpa berkas ini, setiap tes database gagal dengan `Variabel environment belum diisi: DB_HOST`. `process.loadEnvFile()` adalah bawaan Node ≥20.12 — tidak perlu paket `dotenv`.

```ts
import { existsSync } from "node:fs";

// `next` memuat .env.local otomatis; `vitest` tidak. Baris ini menyamakan keduanya.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
```

- [ ] **Step 3: Konfigurasi Vitest di `app/vitest.config.ts`**

```ts
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
```

- [ ] **Step 4: Tambahkan skrip test**

Tambahkan ke `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Tulis tes yang gagal untuk koneksi**

`app/lib/db/query.test.ts` — tes ini memakai database sungguhan, bukan tiruan, karena inti Task 4 adalah membuktikan koneksi nyata bekerja:

```ts
import { describe, expect, it, afterAll } from "vitest";
import { query, execute, closePool } from "./query";

describe("koneksi database", () => {
  afterAll(async () => {
    await closePool();
  });

  it("menjalankan SELECT 1 dan mengembalikan satu baris", async () => {
    const rows = await query<{ hasil: number }>("SELECT 1 AS hasil");
    expect(rows).toHaveLength(1);
    expect(rows[0].hasil).toBe(1);
  });

  it("mengembalikan tipe kolom yang benar untuk data nyata", async () => {
    const rows = await query<{ judul: string; nomor: number }>(
      "SELECT ? AS judul, ? AS nomor",
      ["Buku Uji", 42]
    );
    expect(rows[0].judul).toBe("Buku Uji");
    expect(rows[0].nomor).toBe(42);
  });

  it("menolak query dengan SQL tidak valid", async () => {
    await expect(query("SELECT * FROM tabel_yang_tidak_ada")).rejects.toThrow();
  });

  it("memperlakukan parameter sebagai nilai, bukan SQL", async () => {
    const jahat = "'; DROP TABLE books; --";
    const rows = await query<{ hasil: string }>("SELECT ? AS hasil", [jahat]);
    expect(rows[0].hasil).toBe(jahat);

    const [masihAda] = await query<{ n: number }>(
      "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'books'"
    );
    expect(masihAda.n).toBe(1);
  });

  it("execute menyisipkan dan menghapus baris sungguhan", async () => {
    const disisipkan = await execute(
      `INSERT INTO books (title, slug, author, cover_path, status, synopsis)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["Buku Uji Koneksi", "buku-uji-koneksi", "Penulis", "covers/uji.webp", "published", "Sinopsis."]
    );
    expect(disisipkan.affectedRows).toBe(1);

    const dihapus = await execute("DELETE FROM books WHERE slug = ?", ["buku-uji-koneksi"]);
    expect(dihapus.affectedRows).toBe(1);
  });
});
```

- [ ] **Step 6: Jalankan tes untuk memastikan gagal**

```bash
cd app && npm test
```

Hasil yang diharapkan: GAGAL dengan pesan seperti `Failed to resolve import "./query"`.

- [ ] **Step 7: Tulis `app/lib/db/pool.ts`**

```ts
import mysql from "mysql2/promise";
import { readEnv } from "../env";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (pool === null) {
    const config = readEnv();
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      charset: "utf8mb4_0900_ai_ci",
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool !== null) {
    const sedangDitutup = pool;
    pool = null;
    await sedangDitutup.end();
  }
}
```

Satu pool dibagi seluruh proses: membuat pool per request akan menghabiskan koneksi MySQL. `closePool()` menyetel `pool = null` sebelum `end()` supaya `getPool()` berikutnya membuat pool baru, bukan mengembalikan pool yang sudah mati.

- [ ] **Step 7: Tulis `app/lib/db/query.ts`**

```ts
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getPool } from "./pool";

export { getPool, closePool } from "./pool";

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export type ExecuteResult = {
  affectedRows: number;
  insertId: number;
};

export async function execute(sql: string, params: unknown[] = []): Promise<ExecuteResult> {
  const [result] = await getPool().query<ResultSetHeader>(sql, params);
  return { affectedRows: result.affectedRows, insertId: result.insertId };
}
```

- [ ] **Step 8: Jalankan tes untuk memastikan lulus**

```bash
cd app && npm test
```

Hasil yang diharapkan: semua tes lulus. Tes ini memerlukan MySQL berjalan dan `app/.env.local` terisi — keduanya sudah disiapkan di Task 2 dan Task 3.

- [ ] **Step 9: Verifikasi type-check masih lulus**

```bash
cd app && npm run typecheck
```

- [ ] **Step 11: Commit**

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git add app/lib/db app/vitest.config.ts app/vitest.setup.ts app/package.json app/package-lock.json
git commit -m "feat: tambah koneksi database MySQL dan pengujiannya" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: Akun admin pertama

**Files:**
- Create: `app/scripts/create-admin.mjs`
- Modify: `app/package.json`

**Interfaces:**
- Consumes: tabel `admin_users` dari Task 3; `@node-rs/argon2` dari Task 4
- Produces: skrip `npm run db:create-admin -- --email <email>` yang membuat satu baris admin dengan hash argon2id

**Kenapa ini ada di Fase 1:** Fase 2 dibuka oleh halaman login. Tanpa akun yang benar-benar ada di database, halaman itu tidak bisa diuji sama sekali. Desain `docs/DESIGN-STACK.md` §9 memang menetapkan perintah ini sebagai bagian Fase 1.

**Kenapa tidak ada tes otomatis untuk prompt password:** membaca password tanpa echo memerlukan mode raw terminal yang tidak dapat diuji di lingkungan non-interaktif. Karena itu skrip menerima `ADMIN_PASSWORD` dari environment bila diisi — inilah jalur yang diverifikasi di Step 3.

- [ ] **Step 1: Tambahkan skrip npm**

Tambahkan ke `scripts` di `app/package.json`:

```json
"db:create-admin": "node --env-file=.env.local scripts/create-admin.mjs"
```

- [ ] **Step 2: Tulis `app/scripts/create-admin.mjs`**

Perilaku yang harus persis:

- Argumen `--email <email>` wajib. Kosong atau tanpa `@` → cetak `Email tidak valid.` lalu keluar dengan kode 1.
- Bila `process.env.ADMIN_PASSWORD` terisi, pakai nilai itu tanpa bertanya.
- Bila tidak terisi, tampilkan `Password admin: ` lalu baca dari stdin dengan echo dimatikan.
- Password kurang dari 12 karakter → cetak `Password minimal 12 karakter.` lalu keluar dengan kode 1.
- Email sudah ada di `admin_users` → cetak `Admin dengan email tersebut sudah ada.` lalu keluar dengan kode 1. Jangan menimpa.
- Sukses → cetak `Admin <email> dibuat.` lalu keluar dengan kode 0.

Nilai hash diambil apa adanya — parameter bawaan `@node-rs/argon2` sudah argon2id (m=19456, t=2, p=1, hash 97 karakter). Jangan diubah tanpa alasan:

```js
import { hash } from "@node-rs/argon2";

const passwordHash = await hash(password);
```

Fungsi pembaca password tanpa echo: gunakan `process.stdin.setRawMode(true)`, kumpulkan karakter satu per satu, tangani Ctrl+C (`\u0003`) dengan keluar kode 130, `\u007f` dan `\b` sebagai backspace, selesaikan pada `\r` atau `\n`; cetak `*` untuk setiap karakter yang diterima, lalu kembalikan `setRawMode(false)` dan panggil `stdin.pause()` sebelum resolve.

Struktur koneksi sama dengan `scripts/migrate.mjs` (Task 3), tetapi tanpa `multipleStatements` dan tanpa `CREATE DATABASE` — database sudah ada. Pemeriksaan email duplikat memakai `SELECT id FROM admin_users WHERE email = ?`.

- [ ] **Step 3: Verifikasi jalur non-interaktif**

```bash
cd app
ADMIN_PASSWORD=terlalupendek node scripts/create-admin.mjs --email admin@localhost; echo "exit=$?"
```

Hasil yang diharapkan: `Password minimal 12 karakter.` dan `exit=1`.

```bash
cd app
node scripts/create-admin.mjs --email bukanemail; echo "exit=$?"
```

Hasil yang diharapkan: `Email tidak valid.` dan `exit=1`.

- [ ] **Step 4: Buat akun admin pertama**

```bash
cd app
ADMIN_PASSWORD="<password pilihan>" node scripts/create-admin.mjs --email admin@localhost
```

Hasil yang diharapkan: `Admin admin@localhost dibuat.`

Catatan: memakai `ADMIN_PASSWORD` di baris perintah membuat password tercatat di riwayat shell. Untuk pembuatan akun sungguhan, jalankan `npm run db:create-admin -- --email <email>` dan ketik password saat diminta.

- [ ] **Step 5: Verifikasi hash benar-benar argon2id, bukan teks biasa**

```bash
"/c/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysql.exe" -u root -e "USE cipta_manuskrip_media; SELECT email, LEFT(password_hash, 22) AS awalan, LENGTH(password_hash) AS panjang, failed_attempts FROM admin_users;"
```

Hasil yang diharapkan: satu baris, `awalan` = `$argon2id$v=19$m=19`, `panjang` = 97, `failed_attempts` = 0. Kalau `panjang` jauh lebih pendek, password tersimpan sebagai teks biasa dan harus diperbaiki sebelum lanjut.

- [ ] **Step 6: Verifikasi email duplikat ditolak, bukan ditimpa**

```bash
cd app
node scripts/create-admin.mjs --email admin@localhost; echo "exit=$?"
```

Hasil yang diharapkan: `Admin dengan email tersebut sudah ada.` dan `exit=1`. Baris lama tetap utuh.

- [ ] **Step 7: Commit**

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git add app/scripts/create-admin.mjs app/package.json
git commit -m "feat: tambah perintah pembuatan akun admin dengan hash argon2id" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

Akun `admin@localhost` adalah akun pengembangan. Email dan passwordnya diganti dengan milik client sebelum serah terima — dicatat di `docs/PROGRESS.md` Task 9.

---

### Task 6: Validasi input dan pembentuk slug

**Files:**
- Create: `app/lib/validation/slug.ts`, `app/lib/validation/slug.test.ts`, `app/lib/validation/book.ts`, `app/lib/validation/book.test.ts`

**Interfaces:**
- Consumes: tidak ada (murni, tanpa I/O)
- Produces:
  - `slugify(judul: string): string`
  - `type BookInput = { title: string; slug: string; author: string; synopsis: string | null; publisherInfo: string; bookInfo: string | null; coverPath: string; status: "published" | "upcoming"; estimatedRelease: string | null }`
  - `type ValidationResult = { ok: true; value: BookInput } | { ok: false; errors: Record<string, string> }`
  - `validateBookInput(raw: unknown): ValidationResult`

- [ ] **Step 1: Tulis tes yang gagal untuk `slugify`**

`app/lib/validation/slug.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("mengubah judul sederhana menjadi slug huruf kecil", () => {
    expect(slugify("Terbit Buku Sekali Klik")).toBe("terbit-buku-sekali-klik");
  });

  it("menghapus apostrof dan tanda kutip", () => {
    expect(slugify("Panduan Menulis 'Karya Ilmiah'")).toBe("panduan-menulis-karya-ilmiah");
  });

  it("menghilangkan diakritik", () => {
    expect(slugify("Kupas Tuntas Sastra Édisi Kédua")).toBe("kupas-tuntas-sastra-edisi-kedua");
  });

  it("merapikan spasi dan tanda hubung berlebih", () => {
    expect(slugify("  Buku   --  Hebat  ")).toBe("buku-hebat");
  });

  it("membuang tanda baca di ujung", () => {
    expect(slugify("Apa Itu Publikasi?")).toBe("apa-itu-publikasi");
  });

  it("mengembalikan string kosong untuk input yang tidak menghasilkan huruf atau angka", () => {
    expect(slugify("!!! ??? ...")).toBe("");
  });

  it("tidak menghasilkan tanda hubung di awal atau akhir", () => {
    const hasil = slugify("-Buku-");
    expect(hasil.startsWith("-")).toBe(false);
    expect(hasil.endsWith("-")).toBe(false);
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memastikan gagal**

```bash
cd app && npx vitest run lib/validation/slug.test.ts
```

Hasil yang diharapkan: GAGAL — `Failed to resolve import "./slug"`.

- [ ] **Step 3: Tulis `app/lib/validation/slug.ts`**

`export function slugify(judul: string): string` — normalkan Unicode ke NFD lalu buang tanda diakritik (`normalize("NFD").replace(/[\u0300-\u036f]/g, "")`), ubah ke huruf kecil, ubah spasi **dan** tanda hubung yang sudah ada menjadi pemisah tunggal, buang semua karakter selain `a-z`, angka, dan pemisah, lalu pangkas pemisah di ujung.

Perhatikan urutan: diakritik dibuang **sebelum** huruf kecil. Karena tanda hubung input diperlakukan sebagai pemisah, `"Buku - Hebat"` dan `"Buku -- Hebat"` menghasilkan slug yang sama.

- [ ] **Step 4: Jalankan tes untuk memastikan lulus**

```bash
cd app && npx vitest run lib/validation/slug.test.ts
```

- [ ] **Step 5: Tulis tes yang gagal untuk validasi buku**

`app/lib/validation/book.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateBookInput } from "./book";

const valid = {
  title: "Buku Bagus",
  author: "Penulis Bagus",
  coverPath: "covers/abc.webp",
  status: "published",
  synopsis: "Sinopsis yang cukup panjang.",
  publisherInfo: "CV Cipta Manuskrip Media",
  bookInfo: "",
  estimatedRelease: "",
};

describe("validateBookInput", () => {
  it("menerima input published yang lengkap", () => {
    const hasil = validateBookInput(valid);
    expect(hasil.ok).toBe(true);
  });

  it("menolak judul yang hanya berisi spasi", () => {
    const hasil = validateBookInput({ ...valid, title: "   " });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.title).toBeDefined();
  });

  it("menolak published tanpa sinopsis", () => {
    const hasil = validateBookInput({ ...valid, synopsis: "  " });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.synopsis).toBeDefined();
  });

  it("menolak published yang masih punya estimasi terbit", () => {
    const hasil = validateBookInput({ ...valid, estimatedRelease: "Januari 2027" });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.estimatedRelease).toBeDefined();
  });

  it("menolak upcoming tanpa estimasi terbit", () => {
    const hasil = validateBookInput({
      ...valid,
      status: "upcoming",
      synopsis: "",
      estimatedRelease: "",
    });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.estimatedRelease).toBeDefined();
  });

  it("menerima upcoming dengan estimasi dan tanpa sinopsis", () => {
    const hasil = validateBookInput({
      ...valid,
      status: "upcoming",
      synopsis: "",
      estimatedRelease: "Maret 2027",
    });
    expect(hasil.ok).toBe(true);
  });

  it("menolak status selain published dan upcoming", () => {
    const hasil = validateBookInput({ ...valid, status: "draft" });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.status).toBeDefined();
  });

  it("menolak coverPath kosong", () => {
    const hasil = validateBookInput({ ...valid, coverPath: "  " });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.coverPath).toBeDefined();
  });

  it("melaporkan semua kesalahan sekaligus, bukan hanya yang pertama", () => {
    const hasil = validateBookInput({ ...valid, title: "  ", author: "  ", coverPath: "  " });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) {
      expect(hasil.errors.title).toBeDefined();
      expect(hasil.errors.author).toBeDefined();
      expect(hasil.errors.coverPath).toBeDefined();
    }
  });

  it("menerima judul dengan apostrof apa adanya", () => {
    const hasil = validateBookInput({ ...valid, title: "Panduan Menulis 'Karya Ilmiah'" });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.value.title).toBe("Panduan Menulis 'Karya Ilmiah'");
  });

  it("memangkas spasi di ujung judul dan penulis", () => {
    const hasil = validateBookInput({ ...valid, title: "  Buku  ", author: "  Penulis  " });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(hasil.value.title).toBe("Buku");
      expect(hasil.value.author).toBe("Penulis");
    }
  });

  it("mengisi publisherInfo dengan nilai bawaan bila kosong", () => {
    const hasil = validateBookInput({ ...valid, publisherInfo: "" });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.value.publisherInfo).toBe("CV Cipta Manuskrip Media");
  });

  it("mengubah string kosong menjadi null untuk field opsional", () => {
    const hasil = validateBookInput({ ...valid, bookInfo: "   " });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.value.bookInfo).toBeNull();
  });

  it("mengembalikan error untuk objek yang bukan bentuk yang diharapkan", () => {
    expect(validateBookInput(null).ok).toBe(false);
    expect(validateBookInput("teks").ok).toBe(false);
    expect(validateBookInput({}).ok).toBe(false);
    expect(validateBookInput([]).ok).toBe(false);
  });
});
```

- [ ] **Step 6: Jalankan tes untuk memastikan gagal**

```bash
cd app && npx vitest run lib/validation/book.test.ts
```

- [ ] **Step 7: Tulis `app/lib/validation/book.ts`**

`validateBookInput(raw: unknown): ValidationResult` yang mengumpulkan **semua** kesalahan sekaligus (bukan berhenti di yang pertama) supaya form bisa menampilkan semua masalah sekaligus. Aturan, mencerminkan constraint CHECK di Task 3:

- `title`, `author`, `coverPath` tidak boleh kosong setelah di-trim.
- `status` hanya `"published"` atau `"upcoming"`.
- `status === "published"` wajib punya `synopsis` yang tidak kosong setelah di-trim, dan wajib **tidak** punya `estimatedRelease`.
- `status === "upcoming"` wajib punya `estimatedRelease` yang tidak kosong setelah di-trim.
- String kosong setelah di-trim menjadi `null` untuk `synopsis`, `bookInfo`, dan `estimatedRelease`.
- `publisherInfo` kosong menjadi `"CV Cipta Manuskrip Media"`.
- `raw` yang bukan objek (termasuk `null` dan array) langsung mengembalikan `{ ok: false, errors: { form: "Data tidak dikenali." } }`.

- [ ] **Step 8: Jalankan seluruh tes untuk memastikan lulus**

```bash
cd app && npm test
```

- [ ] **Step 9: Commit**

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git add app/lib/validation
git commit -m "feat: tambah validasi input buku dan pembentuk slug" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: Repository buku

**Files:**
- Create: `app/lib/books/types.ts`, `app/lib/books/pagination.ts`, `app/lib/books/pagination.test.ts`
- Create: `app/lib/books/repository.ts`, `app/lib/books/repository.test.ts`

**Interfaces:**
- Consumes: `query()`, `execute()`, `closePool()` dari Task 4; `slugify()`, `validateBookInput()` dari Task 6
- Produces:

```ts
export type BookStatus = "published" | "upcoming";

export type Book = {
  id: string;
  title: string;
  slug: string;
  author: string;
  synopsis: string | null;
  publisherInfo: string;
  bookInfo: string | null;
  coverPath: string;
  status: BookStatus;
  estimatedRelease: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function normalizePage(raw: unknown, totalPages: number): number;

export function listBooks(opts: {
  status: BookStatus;
  page?: number;
  pageSize?: number;
}): Promise<Page<Book>>;

export function getBookBySlug(slug: string): Promise<Book | null>;
export function getBookById(id: string): Promise<Book | null>;

export type WriteResult =
  | { ok: true; book: Book }
  | { ok: false; errors: Record<string, string> };

export function createBook(input: unknown): Promise<WriteResult>;
export function updateBook(id: string, input: unknown): Promise<WriteResult>;
export function deleteBook(id: string): Promise<{ ok: boolean }>;
```

`pageSize` bawaan diambil dari `process.env.BOOKS_PER_PAGE`; bila tidak ada atau bukan bilangan bulat positif, dipakai `12`.

- [ ] **Step 1: Tulis tes yang gagal untuk `normalizePage`**

`app/lib/books/pagination.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizePage } from "./pagination";

describe("normalizePage", () => {
  it("menjepit halaman di atas jumlah halaman yang ada", () => {
    expect(normalizePage("99", 3)).toBe(3);
  });

  it("mengembalikan 1 untuk halaman nol atau negatif", () => {
    expect(normalizePage("0", 3)).toBe(1);
    expect(normalizePage("-5", 3)).toBe(1);
  });

  it("mengembalikan 1 untuk input yang bukan angka", () => {
    expect(normalizePage("abc", 3)).toBe(1);
    expect(normalizePage("", 3)).toBe(1);
    expect(normalizePage(undefined, 3)).toBe(1);
    expect(normalizePage("1.5", 3)).toBe(1);
    expect(normalizePage(Number.NaN, 3)).toBe(1);
  });

  it("membiarkan halaman yang sah apa adanya", () => {
    expect(normalizePage("2", 3)).toBe(2);
    expect(normalizePage(3, 3)).toBe(3);
  });

  it("mengembalikan 1 ketika hanya ada satu halaman", () => {
    expect(normalizePage("5", 1)).toBe(1);
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memastikan gagal**

```bash
cd app && npx vitest run lib/books/pagination.test.ts
```

Hasil yang diharapkan: GAGAL — `Failed to resolve import "./pagination"`.

- [ ] **Step 3: Tulis `app/lib/books/pagination.ts`**

`export function normalizePage(raw: unknown, totalPages: number): number` — ubah `raw` menjadi integer; kembalikan `1` bila hasilnya bukan integer positif; jepit ke rentang `1..Math.max(1, totalPages)`.

- [ ] **Step 4: Jalankan tes untuk memastikan lulus**

```bash
cd app && npx vitest run lib/books/pagination.test.ts
```

- [ ] **Step 5: Tulis `app/lib/books/types.ts`**

Tipe `BookStatus`, `Book`, `Page<T>`, dan `WriteResult` seperti blok Interfaces di atas, ditambah `export function mapRow(row: Record<string, unknown>): Book` yang mengubah `publisher_info` → `publisherInfo`, `book_info` → `bookInfo`, `cover_path` → `coverPath`, `estimated_release` → `estimatedRelease`, `created_at` → `createdAt` (sebagai `Date`), `updated_at` → `updatedAt` (sebagai `Date`).

- [ ] **Step 6: Tulis tes yang gagal untuk repository**

`app/lib/books/repository.test.ts` — memakai database sungguhan:

```ts
import { describe, expect, it, beforeEach, afterAll } from "vitest";
import { execute, closePool } from "../db/query";
import {
  listBooks,
  getBookBySlug,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "./repository";

async function bersihkan() {
  await execute("DELETE FROM books");
}

async function seed(
  judul: string,
  slug: string,
  status: "published" | "upcoming",
  penulis = "Penulis"
) {
  await execute(
    `INSERT INTO books (title, slug, author, cover_path, status, synopsis, estimated_release)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      judul,
      slug,
      penulis,
      `covers/${slug}.webp`,
      status,
      status === "published" ? "Sinopsis." : null,
      status === "upcoming" ? "Januari 2027" : null,
    ]
  );
}

function inputBuku(judul: string) {
  return {
    title: judul,
    author: "Penulis",
    coverPath: "covers/a.webp",
    status: "published" as const,
    synopsis: "Sinopsis.",
  };
}

describe("repository buku", () => {
  beforeEach(bersihkan);

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("mengembalikan halaman kosong ketika database kosong", async () => {
    const halaman = await listBooks({ status: "published" });
    expect(halaman.items).toHaveLength(0);
    expect(halaman.total).toBe(0);
    expect(halaman.page).toBe(1);
    expect(halaman.pageSize).toBe(12);
    expect(halaman.totalPages).toBe(1);
  });

  it("hanya mengembalikan buku dengan status yang diminta", async () => {
    await seed("Buku Terbit", "buku-terbit", "published");
    await seed("Buku Segera", "buku-segera", "upcoming");

    const terbit = await listBooks({ status: "published" });
    const segera = await listBooks({ status: "upcoming" });

    expect(terbit.items.map((b) => b.title)).toEqual(["Buku Terbit"]);
    expect(segera.items.map((b) => b.title)).toEqual(["Buku Segera"]);
  });

  it("mengurutkan A-Z tanpa membedakan huruf besar-kecil", async () => {
    await seed("zebra", "zebra", "published");
    await seed("Apel", "apel", "published");
    await seed("apel manis", "apel-manis", "published");
    await seed("Bandung", "bandung", "published");
    await seed("bandung laut", "bandung-laut", "published");

    const halaman = await listBooks({ status: "published" });
    expect(halaman.items.map((b) => b.title)).toEqual([
      "Apel",
      "apel manis",
      "Bandung",
      "bandung laut",
      "zebra",
    ]);
  });

  it("membagi hasil menjadi halaman dan melaporkan total dengan benar", async () => {
    for (let i = 1; i <= 14; i += 1) {
      await seed(`Buku ${String(i).padStart(2, "0")}`, `buku-${i}`, "published");
    }

    const halaman1 = await listBooks({ status: "published", page: 1 });
    const halaman2 = await listBooks({ status: "published", page: 2 });

    expect(halaman1.items).toHaveLength(12);
    expect(halaman2.items).toHaveLength(2);
    expect(halaman1.total).toBe(14);
    expect(halaman1.totalPages).toBe(2);
    expect(halaman1.items[0].title).toBe("Buku 01");
    expect(halaman2.items[0].title).toBe("Buku 13");
  });

  it("menormalkan nomor halaman di luar rentang", async () => {
    await seed("Buku Satu", "buku-satu", "published");
    const halaman = await listBooks({ status: "published", page: 99 });
    expect(halaman.page).toBe(1);
    expect(halaman.items).toHaveLength(1);
  });

  it("menerima pageSize dari pemanggil", async () => {
    for (let i = 1; i <= 5; i += 1) {
      await seed(`Buku ${String(i).padStart(2, "0")}`, `buku-${i}`, "published");
    }
    const halaman = await listBooks({ status: "published", pageSize: 2 });
    expect(halaman.items).toHaveLength(2);
    expect(halaman.pageSize).toBe(2);
    expect(halaman.totalPages).toBe(3);
  });

  it("menemukan buku berdasarkan slug dan mengembalikan null bila tidak ada", async () => {
    await seed("Buku Bagus", "buku-bagus", "published");
    const ditemukan = await getBookBySlug("buku-bagus");
    expect(ditemukan?.title).toBe("Buku Bagus");
    expect(await getBookBySlug("tidak-ada")).toBeNull();
  });

  it("menemukan buku berdasarkan id dan mengembalikan null bila tidak ada", async () => {
    await seed("Buku Bagus", "buku-bagus", "published");
    const lewatSlug = await getBookBySlug("buku-bagus");
    const lewatId = await getBookById(lewatSlug!.id);
    expect(lewatId?.title).toBe("Buku Bagus");
    expect(await getBookById("00000000-0000-0000-0000-000000000000")).toBeNull();
  });

  it("menyimpan judul dengan apostrof apa adanya", async () => {
    const hasil = await createBook(inputBuku("Panduan Menulis 'Karya Ilmiah'"));
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(hasil.book.title).toBe("Panduan Menulis 'Karya Ilmiah'");
    const dibaca = await getBookBySlug(hasil.book.slug);
    expect(dibaca?.title).toBe("Panduan Menulis 'Karya Ilmiah'");
  });

  it("membentuk slug otomatis dari judul", async () => {
    const hasil = await createBook(inputBuku("Terbit Buku Sekali Klik"));
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.book.slug).toBe("terbit-buku-sekali-klik");
  });

  it("menolak create dengan input tidak valid tanpa menyentuh database", async () => {
    const hasil = await createBook({ title: "   " });
    expect(hasil.ok).toBe(false);
    const halaman = await listBooks({ status: "published" });
    expect(halaman.total).toBe(0);
  });

  it("menolak slug duplikat dengan pesan yang bisa dibaca", async () => {
    const pertama = await createBook(inputBuku("Buku Sama"));
    expect(pertama.ok).toBe(true);

    const kedua = await createBook(inputBuku("Buku Sama"));
    expect(kedua.ok).toBe(false);
    if (!kedua.ok) expect(kedua.errors.slug).toBeDefined();
  });

  it("memperbarui buku dan mengubah updatedAt", async () => {
    const dibuat = await createBook(inputBuku("Judul Awal"));
    if (!dibuat.ok) throw new Error("gagal menyiapkan data");

    const sebelum = dibuat.book.updatedAt.getTime();
    await new Promise((selesai) => setTimeout(selesai, 1100));

    const hasil = await updateBook(dibuat.book.id, inputBuku("Judul Baru"));
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.book.title).toBe("Judul Baru");
    expect(hasil.book.updatedAt.getTime()).toBeGreaterThan(sebelum);
  });

  it("melaporkan gagal ketika memperbarui buku yang tidak ada", async () => {
    const hasil = await updateBook("00000000-0000-0000-0000-000000000000", inputBuku("Judul"));
    expect(hasil.ok).toBe(false);
  });

  it("menghapus buku yang ada dan melaporkan buku yang tidak ada", async () => {
    const dibuat = await createBook(inputBuku("Buku Hapus"));
    if (!dibuat.ok) throw new Error("gagal menyiapkan data");

    const hasil = await deleteBook(dibuat.book.id);
    expect(hasil.ok).toBe(true);
    expect(await getBookById(dibuat.book.id)).toBeNull();

    const lagi = await deleteBook("00000000-0000-0000-0000-000000000000");
    expect(lagi.ok).toBe(false);
  });
});
```

- [ ] **Step 7: Jalankan tes untuk memastikan gagal**

```bash
cd app && npx vitest run lib/books/repository.test.ts
```

- [ ] **Step 8: Tulis `app/lib/books/repository.ts`**

Seluruh query memakai `query()`/`execute()` dari Task 4 dengan parameter terikat. Hal-hal yang tidak boleh salah:

- **Urutan wajib** `ORDER BY title ASC, id ASC`. `id` sebagai tie-breaker membuat pagination deterministik ketika dua buku berjudul sama.
- **`LIMIT ? OFFSET ?`** memakai parameter terikat; konversikan ke integer lewat `Number()` sebelum dikirim.
- **`total`** dihitung dengan query `COUNT(*)` terpisah memakai filter status yang sama, bukan dari panjang array. `totalPages` = `Math.max(1, Math.ceil(total / pageSize))`.
- **`page` di hasil** adalah nilai yang sudah dinormalkan lewat `normalizePage`, sehingga pemanggil tidak perlu menormalkan lagi.
- **`createBook`**: panggil `validateBookInput()`; bila gagal, kembalikan `errors` tanpa menyentuh database. Slug dibentuk dari `slugify(value.title)` — input tidak boleh menentukan slug sendiri. Tangkap galat MySQL dengan `error.code === "ER_DUP_ENTRY"` dan ubah menjadi `errors.slug = "Slug sudah dipakai buku lain."`; jangan biarkan galat mentah naik ke UI.
- **`updateBook`**: validasi dulu, lalu `execute` UPDATE dengan `WHERE id = ?`. Bila `affectedRows` nol, kembalikan `{ ok: false, errors: { form: "Buku tidak ditemukan." } }`. Slug tidak ikut diperbarui.
- **`deleteBook`**: `{ ok: true }` hanya bila `affectedRows` bernilai 1.
- Hanya kolom yang boleh diisi admin yang masuk ke `INSERT`/`UPDATE`. `id`, `created_at`, dan `updated_at` tidak pernah ditulis dari kode.

- [ ] **Step 9: Jalankan tes untuk memastikan lulus**

```bash
cd app && npx vitest run lib/books/repository.test.ts
```

- [ ] **Step 10: Jalankan seluruh tes, lint, dan type-check**

```bash
cd app && npm test && npm run lint && npm run typecheck
```

- [ ] **Step 11: Verifikasi database bersih setelah tes**

Test dan build selesai. Sekarang periksa bahwa tabel buku memang kosong — inilah yang dibaca halaman publik:

```bash
"/c/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysql.exe" -u root -e "USE cipta_manuskrip_media; SELECT COUNT(*) AS buku_tersisa FROM books; SELECT COUNT(*) AS admin FROM admin_users;"
```

Hasil yang diharapkan: `buku_tersisa` = 0 dan `admin` = 1. Buku tidak boleh tertinggal dari tes; akun admin dari Task 5 harus masih ada (tabel `admin_users` tidak pernah dihapus oleh tes).

- [ ] **Step 12: Commit**

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git add app/lib/books
git commit -m "feat: tambah repository buku dengan pagination dan pengujiannya" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 8: Halaman publik yang membaca data nyata

**Files:**
- Create: `app/lib/books/status.ts`, `app/components/BookCard.tsx`, `app/app/katalog/[status]/page.tsx`
- Modify: `app/app/page.tsx`, `app/app/layout.tsx`

**Interfaces:**
- Consumes: `listBooks()`, `Book`, `Page<Book>` dari Task 7
- Produces: halaman `/katalog/telah-terbit` dan `/katalog/segera-terbit` yang membaca database, ditambah beranda bertaut ke keduanya

**Catatan:** ini bukan tahap desain. Tujuannya membuktikan aliran data bekerja dan semua keadaan tampil benar. Tailwind dipakai seadanya agar rapi dan bisa dipakai; desain visual sesungguhnya dikerjakan di Arena (brief bagian 4).

- [ ] **Step 1: Tulis `app/lib/books/status.ts`**

```ts
import type { BookStatus } from "./types";

export type CatalogueKind = {
  status: BookStatus;
  heading: string;
  emptyMessage: string;
};

const KINDS: Record<string, CatalogueKind> = {
  "telah-terbit": {
    status: "published",
    heading: "Buku yang Telah Terbit",
    emptyMessage: "Belum ada buku yang diterbitkan.",
  },
  "segera-terbit": {
    status: "upcoming",
    heading: "Buku Segera Terbit",
    emptyMessage: "Belum ada buku yang segera terbit.",
  },
};

export function catalogueKind(segment: string): CatalogueKind | null {
  return KINDS[segment] ?? null;
}

export const CATALOGUE_SEGMENTS = Object.keys(KINDS);
```

Kedua `emptyMessage` adalah teks persis dari brief bagian 9 — jangan diubah.

- [ ] **Step 2: Ubah `app/app/layout.tsx`**

Ubah `lang` menjadi `"id"` dan metadata menjadi `title: "CV Cipta Manuskrip Media"`, `description: "Layanan penerbitan buku dan publikasi artikel ilmiah."`. Pertahankan pemuatan font dan impor `globals.css` apa adanya.

- [ ] **Step 3: Tulis `app/components/BookCard.tsx`**

Komponen presentasi murni: menerima `book: Book` dan menampilkan judul, penulis, serta tautan ke `/buku/${book.slug}`. Komponen ini **tidak mengimpor apa pun** dari `lib/db/` atau `lib/books/repository` — hanya `import type { Book } from "@/lib/books/types"`. Inilah yang membuat perombakan UI di Arena nanti aman.

Tampilkan placeholder sederhana (kotak abu) alih-alih `<img>`, karena file sampul baru ada di Fase 3 dan `next/image` belum dikonfigurasi.

- [ ] **Step 4: Tulis `app/app/katalog/[status]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { listBooks } from "@/lib/books/repository";
import { catalogueKind } from "@/lib/books/status";
import { BookCard } from "@/components/BookCard";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ status: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { status } = await params;
  const kind = catalogueKind(status);
  if (kind === null) notFound();

  const { page } = await searchParams;

  let hasil;
  try {
    hasil = await listBooks({ status: kind.status, page: Number(page ?? 1) });
  } catch {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-semibold">{kind.heading}</h1>
        <p data-testid="db-error" className="mt-4 text-red-700">
          Katalog sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">{kind.heading}</h1>

      {hasil.items.length === 0 ? (
        <p data-testid="empty" className="mt-4">
          {kind.emptyMessage}
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {hasil.items.map((buku) => (
            <li key={buku.id}>
              <BookCard book={buku} />
            </li>
          ))}
        </ul>
      )}

      {hasil.totalPages > 1 ? (
        <nav className="mt-8 flex gap-2" aria-label="Navigasi halaman">
          {hasil.page > 1 ? (
            <a href={`?page=${hasil.page - 1}`} className="rounded border px-3 py-1">
              Prev
            </a>
          ) : null}
          {Array.from({ length: hasil.totalPages }, (_, i) => i + 1).map((n) => (
            <a
              key={n}
              href={`?page=${n}`}
              aria-current={n === hasil.page ? "page" : undefined}
              className="rounded border px-3 py-1"
            >
              {n}
            </a>
          ))}
          {hasil.page < hasil.totalPages ? (
            <a href={`?page=${hasil.page + 1}`} className="rounded border px-3 py-1">
              Next
            </a>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
```

Dua hal yang tidak boleh diubah: `export const dynamic = "force-dynamic"` (tanpa itu data dibekukan saat build), dan `params`/`searchParams` bertipe `Promise` yang di-`await` (bentuk ini khusus Next.js 15+; bentuk lama yang sinkron akan gagal).

Nomor halaman hanya dinormalkan di satu tempat: di dalam `listBooks`. Halaman ini cukup memakai `hasil.page` yang sudah dinormalkan, sehingga penanda halaman aktif tidak mungkin menyimpang dari isi yang ditampilkan.

- [ ] **Step 5: Ganti isi `app/app/page.tsx`**

Beranda sederhana: `<h1>Publikasi Semudah Beli Kopi.</h1>` (teks persis dari brief), paragraf `Layanan penerbitan buku dan publikasi artikel ilmiah.`, dan dua tautan ke `/katalog/telah-terbit` serta `/katalog/segera-terbit`.

- [ ] **Step 6: Verifikasi build lulus dan route ditandai dinamis**

```bash
cd app && npm run build
```

Hasil yang diharapkan: `✓ Compiled successfully`, dan pada daftar route `/katalog/[status]` ditandai `ƒ (Dynamic)`. Kalau yang muncul `○ (Static)`, `export const dynamic = "force-dynamic"` belum terpasang.

- [ ] **Step 7: Verifikasi urutan database kosong vs database bermasalah**

Jalankan `npm run start`, lalu:

1. Buka `http://localhost:3000/katalog/telah-terbit` dengan database kosong → harus tampil `Belum ada buku yang diterbitkan.`
2. Hentikan MySQL dari Laragon, muat ulang → harus tampil `Katalog sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.`
3. Nyalakan MySQL kembali, muat ulang → kembali ke pesan kosong.

Kedua keadaan ini wajib berbeda; inilah syarat brief bagian 9.

- [ ] **Step 8: Verifikasi data nyata muncul**

Masukkan satu baris lewat klien MySQL — bukan lewat kode aplikasi — supaya yang terbukti benar-benar pembacaan database:

```bash
"/c/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysql.exe" -u root -e "
USE cipta_manuskrip_media;
INSERT INTO books (title, slug, author, cover_path, status, synopsis)
VALUES ('Panduan Menulis ''Karya Ilmiah''', 'panduan-menulis-karya-ilmiah', 'Dr. Siti', 'covers/uji.webp', 'published', 'Buku tentang kepenulisan.');
"
```

Muat ulang halaman. Hasil yang diharapkan: judul `Panduan Menulis 'Karya Ilmiah'` muncul lengkap dengan apostrofnya. **Jangan restart server** — kalau judul baru muncul hanya setelah restart, `force-dynamic` tidak bekerja.

- [ ] **Step 9: Bersihkan data uji**

```bash
"/c/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysql.exe" -u root -e "USE cipta_manuskrip_media; DELETE FROM books; SELECT COUNT(*) AS sisa FROM books;"
```

Hasil yang diharapkan: `sisa` = 0. Database publik harus kosong sebelum diserahkan — katalog tidak diisi buku fiktif.

- [ ] **Step 10: Commit**

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git add app/app app/components app/lib/books/status.ts
git commit -m "feat: tambah halaman katalog yang membaca database dengan empty state dan error terpisah" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 9: Dokumentasi setup dan laporan Fase 1

**Files:**
- Create: `app/README.md` (ganti bawaan scaffold)
- Create: `docs/DATABASE-SETUP.md`, `docs/PROGRESS.md`

**Interfaces:**
- Consumes: seluruh hasil Task 1–8
- Produces: dokumentasi yang cukup untuk seseorang yang belum pernah melihat proyek ini

- [ ] **Step 1: Tulis ulang `app/README.md`**

Isi: prasyarat (Node ≥20.9, MySQL 8.4), langkah install (`npm install`), cara membuat `.env.local` dari `.env.example`, cara menjalankan migration (`npm run db:migrate`), cara membuat akun admin (`npm run db:create-admin -- --email <email>`), cara menjalankan (`npm run dev`), cara build dan menjalankan produksi, cara test (`npm test`), struktur folder ringkas, dan catatan bahwa Supabase tidak dipakai.

- [ ] **Step 2: Tulis `docs/DATABASE-SETUP.md`**

Menggantikan `docs/SUPABASE-SETUP.md` yang diminta brief bagian 15 — dokumen itu tidak relevan karena Supabase tidak dipakai. Isi: cara menyiapkan MySQL lokal lewat Laragon, cara menjalankan migration, cara membuat akun admin, aturan bahwa setiap perubahan skema wajib lewat file migration, dan catatan bahwa kredensial asli hidup di `.env.local` yang tidak di-commit.

- [ ] **Step 3: Tulis `docs/PROGRESS.md`**

Catat: fase yang sudah selesai, apa yang benar-benar diverifikasi dan dengan cara apa, apa yang masih terblokir, dan pekerjaan tersisa. Brief bagian 13 melarang menyebut fase selesai bila alur utama belum terverifikasi — jadi tulis apa adanya.

Blocker yang harus dicatat:

- Hosting belum dibeli, jadi verifikasi di server sungguhan belum bisa dilakukan. Fase 1 diverifikasi terhadap MySQL lokal.
- Versi MySQL/MariaDB di paket hosting belum diketahui. Kalau ternyata MariaDB dengan perilaku berbeda, penyesuaiannya terbatas pada file migration.
- Akun admin `admin@localhost` adalah akun pengembangan; email dan passwordnya diganti dengan milik client sebelum serah terima.
- Organisasi Supabase yang dibuat sebelumnya kini menganggur dan milik client — jangan dihapus tanpa sepengetahuan mereka.

- [ ] **Step 4: Jalankan pemeriksaan akhir**

```bash
cd app && npm run lint && npm run typecheck && npm test && npm run build
```

Semua harus lulus.

- [ ] **Step 5: Verifikasi tidak ada kredensial yang bocor**

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git status --porcelain
git grep -n -i -E "password|secret|service_role|api[_-]?key" -- app/ ':!app/package-lock.json'
```

Hasil yang diharapkan: `.env.local` tidak muncul di `git status`, dan pencarian hanya menemukan nama variabel di `.env.example` serta kode validasi — bukan nilai sungguhan.

- [ ] **Step 6: Commit**

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git add app/README.md docs/DATABASE-SETUP.md docs/PROGRESS.md
git commit -m "docs: tambah panduan setup database dan laporan progres Fase 1" -m "Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

- [ ] **Step 7: Berhenti dan laporkan**

Sesuai brief bagian 1: laporkan hasil, verifikasi yang benar-benar dijalankan, dan blocker — lalu **berhenti** dan tunggu persetujuan sebelum Fase 2. Jangan lanjut otomatis.

---

## Catatan untuk pelaksana

Tiga hal yang sudah diuji dengan menjalankan perintahnya, dan tidak perlu diragukan lagi:

1. **`create-next-app` menolak direktori tidak kosong.** Karena itu aplikasi masuk ke `app/`. Jangan mencoba menjalankannya di akar proyek.
2. **`cacheComponents: true` (default 16.4.2) merusak build halaman berdatabase.** Sudah diuji: halaman berdatabase yang sama lulus build dengan `cacheComponents: false` + `export const dynamic = "force-dynamic"` dan ditandai `ƒ (Dynamic)`. Yang lebih berbahaya: scaffold juga menyalakan `partialPrefetching`, dan **build langsung mati** kalau `cacheComponents` dimatikan sementara `partialPrefetching` dibiarkan — `partialPrefetching requires cacheComponents to be enabled`. Keduanya hilang hanya dengan menimpa seluruh isi `next.config.ts`, bukan mengubah satu baris.
3. **MySQL 8.4.3 sudah terpasang dan berjalan** di komputer ini lewat Laragon (`C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe`), user `root` tanpa password. MySQL 8.4 mendukung semua yang dibutuhkan: `DEFAULT (UUID())`, CHECK constraint yang benar-benar ditegakkan, dan collation `utf8mb4_0900_ai_ci` yang membuat urutan A–Z tidak peka huruf besar-kecil tanpa functional index.
