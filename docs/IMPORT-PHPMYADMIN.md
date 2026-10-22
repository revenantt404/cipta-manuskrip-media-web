# Import Database lewat phpMyAdmin

Untuk hosting yang **tidak menyediakan Terminal/SSH** — hanya phpMyAdmin.
Tidak perlu Node.js, tidak perlu `npm run db:migrate`.

---

## Berkas yang di-import

Satu berkas di akar repo:

```
db-import-hosting.sql
```

Isinya gabungan `001_init.sql` + `002_isbn_harga.sql` dari
`app/db/migrations/`, jadi cukup **satu kali import** untuk membuat seluruh
skema.

Berkas ini **aman dijalankan berulang**. Kalau import pertama gagal di
tengah jalan, perbaiki penyebabnya lalu import ulang — tidak akan
menggandakan tabel atau kolom, dan tidak menghapus data yang sudah ada.

---

## Langkah import

### 1. Pastikan database kosong

phpMyAdmin → sidebar kiri → klik `u982783321_cipta`.
Harus muncul **"Tidak ada tabel yang ditemukan di database"**.

Kalau sudah ada tabel dari percobaan sebelumnya, **hapus dulu semua
tabelnya** (centang semua → Drop). Jangan import di atas tabel setengah
jadi.

### 2. Buka tab Import

Di bagian atas ada tab: Struktur · SQL · Cari · Kueri · Ekspor · **Import**.
Klik **Import**.

### 3. Pilih berkas

- **Choose File** → pilih `db-import-hosting.sql`
- Format: biarkan **SQL**
- Karakter set berkas: biarkan **utf-8**
- Jangan ubah opsi lain
- Klik **Import** (tombol di bawah)

### 4. Periksa hasilnya

Harus muncul pesan hijau:

> **Import telah berhasil diselesaikan, 18 kueri dieksekusi.**

Jumlahnya bisa sedikit berbeda tergantung versi phpMyAdmin; yang penting
**tidak ada teks merah**.

Lalu klik nama database di sidebar kiri — harus ada **3 tabel**:

| Tabel | Isi |
|---|---|
| `books` | Katalog buku |
| `admin_users` | Akun admin |
| `sessions` | Sesi login |

---

## Verifikasi (opsional tapi dianjurkan)

Klik tab **SQL**, tempel ini, lalu **Go**:

```sql
SHOW COLUMNS FROM books;
```

Harus terlihat kolom `isbn`, `price_print`, dan `price_ebook` di antara
`estimated_release` dan `created_at`. Kalau ketiganya ada, migration 002
sudah jalan.

---

## Kalau gagal

Kirimkan **teks galat lengkap** dari phpMyAdmin. Galat paling sering:

**`#1273 - Unknown collation: 'utf8mb4_0900_ai_ci'`**
Berkas yang kamu import masih versi lama. Unduh ulang `db-import-hosting.sql`
dari repo (versi terbaru memakai `utf8mb4_unicode_ci`).

**`#1064 - You have an error in your SQL syntax`**
Biasanya karena berkas terpotong saat diunduh, atau dibuka dan disimpan
ulang oleh editor teks. Unduh ulang, jangan disunting.

**`#1007 - Can't create database; database exists`**
Kamu meng-import berkas lain yang memuat `CREATE DATABASE`. Berkas
`db-import-hosting.sql` **tidak** memuatnya — ia mengasumsikan database
sudah dipilih.

**`#1142 - CREATE command denied`**
Sama seperti di atas: ada `CREATE DATABASE` di berkas yang diimport. Pakai
`db-import-hosting.sql`.

---

## Setelah tabel jadi

Yang masih perlu dikerjakan, dan **tidak bisa lewat phpMyAdmin**:

1. **Akun admin** — password harus di-hash argon2id, tidak bisa diketik
   manual. Butuh Node.js:
   `npm run db:create-admin -- --email admin@ciptamanuskripmedia.com`
   Kalau hosting tidak bisa menjalankan Node.js sama sekali, situsnya juga
   tidak bisa jalan — jadi ini bukan hambatan tambahan.

2. **Environment variable** — `DB_HOST`, `DB_NAME`, `DB_USER`,
   `DB_PASSWORD`, `SITE_URL`, `COVER_DIR` diisi dari panel hosting.

3. **Upload kode aplikasi** dan jalankan `npm ci && npm run build && npm start`.

Panduan lengkapnya di `docs/UPLOAD-DATABASE.md`.
