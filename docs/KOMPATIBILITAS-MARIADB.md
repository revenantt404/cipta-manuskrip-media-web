# Kompatibilitas MariaDB

Hosting target memakai **MariaDB 11.8** (`11.8.9-MariaDB-log`), bukan MySQL 8.
Dokumen ini mencatat apa yang berubah dan apa yang **belum terverifikasi**.

## Yang diubah

| Berkas | Perubahan |
|---|---|
| `db/migrations/001_init.sql` | `utf8mb4_0900_ai_ci` → `utf8mb4_unicode_ci` |
| `lib/db/pool.ts` | kolasi koneksi → `utf8mb4_unicode_ci` |
| `scripts/migrate.mjs` | `CREATE DATABASE ... COLLATE` → `utf8mb4_unicode_ci` |

`utf8mb4_0900_ai_ci` adalah tatanan Unicode 9.0 milik MySQL 8 dan **tidak
dikenal MariaDB**. Memakainya membuat migration gagal di baris pertama
`CREATE TABLE`. `utf8mb4_unicode_ci` tersedia di keduanya.

Keduanya sama-sama `_ci` (case-insensitive), jadi pengurutan A–Z judul
katalog tetap tidak membedakan huruf besar/kecil. Yang berbeda adalah
penanganan aksen dan tanda baca pada judul yang tidak lazim; katalog tidak
memakai fitur yang sensitif terhadap itu.

## Yang tidak perlu diubah

- `DEFAULT (UUID())` — MariaDB mendukung default berupa ekspresi.
- `CHECK` constraint (14 buah) — MariaDB menegakkannya sejak 10.2.
- `ON UPDATE CURRENT_TIMESTAMP`, `ON DELETE CASCADE`, `ENGINE=InnoDB`.
- Sintaks `PREPARE`/`EXECUTE`/`DEALLOCATE` di `002_isbn_harga.sql`.
- `information_schema` di `002_isbn_harga.sql`.
- Seluruh query aplikasi (`repository.ts`) — hanya `SELECT`/`INSERT`/`UPDATE`/
  `DELETE` biasa dengan placeholder `?`.

## Yang BELUM terverifikasi

Bagian di atas disusun dari pembacaan dokumentasi MariaDB, **bukan dari
eksekusi**. Mesin pengembangan tidak punya MariaDB maupun Docker, sehingga
migration belum pernah benar-benar dijalankan di MariaDB.

Verifikasi paling murah: jalankan migration di hosting, lalu periksa di
phpMyAdmin bahwa ketiga tabel (`books`, `admin_users`, `sessions`) terbentuk
dan kolom `isbn`, `price_print`, `price_ebook` ada di `books`.

Kalau migration gagal, pesan galatnya menyebut objek yang tidak dikenal —
kabari dengan teks galat lengkapnya.

## Bedanya dengan MySQL 8 (`docs/UPLOAD-DATABASE.md`)

Di MariaDB, **import file migration lewat phpMyAdmin tidak lagi diperlukan**
kalau `npm run db:migrate` bisa dijalankan, karena masalah izin `CREATE
DATABASE` sudah ditangani skripnya. Import manual tetap sah sebagai jalan
mundur bila Terminal tidak tersedia.
