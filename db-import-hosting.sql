-- ============================================================
-- Skema database CV Cipta Manuskrip Media
-- GABUNGAN untuk import manual lewat phpMyAdmin.
--
-- Isinya persis 001_init.sql + 002_isbn_harga.sql, dijalankan berurutan.
-- Berkas ini TIDAK dibaca oleh `npm run db:migrate` (yang membaca folder
-- db/migrations/), jadi aman keberadaannya di sini.
--
-- Cara pakai:
--   1. phpMyAdmin -> pilih database (mis. u982783321_cipta)
--   2. tab "Import" -> Choose File -> berkas ini -> Import
--   3. Harus muncul: "Import telah berhasil diselesaikan"
--      dan 3 tabel: books, admin_users, sessions
--
-- Aman dijalankan berulang: semua pernyataan memakai IF NOT EXISTS atau
-- dijaga information_schema. Menjalankan dua kali tidak merusak data.
--
-- Kolasi utf8mb4_unicode_ci dipilih karena tersedia di MySQL 8 DAN
-- MariaDB. utf8mb4_0900_ai_ci hanya ada di MySQL 8.
-- ============================================================


-- ------------------------------------------------------------
-- BAGIAN 1 — Skema awal (001_init.sql)
-- ------------------------------------------------------------

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
  COLLATE = utf8mb4_unicode_ci;

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
  COLLATE = utf8mb4_unicode_ci;

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
  COLLATE = utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- BAGIAN 2 — ISBN dan harga buku (002_isbn_harga.sql)
--
-- MariaDB 11 punya ADD COLUMN IF NOT EXISTS, tetapi penjagaan lewat
-- information_schema dipertahankan supaya berkas ini tetap sama dengan
-- versi MySQL dan aman di kedua jenis server.
-- ------------------------------------------------------------

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
-- layar menampilkannya sebagai Rp85.000 lewat formatter.
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

-- Harga tidak boleh negatif. NULL tetap sah: "belum ditetapkan" berbeda
-- dari "gratis".
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


-- ============================================================
-- SELESAI. Periksa hasilnya:
--   SHOW TABLES;                     -- harus ada 3 tabel
--   SHOW COLUMNS FROM books;         -- isbn, price_print, price_ebook ada
-- ============================================================
