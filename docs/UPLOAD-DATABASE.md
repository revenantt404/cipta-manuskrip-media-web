# Upload & Menyiapkan Database di Hosting

Panduan untuk hosting panel (Hostinger/hPanel dan sejenisnya). Kerjakan
berurutan. **Jangan lompat ke langkah 6** — urutannya penting.

---

## 1. Buat database di panel

Menu **Database → Manajemen → Buat Database MySQL dan Database User yang Baru**.

Panel menambahkan awalan otomatis (mis. `u982783321_`). **Isi hanya bagian
belakangnya**, jangan mengetik ulang awalannya:

| Kolom | Yang diketik | Hasil |
|---|---|---|
| Nama database MySQL | `cipta` | `u982783321_cipta` |
| Username MySQL | `cmm` | `u982783321_cmm` |
| Password | (buat kuat) | — |

Kalau kamu mengetik `u982783321_cipta` di kolom nama, hasilnya jadi
`u982783321_u982783321_cipta` — salah.

**Catat tiga nilai ini**, semuanya dipakai di langkah 4:

```
DB_NAME   = u982783321_cipta
DB_USER   = u982783321_cmm
DB_PASSWORD = (yang kamu isi)
```

## 2. Catat host database

Umumnya **`localhost`** karena aplikasi dan MySQL berada di mesin yang sama.
Kalau panel menampilkan host lain (mis. `srv123.hostinger.com`), pakai itu.

## 3. Cek Tabel di phpMyAdmin (belum buat tabel)

Buka **Database → phpMyAdmin**, pilih database tadi. Kamu **tidak perlu**
membuat tabel apa pun secara manual. Tabel dibuat oleh langkah 6.

Membuat tabel manual justru berisiko: skema punya constraint CHECK
(status buku, ISBN, harga tidak negatif) yang mudah terlewat kalau diketik
sendiri.

## 4. Isi Environment Variable di panel

Di menu **Website → Tingkat lanjut → Environment / Node.js**, atau tempat
panel menaruh variabel aplikasi, isi:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=u982783321_cmm
DB_PASSWORD=password-yang-kamu-buat
DB_NAME=u982783321_cipta

BOOKS_PER_PAGE=12
COVER_MAX_BYTES=5242880

SITE_URL=https://ciptamanuskripmedia.com
COVER_DIR=/home/u982783321/covers
```

Dua yang paling sering salah:

- **`SITE_URL`** — harus domain asli, **tanpa** garis miring di ujung.
  Kalau dibiarkan `localhost`, sitemap.xml dan robots.txt menunjuk ke
  alamat mesin itu sendiri, dan tidak ada pesan galat apa pun.
- **`COVER_DIR`** — harus folder **di luar** folder aplikasi. Kalau
  dibiarkan bawaan (`storage/covers` di dalam aplikasi), **semua sampul
  buku hilang setiap deploy ulang**.

Buat foldernya lebih dulu lewat **File Manager**, lalu pastikan bisa
ditulis (permission `755` atau `775`):

```
/home/u982783321/covers
```

## 5. Upload kode

Ada dua cara. Pilih salah satu.

**A. Git (dianjurkan, kalau panel menyediakan Terminal / Git).**

```bash
cd ~/domains/ciptamanuskripmedia.com
git clone https://github.com/revenantt404/cipta-manuskrip-media-web.git .
cd app
npm ci
```

**B. File Manager / FTP (kalau tanpa Terminal).**

1. Unduh repo: di GitHub → **Code → Download ZIP**.
2. Ekstrak, lalu unggah **isi folder `app/`** ke folder domain, mis.
   `domains/ciptamanuskripmedia.com/`.
3. **Jangan** ikut mengunggah `node_modules` — nanti dipasang panel.

> **Penting soal lokasi `.env.local`.** Jangan mengunggah `.env.local` dari
> komputermu. Berkas itu berisi kredensial lokal. Semua nilai diisi lewat
> Environment Variable panel (langkah 4).

## 6. Jalankan migrasi — membuat tabel

Di Terminal panel:

```bash
cd ~/domains/ciptamanuskripmedia.com/app
npm run db:migrate
```

Yang benar akan muncul:

```
Database tidak dapat dibuat sendiri, memakai yang sudah ada.
Menjalankan 001_init.sql ... selesai
Menjalankan 002_isbn_harga.sql ... selesai

2 migration diterapkan ke database "u982783321_cipta".
```

Baris pertama itu **normal** dan bukan galat — artinya user hosting tidak
punya izin `CREATE DATABASE`, jadi skrip memakai database yang sudah kamu
buat di langkah 1.

Kalau muncul `Migration gagal: Unknown database`, berarti `DB_NAME` salah
atau database belum dibuat. Ulangi langkah 1.

Perintah ini **aman dijalankan berulang** — semua migration bersifat
idempoten.

## 7. Buat akun admin

Pilih salah satu. **Cara A tidak butuh Node.js di server** dan cocok kalau
hosting hanya memberi phpMyAdmin.

### Cara A — buat hash di komputer sendiri, tempel SQL di phpMyAdmin

```bash
# di folder app/ pada komputermu
npm run db:admin-sql -- --email admin@ciptamanuskripmedia.com
```

Ketik password (minimal 12 karakter, tidak tampil). Skrip mencetak satu
pernyataan `INSERT`. Tempel di phpMyAdmin → tab **SQL** → **Go**.

Skrip ini tidak menyentuh database apa pun; ia hanya menghitung hash argon2id.

### Cara B — jalankan langsung di server (butuh Node.js di sana)

```bash
npm run db:create-admin -- --email admin@ciptamanuskripmedia.com
```

Password ditanyakan lewat terminal dan tidak tampil saat diketik.
**Minimal 12 karakter.** Akun ini dibuat **sekali**; menjalankannya lagi
untuk email yang sama akan ditolak dengan *"Admin dengan email tersebut
sudah ada."*

Kalau panel tidak memberi terminal interaktif:

```bash
ADMIN_PASSWORD='password-panjang-kamu' npm run db:create-admin -- --email admin@ciptamanuskripmedia.com
```

Periksa hasilnya dari kedua cara:

```sql
SELECT email, created_at FROM admin_users;
```

## 8. Build dan jalankan

```bash
npm run build
npm start
```

Atau lewat menu **Node.js** di panel: set aplikasi root ke folder `app/`,
startup file `node_modules/next/dist/bin/next` dengan argumen `start`, bila
panel menuntut bentuk itu.

## 9. Daftar periksa setelah naik

Buka satu per satu dan pastikan:

1. `https://ciptamanuskripmedia.com/` tampil.
2. `https://ciptamanuskripmedia.com/admin` diarahkan ke `/admin/login`.
3. `https://ciptamanuskripmedia.com/sitemap.xml` memuat **domain asli**,
   bukan `localhost`.
4. Login admin berhasil.
5. Tambah satu buku uji **beserta sampulnya**.
6. Buku uji muncul di `/katalog/telah-terbit`.
7. Buka sampulnya (`/covers/<nama-berkas>.webp`) — **bukan 404**.
8. **Restart aplikasi**, lalu pastikan buku uji dan sampulnya masih ada.
   Ini membuktikan `COVER_DIR` tidak berada di folder sementara.
9. Hapus buku uji setelah selesai.

Kalau nomor 7 gagal, `COVER_DIR` salah atau foldernya tidak bisa ditulis.
Kalau nomor 8 gagal, `COVER_DIR` masih di dalam folder aplikasi.

---

## Troubleshooting

**`Access denied for user ... to database ...`** — `DB_USER` / `DB_PASSWORD`
/ `DB_NAME` tidak cocok. Periksa apakah ketiganya memakai awalan panel
(`u982783321_`). Jangan lupa user harus **ditambahkan ke database** di
panel (Hostinger punya tombol terpisah untuk itu).

**`Cannot connect to MySQL server` / `ECONNREFUSED`** — `DB_HOST` salah,
atau MySQL tidak berjalan. Di hosting berbagi hampir selalu `localhost`.

**`Migration gagal: Unknown database`** — `DB_NAME` tidak sesuai dengan
yang dibuat di langkah 1.

**Build gagal: `Turbopack ... native bindings are not available`** — ini
hanya terjadi di Windows dengan Smart App Control aktif (lihat
`docs/DEPLOY.md`). Di Linux hosting tidak terjadi.

**Sampul 404 setelah beberapa lama** — `COVER_DIR` menunjuk folder
sementara, atau folder itu terhapus saat deploy. Pindahkan ke folder
persisten di luar aplikasi.

**Situs jalan tapi sitemap menunjuk `localhost`** — `SITE_URL` belum diisi
di panel, atau aplikasi belum di-restart setelah variabel ditambahkan.
