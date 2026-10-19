# Migrasi database

Folder ini memuat seluruh perubahan skema database, dalam file `.sql` bernomor.

## Menjalankan

```bash
cd app
npm run db:migrate
```

Skrip `scripts/migrate.mjs` membaca `.env.local`, membuat database kalau belum ada, lalu menjalankan setiap file `.sql` di folder ini **urut naik berdasarkan nama**.

## Aturan penamaan

`NNN_nama.sql` — tiga digit, diikuti garis bawah, lalu nama singkat.

- `001_init.sql` — skema awal
- `002_tambah_kolom_x.sql`

Nomor berikutnya adalah nomor terbesar yang ada, ditambah satu. Nomor yang sudah dipakai tidak pernah didaur ulang.

## Aturan wajib

**1. Setiap migration harus idempoten.** Aman dijalankan berulang kali.

Pakai `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, dan bentuk lain yang setara. Skrip menjalankan **semua** file setiap kali dipanggil, bukan hanya yang belum pernah dijalankan — jadi satu file yang tidak idempoten akan gagal pada pemanggilan kedua.

**2. Setiap perubahan skema wajib lewat file migration.**

Perubahan yang dilakukan langsung di phpMyAdmin — tanpa file migration yang menyertainya — tidak tercatat di repo. Database lokal pelaksana akan berbeda dari database hosting, dan tidak ada cara mengetahui perubahan apa yang pernah terjadi. Kalau terpaksa memperbaiki sesuatu lewat phpMyAdmin, segera tulis file migration yang menghasilkan keadaan itu, supaya database lain bisa dibangun ulang.

**3. Skrip berhenti pada galat pertama.**

File dijalankan berurutan dan eksekusi dihentikan begitu ada yang gagal. Migration yang gagal harus diperbaiki, bukan dilewati.

**4. Tidak ada trigger dengan `BEGIN ... END`.**

Klien MySQL tidak menangani `DELIMITER`, sehingga trigger berbadan majemuk tidak bisa dijalankan lewat skrip ini. Untuk `updated_at`, kolom sudah memakai `ON UPDATE CURRENT_TIMESTAMP` — perilaku itu ditangani database tanpa trigger. Kalau nanti benar-benar perlu trigger, jalankan manual lewat klien MySQL dan catat di sini.

## Isi skema saat ini

`001_init.sql` membuat tiga tabel:

| Tabel | Isi |
|---|---|
| `books` | Buku yang telah terbit dan yang segera terbit |
| `admin_users` | Akun admin. Satu baris. Dibuat lewat `npm run db:admin` |
| `sessions` | Sesi login admin. `ON DELETE CASCADE` dari `admin_users` |

Catatan `books`:

- `id` memakai `CHAR(36) DEFAULT (UUID())`. `UUID()` MySQL menghasilkan **versi 1** (berbasis waktu), bukan versi 4 — tetap unik, tetapi jangan diasumsikan v4.
- Kolom `status` hanya boleh `'published'` atau `'upcoming'`, ditegakkan `chk_books_status`.
- Buku `published` wajib punya `synopsis` dan tidak boleh punya `estimated_release`.
- Buku `upcoming` wajib punya `estimated_release`.
- Kolasi `utf8mb4_0900_ai_ci` membuat pengurutan judul A–Z tidak membedakan huruf besar/kecil, sesuai kebutuhan katalog.

## Urutan membangun database dari nol

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run db:migrate
npm run db:admin             # membuat akun admin pertama
```

Rinciannya ada di `docs/SETUP.md` pada akar repo.
