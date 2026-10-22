-- Migration 001 — skema awal CV Cipta Manuskrip Media
-- Idempoten: aman dijalankan ulang.
--
-- Kolasi `utf8mb4_unicode_ci`, bukan `utf8mb4_0900_ai_ci`. Akhiran `_0900_`
-- adalah tatanan Unicode 9.0 milik MySQL 8 dan tidak dikenal MariaDB, jadi
-- memakainya membuat migration ini gagal total di hosting MariaDB.
-- Konsekuensi yang perlu diketahui: kedua kolasi sama-sama tidak membedakan
-- huruf besar/kecil, tetapi `unicode_ci` mengurutkan tanda baca dan aksen
-- berbeda dari `0900_ai_ci` (mis. "Yang Dipertuan" vs "yang dipertuan").
-- Itu tidak mengubah urutan A–Z untuk judul normal, dan katalog tidak
-- memakai fitur yang sensitif terhadap perbedaan tersebut.

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
