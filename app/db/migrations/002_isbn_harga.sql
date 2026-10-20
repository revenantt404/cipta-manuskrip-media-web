-- Migration 002 — ISBN dan harga buku
--
-- Dibutuhkan katalog Perpusnas: setiap judul yang sudah terbit perlu
-- menampilkan ISBN, harga cetak, dan harga sewa ebook. Buku yang belum
-- terbit tidak menampilkan harga sama sekali.
--
-- Idempoten: `scripts/migrate.mjs` menjalankan SELURUH berkas migration
-- setiap kali dipanggil, jadi berkas ini harus aman dijalankan berkali-kali.
-- MySQL 8 tidak punya `ADD COLUMN IF NOT EXISTS` (itu milik MariaDB), jadi
-- setiap perubahan dijaga lewat information_schema + PREPARE.

-- ------------------------------------------------------------------
-- Kolom
-- ------------------------------------------------------------------

SET @ada_isbn = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'isbn'
);
SET @sql = IF(@ada_isbn = 0,
  'ALTER TABLE books ADD COLUMN isbn VARCHAR(20) NULL AFTER estimated_release',
  'DO 0'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- DECIMAL, bukan VARCHAR: admin boleh mengetik "85000" tanpa titik, dan
-- layar menampilkannya sebagai Rp85.000 lewat formatter. Menyimpan teks
-- apa adanya membuat "85rb" dan "Rp 85.000" sama-sama lolos dan tidak bisa
-- diurutkan atau dijumlahkan.
SET @ada_harga_cetak = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'price_print'
);
SET @sql = IF(@ada_harga_cetak = 0,
  'ALTER TABLE books ADD COLUMN price_print DECIMAL(12,2) NULL AFTER isbn',
  'DO 0'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @ada_harga_ebook = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'price_ebook'
);
SET @sql = IF(@ada_harga_ebook = 0,
  'ALTER TABLE books ADD COLUMN price_ebook DECIMAL(12,2) NULL AFTER price_print',
  'DO 0'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ------------------------------------------------------------------
-- Constraint
-- ------------------------------------------------------------------

-- Harga tidak boleh negatif. NULL tetap sah: "belum ditetapkan" berbeda
-- dari "gratis", dan menampilkannya sebagai `-` adalah keputusan pemilik.
SET @ada_cek_harga = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'books'
    AND CONSTRAINT_NAME = 'chk_books_prices_not_negative'
);
SET @sql = IF(@ada_cek_harga = 0,
  'ALTER TABLE books ADD CONSTRAINT chk_books_prices_not_negative
     CHECK ((price_print IS NULL OR price_print >= 0)
        AND (price_ebook IS NULL OR price_ebook >= 0))',
  'DO 0'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Buku yang belum terbit tidak dijual, jadi harganya tidak boleh terisi.
-- Tanpa constraint ini, harga yang diisi saat buku masih "segera terbit"
-- akan diam-diam muncul begitu admin menandainya terbit — angka yang tidak
-- pernah diputuskan untuk katalog.
--
-- Catatan: constraint ini TIDAK mengosongkan data lama. Bila suatu saat
-- admin mengubah buku terbit menjadi segera terbit lagi, validator akan
-- menolak sampai harga dikosongkan sendiri — sama seperti perlakuan
-- `estimated_release` yang sudah ada sejak migration 001.
SET @ada_cek_upcoming = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'books'
    AND CONSTRAINT_NAME = 'chk_books_upcoming_no_price'
);
SET @sql = IF(@ada_cek_upcoming = 0,
  'ALTER TABLE books ADD CONSTRAINT chk_books_upcoming_no_price
     CHECK (status <> ''upcoming''
        OR (price_print IS NULL AND price_ebook IS NULL))',
  'DO 0'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
