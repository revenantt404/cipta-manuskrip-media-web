# Fase 2: Panel Admin, Autentikasi Sesi, Penyimpanan Sampul, dan Halaman Detail Buku Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun panel admin lengkap (autentikasi sesi mandiri, proteksi rate-limit login, manajemen CRUD buku dengan unggah sampul dan kompensasi berkas) serta halaman publik detail buku (`/buku/[slug]`) dengan tautan pemesanan WhatsApp yang terintegrasi dengan database MySQL.

**Architecture:** Menggunakan Next.js App Router dengan Server Actions untuk mutasi data dan Server Components untuk render halaman. Autentikasi dikelola mandiri via token acak 32-byte ber-hash sha256 di tabel `sessions` dengan cookie HTTP-only, dan rate-limiting percobaan login disimpan langsung di tabel `admin_users` (`failed_attempts`, `locked_until`). Pemrosesan sampul buku menggunakan `sharp` (resize maks 1600px, kompres WebP) dengan kompensasi berkas otomatis jika transaksi database gagal.

**Tech Stack:** Next.js 16.4.2 (App Router, Turbopack), React 19.3.0, TypeScript 5.9.3 (strict), MySQL 8.4.3 (`mysql2`), `@node-rs/argon2`, `sharp` 0.35.5, Tailwind CSS v4, Vitest 5.0.5.

**Spec:** `PROJECT-BACKEND-FIRST.md` (terutama bagian 6, 7, 8, 9, 10, 13, 14), `docs/DESIGN-STACK.md`, `docs/SPEC-AMENDMENT-01.md`.

---

## Global Constraints

- Bahasa antarmuka: Bahasa Indonesia untuk semua teks publik dan dashboard admin.
- Format slug: huruf kecil, angka, dan tanda hubung (`slugify`), slug tidak berubah saat judul diedit.
- Batas berkas sampul: maksimal 5 MiB (`COVER_MAX_BYTES=5242880`), hanya format JPEG, PNG, dan WebP.
- Pemrosesan sampul: sisi terpanjang maksimal 1600px tanpa memperbesar gambar kecil, dikompres ke WebP dengan nama UUID acak, disimpan di folder storage dan path disimpan di DB.
- Kompensasi berkas:
  - Tambah buku: simpan berkas -> simpan DB -> jika DB gagal, hapus berkas baru.
  - Ganti sampul: simpan berkas baru -> update DB -> baru hapus berkas lama. Jika update DB gagal, hapus berkas baru dan pertahankan berkas lama.
  - Hapus buku: hapus baris DB -> bersihkan berkas sampul terkait.
- Keamanan auth:
  - Password di-hash menggunakan argon2id.
  - Sesi berbasis token acak 32-byte, disimpan hash sha256 (`CHAR(64)`) di database, cookie `httpOnly`, `SameSite=Lax`, `Secure` (saat produksi).
  - Rate limiting di database: 5 kali percobaan gagal mengunci akun selama 15 menit (`locked_until`).
  - Semua Server Action mutasi wajib memeriksa sesi admin terlebih dahulu.
- WhatsApp:
  - Nomor buku: `6289671894900`
  - Pesan cetak: `Mau pesan buku cetak judul [judul]`
  - Pesan sewa: `Mau sewa ebook judul [judul]` (ejaan `ebook` dipertahankan)
- Penanganan galat DB publik vs Not Found: galat koneksi DB menampilkan pesan error terpisah, bukan halaman 404.

---

## Review Focus

1. **Sinkronisasi waktu lockout akun**: Perbandingan waktu `locked_until` menggunakan perbandingan database `NOW()` atau ISO UTC string agar tidak terjadi divergensi zona waktu antara Node.js dan MySQL.
2. **Direktori penyimpanan sampul belum ada**: Direktori target `public/covers` harus dibuat otomatis (`recursive: true`) sebelum penulisan berkas agar tidak terjadi `ENOENT` pada environment baru.
3. **Kompensasi berkas saat validasi/DB gagal**: Saat upload sampul berhasil tetapi insert database gagal (misal judul duplikat yang menghasilkan benturan slug), berkas fisik baru harus langsung terhapus dari disk agar tidak menjadi orphan.
4. **Sunting buku tanpa mengganti sampul**: Saat admin memperbarui judul/sinopsis tanpa memilih berkas baru, `cover_path` lama harus tetap dipertahankan dan berkas lama tidak boleh terhapus.
5. **Karakter khusus pada tautan WhatsApp**: Judul yang memuat tanda petik, apostrof, atau karakter non-ASCII harus ter-encode dengan aman menggunakan `encodeURIComponent` pada tautan WhatsApp.

---

### Task 1: Helper WhatsApp dan Halaman Publik Detail Buku (`/buku/[slug]`)

**Files:**
- Create: `app/lib/whatsapp.ts`
- Test: `app/lib/whatsapp.test.ts`
- Create: `app/app/buku/[slug]/page.tsx`
- Test: `app/app/buku/[slug]/page.test.ts`

**Interfaces:**
- Consumes: `getBookBySlug(slug: string): Promise<Book | null>` dari `app/lib/books/repository.ts`
- Produces:
  - `buildBookOrderUrl(title: string, type: "cetak" | "ebook"): string`
  - Halaman `Page({ params }: { params: Promise<{ slug: string }> })` di `app/app/buku/[slug]/page.tsx`

- [ ] **Step 1: Tulis tes unit untuk WhatsApp order URL helper**

```typescript
// app/lib/whatsapp.test.ts
import { describe, it, expect } from "vitest";
import { buildBookOrderUrl } from "./whatsapp";

describe("buildBookOrderUrl", () => {
  it("membentuk tautan pemesanan buku cetak dengan format persis", () => {
    const url = buildBookOrderUrl("Filsafat Ilmu", "cetak");
    expect(url).toBe("https://wa.me/6289671894900?text=Mau%20pesan%20buku%20cetak%20judul%20Filsafat%20Ilmu");
  });

  it("membentuk tautan sewa ebook dengan penulisan ebook tetap persis", () => {
    const url = buildBookOrderUrl("Panduan Menulis 'Karya Ilmiah'", "ebook");
    expect(url).toBe("https://wa.me/6289671894900?text=Mau%20sewa%20ebook%20judul%20Panduan%20Menulis%20%27Karya%20Ilmiah%27");
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npm test app/lib/whatsapp.test.ts`
Expected: FAIL (module `./whatsapp` tidak ditemukan).

- [ ] **Step 3: Implementasikan `buildBookOrderUrl` di `app/lib/whatsapp.ts`**

```typescript
// app/lib/whatsapp.ts
const WA_BOOK_PHONE = "6289671894900";

export function buildBookOrderUrl(title: string, type: "cetak" | "ebook"): string {
  const text =
    type === "cetak"
      ? `Mau pesan buku cetak judul ${title}`
      : `Mau sewa ebook judul ${title}`;
  return `https://wa.me/${WA_BOOK_PHONE}?text=${encodeURIComponent(text).replace(/'/g, "%27")}`;
}
```

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npm test app/lib/whatsapp.test.ts`
Expected: PASS.

- [ ] **Step 5: Tulis tes integrasi komponen untuk halaman `/buku/[slug]`**

Uji status `published` (menampilkan sinopsis dan 2 tombol WhatsApp), status `upcoming` (menampilkan info buku dan estimasi rilis tanpa tombol pesan), slug tidak ditemukan (`notFound()`), dan galat database.

- [ ] **Step 6: Implementasikan halaman `app/app/buku/[slug]/page.tsx`**

Wajib menyertakan `export const dynamic = "force-dynamic";`, `await params`, pemisahan galat DB vs 404, dan rendering layout sesuai spesifikasi brief §9.

- [ ] **Step 7: Jalankan tes dan verifikasi kelulusan**

Run: `cd app && npm test app/app/buku/[slug]/page.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/lib/whatsapp.ts app/lib/whatsapp.test.ts app/app/buku/[slug]/page.tsx app/app/buku/[slug]/page.test.ts
git commit -m "feat: tambah halaman detail buku dan pembentuk tautan whatsapp"
```

---

### Task 2: Verifikasi Kata Sandi dan Logika Login Berbatas Percobaan (`lib/auth/login.ts`)

**Files:**
- Create: `app/lib/auth/password.ts`
- Create: `app/lib/auth/login.ts`
- Test: `app/lib/auth/login.test.ts`

**Interfaces:**
- Consumes: `@node-rs/argon2`, `query`, `execute` dari `app/lib/db/query.ts`
- Produces:
  - `verifyPassword(hash: string, plain: string): Promise<boolean>`
  - `attemptLogin(email: string, plainPassword: string): Promise<LoginResult>`
  - Type `LoginResult = { ok: true; admin: { id: string; email: string } } | { ok: false; error: string; lockedUntil?: Date }`

- [ ] **Step 1: Tulis tes unit untuk verifikasi password dan alur login**

```typescript
// app/lib/auth/login.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { attemptLogin } from "./login";
import { execute, query } from "../db/query";

describe("attemptLogin", () => {
  // Test 1: login berhasil dengan kredensial benar, mereset failed_attempts
  // Test 2: login gagal menambah failed_attempts
  // Test 3: login gagal 5 kali mengunci akun (locked_until terisi + pesan lockout)
  // Test 4: login saat akun terkunci ditolak meskipun password benar
  // Test 5: lockout yang sudah lewat waktu direset otomatis
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npm test app/lib/auth/login.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan `verifyPassword` di `app/lib/auth/password.ts` dan `attemptLogin` di `app/lib/auth/login.ts`**

Pastikan verifikasi argon2id menangani format hash yang valid dan mengembalikan boolean tanpa melempar unhandled error. Implementasikan query database untuk mengunci akun jika `failed_attempts >= 5` selama 15 menit (`DATE_ADD(NOW(), INTERVAL 15 MINUTE)`).

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npm test app/lib/auth/login.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/lib/auth/password.ts app/lib/auth/login.ts app/lib/auth/login.test.ts
git commit -m "feat: tambah verifikasi kata sandi dan pembatasan percobaan login"
```

---

### Task 3: Manajemen Sesi dan Proteksi Admin (`lib/auth/session.ts`, `lib/auth/guard.ts`)

**Files:**
- Create: `app/lib/auth/session.ts`
- Create: `app/lib/auth/guard.ts`
- Test: `app/lib/auth/session.test.ts`

**Interfaces:**
- Consumes: tabel `sessions`, helper cookie Next.js
- Produces:
  - `createSession(adminId: string): Promise<string>` (menghasilkan token acak 32-byte, menyimpan sha256 token di DB, mengembalikan token mentah)
  - `verifySessionToken(token: string): Promise<{ id: string; email: string } | null>`
  - `deleteSession(token: string): Promise<void>`
  - `getCurrentAdmin(): Promise<{ id: string; email: string } | null>`
  - `requireAdmin(): Promise<{ id: string; email: string }>` (melempar redirect atau error jika tidak terautentikasi)

- [ ] **Step 1: Tulis tes unit untuk session lifecycle**

```typescript
// app/lib/auth/session.test.ts
import { describe, it, expect } from "vitest";
import { createSession, verifySessionToken, deleteSession } from "./session";

describe("session management", () => {
  // Test: createSession membuat baris di tabel sessions dengan token_hash sha256
  // Test: verifySessionToken mengembalikan data admin jika valid dan belum kedaluwarsa
  // Test: verifySessionToken mengembalikan null dan membersihkan sesi jika sudah kedaluwarsa
  // Test: deleteSession menghapus baris sesi (logout menutup akses)
  // Test: token palsu/acak ditolak (mengembalikan null)
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npm test app/lib/auth/session.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan `session.ts` dan `guard.ts`**

Gunakan `node:crypto` untuk `randomBytes(32).toString('hex')` dan `createHash('sha256')`. Masa berlaku sesi bawaan 7 hari. Cookie diset dengan konfigurasi: `name: "cmm_session"`, `httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`, `path: "/"`.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npm test app/lib/auth/session.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/lib/auth/session.ts app/lib/auth/guard.ts app/lib/auth/session.test.ts
git commit -m "feat: tambah manajemen sesi dan guard proteksi admin"
```

---

### Task 4: Pemrosesan Berkas Sampul dan Kompensasi Penyimpanan (`lib/storage/cover.ts`)

**Files:**
- Modify: `app/package.json` (tambahkan `"sharp": "0.35.5"`)
- Create: `app/lib/storage/cover.ts`
- Test: `app/lib/storage/cover.test.ts`

**Interfaces:**
- Consumes: `sharp`, `node:fs`, `node:crypto`
- Produces:
  - `processAndSaveCover(fileBuffer: Buffer, mimeType: string): Promise<{ ok: true; coverPath: string } | { ok: false; error: string }>`
  - `deleteCoverFile(coverPath: string): Promise<boolean>`
  - `resolveCoverUrl(coverPath: string): string`

- [ ] **Step 1: Tulis tes unit untuk validasi, resize, kompresi, dan kompensasi berkas**

```typescript
// app/lib/storage/cover.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { processAndSaveCover, deleteCoverFile, resolveCoverUrl } from "./cover";

describe("cover storage", () => {
  // Test: menolak berkas non-gambar atau mime type tidak diizinkan
  // Test: menolak berkas melebihi batas 5 MiB
  // Test: memproses gambar valid menjadi WebP dengan sisi terpanjang maksimal 1600px
  // Test: resolveCoverUrl mengembalikan path publik
  // Test: deleteCoverFile menghapus berkas fisik di disk dengan aman
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npm test app/lib/storage/cover.test.ts`
Expected: FAIL.

- [ ] **Step 3: Tambahkan `sharp` ke `app/package.json` dan implementasikan `app/lib/storage/cover.ts`**

Pastikan folder target dibuat otomatis (`fs.mkdirSync(dir, { recursive: true })`), decoding gagal ditolak dengan pesan jelas, nama file menggunakan UUID acak (`${crypto.randomUUID()}.webp`), dan file disimpan di direktori storage (`public/covers`).

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npm test app/lib/storage/cover.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/package.json app/lib/storage/cover.ts app/lib/storage/cover.test.ts
git commit -m "feat: tambah pemrosesan sampul dengan sharp dan kompensasi berkas"
```

---

### Task 5: Halaman Login Admin dan Dashboard Utama (`/admin/login`, `/admin/layout`, `/admin`)

**Files:**
- Create: `app/app/admin/login/page.tsx`
- Create: `app/app/admin/layout.tsx`
- Create: `app/app/admin/page.tsx`
- Create: `app/app/admin/actions.ts`
- Test: `app/app/admin/auth-flow.test.ts`

**Interfaces:**
- Consumes: `attemptLogin`, `createSession`, `deleteSession`, `getCurrentAdmin`, `requireAdmin`
- Produces:
  - Form login di `/admin/login` dengan pesan error
  - Server actions `loginAction` dan `logoutAction`
  - Dashboard di `/admin` menampilkan ringkasan buku dan tautan kelola

- [ ] **Step 1: Tulis tes integrasi untuk Server Actions login dan logout**

```typescript
// app/app/admin/auth-flow.test.ts
import { describe, it, expect } from "vitest";
import { loginAction, logoutAction } from "./actions";

describe("admin auth flow actions", () => {
  // Test: loginAction gagal mengembalikan error validasi / kredensial salah
  // Test: loginAction sukses membuat sesi dan menyetel cookie
  // Test: logoutAction menghapus sesi dan membersihkan cookie
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npm test app/app/admin/auth-flow.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan actions dan komponen halaman login serta dashboard**

- `app/app/admin/actions.ts`: action login & logout menggunakan cookie store Next.js.
- `app/app/admin/login/page.tsx`: form email & kata sandi dengan feedback error, autofocus, dan noindex metadata.
- `app/app/admin/layout.tsx`: proteksi server-side via `getCurrentAdmin()`, navigasi admin, dan tombol logout.
- `app/app/admin/page.tsx`: statistik ringkas jumlah buku published & upcoming, tautan ke kelola buku.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npm test app/app/admin/auth-flow.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app/admin/login/page.tsx app/app/admin/layout.tsx app/app/admin/page.tsx app/app/admin/actions.ts app/app/admin/auth-flow.test.ts
git commit -m "feat: tambah antarmuka login admin dan dashboard utama"
```

---

### Task 6: Manajemen Buku Admin — Daftar dan Tambah dengan Unggah Sampul (`/admin/buku`, `/admin/buku/tambah`)

**Files:**
- Create: `app/app/admin/buku/page.tsx`
- Create: `app/app/admin/buku/tambah/page.tsx`
- Create: `app/app/admin/buku/actions.ts`
- Test: `app/app/admin/buku/tambah.test.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `createBook`, `processAndSaveCover`, `deleteCoverFile`
- Produces:
  - `createBookAction(formData: FormData): Promise<ActionResult>`
  - Daftar buku di `/admin/buku` dengan judul, penulis, status, sampul, tombol aksi
  - Form tambah buku di `/admin/buku/tambah`

- [ ] **Step 1: Tulis tes integrasi untuk createBookAction dengan kompensasi berkas**

```typescript
// app/app/admin/buku/tambah.test.ts
import { describe, it, expect } from "vitest";
import { createBookAction } from "./actions";

describe("createBookAction", () => {
  // Test 1: menolak aksi jika dipanggil tanpa sesi admin
  // Test 2: memvalidasi input wajib (judul, penulis, status, sampul)
  // Test 3: berhasil menyimpan buku baru dan berkas sampul
  // Test 4: jika database gagal (misal slug duplikat), berkas sampul baru langsung dihapus (kompensasi terbukti)
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npm test app/app/admin/buku/tambah.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan `createBookAction`, daftar buku, dan form tambah**

Implementasikan alur kompensasi eksplisit:
1. Validasi teks formulir.
2. Proses & simpan berkas sampul.
3. Simpan ke database via `createBook`.
4. Jika `createBook` gagal: panggil `deleteCoverFile(savedCoverPath)` dan kembalikan galat ke formulir tanpa menghapus input teks admin.
5. Jika sukses: `revalidatePath`, redirect ke `/admin/buku`.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npm test app/app/admin/buku/tambah.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app/admin/buku/page.tsx app/app/admin/buku/tambah/page.tsx app/app/admin/buku/actions.ts app/app/admin/buku/tambah.test.ts
git commit -m "feat: tambah daftar buku admin dan form penambahan dengan kompensasi berkas"
```

---

### Task 7: Manajemen Buku Admin — Edit dengan Ganti Sampul dan Hapus Buku (`/admin/buku/[id]/edit`)

**Files:**
- Create: `app/app/admin/buku/[id]/edit/page.tsx`
- Modify: `app/app/admin/buku/actions.ts` (`updateBookAction`, `deleteBookAction`)
- Test: `app/app/admin/buku/edit-delete.test.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `getBookById`, `updateBook`, `deleteBook`, `processAndSaveCover`, `deleteCoverFile`
- Produces:
  - `updateBookAction(id: string, formData: FormData): Promise<ActionResult>`
  - `deleteBookAction(id: string): Promise<ActionResult>`
  - Halaman `/admin/buku/[id]/edit`

- [ ] **Step 1: Tulis tes integrasi untuk pembaruan buku dan penghapusan buku**

```typescript
// app/app/admin/buku/edit-delete.test.ts
import { describe, it, expect } from "vitest";
import { updateBookAction, deleteBookAction } from "./actions";

describe("update and delete book actions", () => {
  // Test 1: update data buku tanpa mengganti sampul mempertahankan path lama
  // Test 2: update dengan sampul baru menghapus sampul lama setelah DB berhasil
  // Test 3: update gagal dengan sampul baru menghapus sampul baru dan mempertahankan sampul lama
  // Test 4: deleteBookAction menghapus record DB dan membersihkan berkas sampul terkait
  // Test 5: aksi ditolak jika tidak ada sesi admin yang sah
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npm test app/app/admin/buku/edit-delete.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan `updateBookAction`, `deleteBookAction`, dan halaman edit**

Formulir memuat data buku eksisting, pratinjau sampul saat ini, pilihan mengganti sampul, dan tombol konfirmasi hapus buku.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npm test app/app/admin/buku/edit-delete.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app/admin/buku/[id]/edit/page.tsx app/app/admin/buku/actions.ts app/app/admin/buku/edit-delete.test.ts
git commit -m "feat: tambah form edit buku dengan pergantian sampul dan aksi hapus"
```

---

### Task 8: Pengujian End-to-End Acceptance Fase 2, Revalidasi Cache, dan Laporan Progres

**Files:**
- Create: `app/tests/acceptance-fase-2.test.ts`
- Modify: `docs/PROGRESS.md`
- Modify: `app/README.md`

**Interfaces:**
- Memverifikasi seluruh kriteria penerimaan brief §13 butir 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, dan 15.

- [ ] **Step 1: Tulis acceptance test suite Fase 2 lengkap**

Uji menyeluruh skenario nyata:
1. Akses mutasi tanpa sesi ditolak (HTTP 401 / redirect).
2. Sesi palsu / kedaluwarsa ditolak.
3. Login admin berhasil, persistensi cookie sesi.
4. Tambah buku published dengan sampul -> muncul di katalog publik dan halaman detail `/buku/[slug]`.
5. Sunting buku -> perubahan langsung terlihat di `/buku/[slug]`.
6. Hapus buku -> hilang dari katalog dan detail menjadi 404, berkas dibersihkan.
7. Lockout 5 kali percobaan gagal terverifikasi.

- [ ] **Step 2: Jalankan seluruh test suite, lint, typecheck, dan build**

Run: `cd app && npm test && npm run lint && npm run typecheck && npm run build`
Expected: Semua pengujian lulus (100% green), lint bersih, typecheck bersih, build sukses.

- [ ] **Step 3: Perbarui `docs/PROGRESS.md` dan `app/README.md`**

Catat bukti verifikasi Fase 2, status Acceptance Tests, dan panduan penggunaan panel admin.

- [ ] **Step 4: Commit**

```bash
git add app/tests/acceptance-fase-2.test.ts docs/PROGRESS.md app/README.md
git commit -m "docs: perbarui progres proyek dan panduan setelah verifikasi Fase 2"
```
