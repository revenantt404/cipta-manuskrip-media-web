# Amandemen Spesifikasi 01 — Perpindahan Supabase ke MySQL

**Tanggal:** 19 Oktober 2026
**Berlaku atas:** `PROJECT-BACKEND-FIRST.md`
**Alasan:** Pemilik proyek memutuskan tidak memakai Supabase. Alasan utama: risiko operasional paket gratis (project di-pause otomatis) dan preferensi pada SQL langsung di infrastruktur yang sudah dibayar client.

Dokumen ini mencatat perubahan terhadap brief. Bagian yang tidak disebut di bawah **tetap berlaku apa adanya**.

---

## Bagian 2 — Stack wajib

| Semula | Menjadi |
|---|---|
| Supabase PostgreSQL | MySQL / MariaDB pada hosting client |
| Supabase Auth | Sesi sendiri, admin disimpan di database (lihat `DESIGN-STACK.md` §4) |
| Supabase Storage | Folder penyimpanan di hosting, path disimpan di database |
| `@supabase/supabase-js`, `@supabase/ssr` | Tidak dipakai |
| Pola SSR/cookie resmi Supabase | Diganti pemeriksaan sesi sendiri di Server Actions dan route admin |

Yang tidak berubah: Next.js App Router, TypeScript strict, Tailwind, Server Components sebagai default, Server Actions untuk mutasi, satu package manager dengan lockfile.

---

## Bagian 5 — Database

| Semula | Menjadi |
|---|---|
| PostgreSQL | MySQL |
| RLS (row level security) | Tidak ada. Otorisasi sepenuhnya di kode aplikasi |
| Tabel allowlist `public.admin_users` | Tetap ada, sebagai tabel admin dengan kolom password |
| Helper SQL security definer | Tidak diperlukan |
| View/RPC untuk sorting | Tidak diperlukan — `ORDER BY` langsung di query |
| `supabase/migrations/` | `db/migrations/` berisi file `.sql` bernomor |

Yang tetap berlaku: migration versioned di repositori (bukan perubahan lewat dashboard tanpa catatan), UNIQUE pada slug, trigger `updated_at`, index untuk status dan urutan `lower(title), id`, pagination deterministik, validasi di server bukan hanya di browser.

**Catatan penting:** butir "Uji akses langsung anon dan user non-admin, bukan hanya menyembunyikan tombol" tetap berlaku, tetapi bentuk pengujiannya berubah — lihat bagian 13 di bawah.

---

## Bagian 6 — Storage sampul

| Semula | Menjadi |
|---|---|
| Bucket `book-covers` di Supabase Storage | Folder di hosting |
| Policy storage | Pemeriksaan admin di route upload |
| Supabase image transformation | `sharp` saat upload |

Yang tetap berlaku seluruhnya: hanya JPEG/PNG/WebP, maksimum 5 MiB, validasi isi file di server (decode dan re-encode, bukan mempercayai ekstensi atau MIME dari browser), batas dimensi untuk mencegah input berbahaya, sisi terpanjang maksimum 1600px tanpa upscale, nama file acak, path di database dan URL dibentuk resolver terpisah, preview lokal boleh tetapi file final harus tersimpan nyata.

**Aturan kompensasi file dan database tetap berlaku seluruhnya** — dan justru lebih penting di sini karena tidak ada transaksi atomik antara filesystem dan database:
- Tambah: simpan file → insert buku → jika insert gagal, hapus file baru.
- Ganti sampul: simpan file baru → update database → baru hapus file lama. Jika update gagal, hapus file baru dan pertahankan yang lama.
- Hapus buku: hapus record secara terotorisasi, lalu bersihkan file terkait. Kegagalan pembersihan dilaporkan sebagai tertunda, bukan diklaim berhasil.

Poin tambahan yang wajib dijaga: file sampul tidak boleh ikut terhapus saat aplikasi di-deploy ulang. Lihat `DESIGN-STACK.md` §5 dan §6.

---

## Bagian 7 — Auth dan keamanan aplikasi

| Semula | Menjadi |
|---|---|
| Supabase Auth (email/password) | Sesi sendiri, hash argon2id, tabel `sessions` |
| Verifikasi session dengan pola Supabase SSR | Verifikasi cookie sesi terhadap tabel `sessions` di server |
| RLS sebagai lapisan tambahan | Tidak ada lapisan kedua — semua izin diperiksa di kode |
| Service-role key | Tidak ada kunci semacam ini dalam desain baru |

Yang tetap berlaku seluruhnya: rute admin seperti terdaftar, seluruh route admin selain login dilindungi di server, pemeriksaan admin pada setiap mutasi, penanganan session expired dan kredensial salah dan kegagalan jaringan, tidak ada registrasi publik, tidak ada password hardcoded, tidak mencatat password atau token ke log, validasi seluruh input di server, URL redirect internal yang tervalidasi, mutasi hanya lewat metode yang sesuai, dashboard noindex tetapi bukan dijadikan mekanisme keamanan.

**Syarat lingkungan yang berubah:** karena tidak ada Supabase, tidak ada kunci rahasia apa pun yang dikirim ke browser. Yang ada di `.env` hanya kredensial database. Cookie sesi **tidak ditandatangani** — yang disimpan di database adalah hash dari token acak, sehingga sesi dapat dicabut seketika dengan menghapus barisnya. Tidak ada kunci penandatangan yang perlu dibuat atau dirotasi.

---

## Bagian 11 — Struktur siap perombakan UI

| Semula | Menjadi |
|---|---|
| `lib/supabase/` | `lib/db/` — koneksi dan helper query |
| — | `lib/auth/` — pemeriksaan sesi dan admin |
| `lib/storage/` | Tetap, tetapi objeknya filesystem bukan bucket |
| `supabase/migrations/` | `db/migrations/` |

Yang tetap berlaku: pemisahan `app/`, `components/`, `content/site.ts`, `lib/validation/`, `lib/whatsapp.ts`, `types/`, `tests/`. Kontrak terketik `listBooks`, `getBookBySlug`, `getBookById`, `createBook`, `updateBook`, `deleteBook` tetap sama, termasuk bentuk pagination `items, total, page, pageSize`.

---

## Bagian 12 — Environment, setup, dan GitHub

| Semula | Menjadi |
|---|---|
| Proyek Supabase + migration Supabase CLI | Database MySQL di hosting + migration SQL manual |
| Kredensial Supabase | Kredensial database dan kunci cookie |
| Konfigurasi Supabase Auth URL | Tidak berlaku |

Yang tetap berlaku: `.env.example` berisi nama variabel tanpa nilai rahasia, `.gitignore` menutup env sungguhan dan secret, tidak ada kredensial di repositori, tidak push tanpa instruksi pengguna dan repository yang jelas.

**Catatan:** sebuah organisasi Supabase sudah dibuat untuk proyek ini. Karena tidak dipakai, statusnya dicatat di `docs/PROGRESS.md` sebagai sisa yang perlu diputuskan saat serah terima — jangan dihapus tanpa sepengetahuan client, karena organisasi itu milik mereka.

---

## Bagian 13 — Acceptance test

Butir 2 dan 3 berubah bentuk:

| Semula | Menjadi |
|---|---|
| Anon tidak dapat melakukan mutasi langsung melalui database | Setiap endpoint mutasi ditolak ketika dipanggil lewat HTTP tanpa sesi admin yang sah |
| User authenticated non-admin juga ditolak | Tidak ada konsep user non-admin. Pengujian diganti: cookie sesi palsu, sesi kedaluwarsa, dan token yang salah semuanya ditolak |

Butir 1 dan 4 sampai 15 tetap berlaku, dengan penyesuaian istilah: "Supabase" menjadi "database", "bucket" menjadi "folder sampul".

Butir 15 tetap: lint, type-check, build, dan test harus lulus.

---

## Bagian 14 — Fase pelaksanaan

| Fase | Perubahan |
|---|---|
| Fase 1 | Bootstrap MySQL, bukan Supabase. Panduan setup berisi cara membuat database dan akun admin lewat SQL, bukan konfigurasi proyek Supabase. Verifikasi koneksi dilakukan begitu hosting dan database tersedia. |
| Fase 2 | Auth sesi sendiri, bukan Supabase Auth. CRUD, validasi, dan kompensasi file tetap sama. |
| Fase 3 | Tidak berubah. |
| Fase 4 | Ditambah: memastikan folder sampul bertahan setelah deploy, dan uji jalur ganti password admin lewat SQL. |

---

## Yang tidak berubah sama sekali

- Seluruh alur publik dan teks yang sudah ditetapkan (headline, label tombol, urutan section).
- Nomor dan isi pesan WhatsApp.
- Batas fitur: tidak ada akun member, pembayaran, baca buku, upload PDF, pencarian, filter, notifikasi.
- Larangan data fiktif dan placeholder jujur.
- Pemisahan logika bisnis, akses data, validasi, dan presentasi untuk persiapan perombakan UI di Arena.
- Semangat backend-first: fungsi nyata lebih dahulu, desain premium belakangan.
