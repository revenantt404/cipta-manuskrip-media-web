# Panduan Setup Database

Dokumen ini menggantikan `docs/SUPABASE-SETUP.md` yang diminta brief bagian 15.
Supabase tidak dipakai di proyek ini, sehingga dokumen tersebut tidak relevan.

Basis data: **MySQL 8.4**, diakses langsung lewat `mysql2` tanpa ORM.

## Menyiapkan MySQL lokal

Proyek ini dikembangkan dengan Laragon di Windows. Bila memakai Laragon:

1. Buka Laragon, klik **Start All**. MySQL 8.4 akan berjalan di port 3306.
2. Jalur biner MySQL di pemasangan ini:
   `C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe`
3. Akun bawaan Laragon adalah `root` tanpa password.

Memastikan MySQL hidup:

```bash
"C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysql.exe" -u root -e "SELECT 1;"
```

Bila memakai pemasangan MySQL lain, cukup sesuaikan `DB_HOST`, `DB_PORT`,
`DB_USER`, dan `DB_PASSWORD` di `.env.local`. Perintah di atas hanya contoh
jalur; `mysql.exe` di pemasangan lain berada di tempat yang berbeda.

Database `cipta_manuskrip_media` **tidak perlu dibuat manual** — skrip migrasi
membuatnya sendiri bila belum ada.

## Menjalankan migrasi

```bash
cd app
npm run db:migrate
```

Yang dilakukan perintah ini:

1. Membaca konfigurasi dari `.env.local`.
2. Menjalankan `CREATE DATABASE IF NOT EXISTS` dengan collation
   `utf8mb4_0900_ai_ci`.
3. Menjalankan setiap berkas `.sql` di `db/migrations/`, diurutkan berdasarkan
   nama, seluruhnya dalam satu pemanggilan.
4. Berhenti pada galat pertama dan memberi kode keluar bukan nol.

Perintah ini **aman dijalankan berulang**. Berkas migration memakai
`CREATE TABLE IF NOT EXISTS`.

## Membuat akun admin

```bash
cd app
npm run db:create-admin -- --email nama@domain.com
```

Password ditanyakan lewat terminal dan tidak ditampilkan saat diketik. Untuk
pemakaian non-interaktif (misalnya skrip penyebaran), isi lebih dulu:

```bash
ADMIN_PASSWORD='...' npm run db:create-admin -- --email nama@domain.com
```

Ketentuan yang ditegakkan perintah ini:

- Email wajib memuat `@`.
- Password minimal 12 karakter.
- Email yang sudah terdaftar ditolak, dan hash lamanya tidak ditimpa.
- Password disimpan sebagai hash **argon2id** (m=19456, t=2, p=1) sepanjang
  97 karakter. Password aslinya tidak pernah tersimpan.

## Aturan perubahan skema

**Setiap perubahan skema wajib lewat berkas migration baru.** Tidak ada
pengecualian, termasuk untuk perubahan yang terlihat sepele.

- Berkas baru diberi nomor urut: `db/migrations/002_<keterangan>.sql`.
- Berkas migration yang sudah pernah dijalankan **tidak boleh diubah lagi** —
  mengubahnya membuat database yang sudah ada dan database baru menyimpang
  tanpa jejak.
- Satu berkas boleh memuat beberapa pernyataan `ALTER TABLE` sekaligus.
- Hindari `DELIMITER` dan trigger berisi `BEGIN ... END`: driver MySQL tidak
  bisa menjalankannya. Untuk kolom waktu, pakai
  `ON UPDATE CURRENT_TIMESTAMP`.

Saat ini hanya ada satu migration, `001_init.sql`, yang membuat tabel `books`,
`admin_users`, dan `sessions`.

## Letak kredensial

Kredensial asli hidup **hanya** di `app/.env.local`, yang tidak di-commit.
`app/.env.example` berisi nama variabel dengan nilai contoh, dan itulah satu-
satunya berkas konfigurasi yang masuk ke repositori.

Untuk memeriksa tidak ada kredensial yang bocor:

```bash
cd C:/Users/ocako/Downloads/CiptaManuskripMedia
git status --porcelain
git grep -n -i -E "password|secret|service_role|api[_-]?key" -- app/ ':!app/package-lock.json'
```

Yang boleh muncul hanyalah nama variabel di `.env.example`, kode validasi, dan
nama kolom `password_hash` — bukan nilai sungguhan.

## Catatan keamanan

- Jangan pernah menaruh password, kunci rahasia, atau string koneksi di dalam
  berkas yang di-commit, termasuk di dalam komentar.
- Jangan mengirim kredensial lewat obrolan, surel, atau pesan singkat. Kredensial
  diserahkan dengan mengisinya langsung di `.env.local` pada komputer tujuan.
- Akun `root` tanpa password hanya layak untuk pengembangan lokal. Di server
  sungguhan, buat pengguna MySQL khusus dengan hak terbatas pada database
  aplikasi saja.
