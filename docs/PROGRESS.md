# Progres Proyek

Laporan apa adanya. Brief bagian 13 melarang menyebut sebuah fase selesai bila
alur utamanya belum benar-benar terverifikasi — karena itu setiap klaim di
bawah ini disertai cara pembuktiannya.

Terakhir diperbarui: 19 Oktober 2026.

## Ringkasan fase

| Fase | Isi | Status |
|---|---|---|
| 1 | Fondasi, database, dan halaman publik yang membaca data nyata | **Selesai koding — menunggu peninjauan** |
| 2 | Panel admin, login, unggah sampul, halaman detail buku | **Selesai koding — menunggu peninjauan** |
| 3 | Semua alur publik, desain visual (Arena), metadata | Belum dimulai |

Fase 1 dan Fase 2 **belum boleh disebut selesai sepenuhnya**: keduanya baru
terverifikasi di komputer pengembangan, belum di server hosting. Lihat bagian
Blocker.

## Yang sudah dikerjakan di Fase 1

Delapan commit di branch `feat/fase-1-fondasi-mysql`, dipisah per satuan kerja:

| Commit | Isi |
|---|---|
| `7f8fb41` | Bootstrap Next.js 16 + TypeScript strict + Tailwind |
| `cfb2340` | Konfigurasi environment dan validasi kredensial database |
| `7d6e6cc` | Migration SQL dan skrip pembuatan skema |
| `ac56cfc` | Koneksi database MySQL dan pengujiannya |
| `5fb7a88` | Perintah pembuatan akun admin dengan hash argon2id |
| `227149a` | Validasi input buku dan pembentuk slug |
| `d37cd64` | Repository buku dengan pagination dan pengujiannya |
| `4929746` | Halaman katalog: empty state dan galat database terpisah |

Rancangan teknis lengkapnya ada di `docs/DESIGN-STACK.md`; perubahan lingkup
terhadap brief awal ada di `docs/SPEC-AMENDMENT-01.md`.

## Yang sudah dikerjakan di Fase 2

Lima commit di branch `feat/fase-2-panel-admin`:

| Commit | Isi |
|---|---|
| `0a5f683` | Verifikasi kata sandi argon2id dan pembatasan percobaan login |
| `8ceef81` | Manajemen sesi dan penjaga route admin |
| `8e69e9b` | Pemrosesan dan penyimpanan berkas sampul |
| `36ce7af` | Halaman login admin dan dashboard terproteksi |
| `801625e` | Daftar buku admin dan form penambahan dengan kompensasi berkas |
| `4c5a901` | Form edit buku dengan pergantian sampul dan aksi hapus |

Semuanya digabung ke `main` setelah peninjauan branch. Tujuh temuan yang
mengubah rencana awal dicatat di
`.superpowers/sdd/2026-10-19-fase-2-panel-admin/progress.md`; dua di antaranya
adalah perbaikan bug yang ditemukan lewat verifikasi HTTP, bukan lewat tes
otomatis — lihat "Dua bug yang ditemukan dan diperbaiki" di bawah.

## Yang benar-benar terverifikasi

### Tes otomatis

```bash
cd app && npx vitest run
```

Hasil Fase 2: **24 berkas tes, 200 tes, semuanya lulus.** Mencakup seluruh
cakupan Fase 1 ditambah verifikasi kata sandi dan penguncian akun, sesi dan
penjagaan route, pemrosesan berkas sampul (termasuk penolakan SVG dan gambar
raksasa), penyajian berkas sampul beserta penolakan path traversal, kompensasi
kegagalan database, serta acceptance test alur nyata Fase 2.

```bash
cd app && npm run lint && npm run typecheck
```

Hasil: keduanya bersih, tanpa peringatan.

### Build produksi

```bash
cd app && npm run build
```

Hasil: `✓ Compiled successfully`. Daftar route:

```
┌ ○ /
├ ○ /_not-found
└ ƒ /katalog/[status]
```

`/katalog/[status]` ditandai `ƒ (Dynamic)` — artinya ia dirender saat
diminta, bukan dibekukan saat build. Ini syarat agar buku baru langsung
tampil.

### Tiga keadaan halaman katalog

Dijalankan terhadap `npm run start` (build produksi), dengan `curl`:

| Keadaan | Yang tampil |
|---|---|
| Database kosong | `Belum ada buku yang diterbitkan.` |
| MySQL dimatikan | `Katalog sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.` |
| MySQL dinyalakan lagi | kembali ke `Belum ada buku yang diterbitkan.` |

Ketiganya berbeda, sesuai syarat brief bagian 9. MySQL dimatikan lewat
`mysqladmin shutdown` lalu dihidupkan kembali; pesannya berubah tanpa perlu
memulai ulang server Next.js.

### Data nyata dari database

Satu baris dimasukkan **lewat klien MySQL**, bukan lewat kode aplikasi, agar
yang terbukti benar-benar pembacaan database:

```sql
INSERT INTO books (title, slug, author, cover_path, status, synopsis)
VALUES ('Panduan Menulis ''Karya Ilmiah''', 'panduan-menulis-karya-ilmiah',
        'Dr. Siti', 'covers/uji.webp', 'published', 'Buku tentang kepenulisan.');
```

Muat ulang halaman **tanpa memulai ulang server**: judul muncul lengkap dengan
apostrofnya, penulisnya tampil, dan tautan ke `/buku/panduan-menulis-karya-ilmiah`
terbentuk. Judul yang memuat apostrof sengaja dipilih untuk memastikan tidak
ada masalah pelarian teks.

### Paginasi

Dengan 14 baris uji, halaman 1 menampilkan 12 buku dan menautkan ke halaman 2;
`?page=2` menampilkan sisa 2 buku dengan penanda halaman aktif berpindah.
Nilai di luar rentang dijepit ke halaman terakhir (`?page=9`), sedangkan
`?page=0` dan `?page=abc` jatuh ke halaman 1.

### Keadaan lain

| Uji | Hasil |
|---|---|
| `/katalog/sedang-ditulis` (segmen tak dikenal) | HTTP 404 |
| `/katalog/segera-terbit` dengan database kosong | `Belum ada buku yang segera terbit.` |
| Beranda `/` | Judul dan kedua tautan katalog tampil |
| `npm run db:migrate` dijalankan dua kali | Aman, tidak menggandakan tabel |

### Kekangan database

Diuji langsung lewat klien MySQL: enam pelanggaran (status ilegal, judul
kosong, `published` tanpa sinopsis, `upcoming` tanpa estimasi, `published` yang
justru punya estimasi, slug duplikat) semuanya **ditolak** database dengan
`ERROR 3819` / `ERROR 1062`. `ON UPDATE CURRENT_TIMESTAMP` juga dipastikan
bekerja: `created_at` tetap, `updated_at` maju.

## Verifikasi HTTP Fase 2

Dijalankan terhadap `next start` (build produksi) pada port 3106 dan 3107,
dengan `curl`. Peralihan halaman dan cookie tidak bisa diuji dari Vitest —
`cookies()` dan `redirect()` hanya hidup di dalam permintaan HTTP — jadi
bagian itulah yang dibuktikan di sini.

### Penjagaan akses

| Permintaan | Hasil |
|---|---|
| `GET /admin` tanpa sesi | `307` ke `/admin/login` |
| `GET /admin/buku` tanpa sesi | `307` ke `/admin/login` |
| `GET /admin/buku/tambah` tanpa sesi | `307` ke `/admin/login` |
| `GET /admin/buku/<id>/edit` tanpa sesi | `307` ke `/admin/login` |
| `GET /admin` dengan sesi sah | `200` |
| `GET /admin/buku` dengan sesi sah | `200` |
| `GET /admin/buku/<id>/edit` untuk id yang tidak ada | `404` |

Login lewat Server Action menjawab `303` ke `/admin` dengan `Set-Cookie
cmm_session` — `HttpOnly`, `Secure`, `SameSite=lax`, masa berlaku 7 hari.
Cookie lama **tidak** berlaku lagi setelah logout, karena sesi benar-benar
dihapus dari tabel `sessions`, bukan sekadar dibuang dari peramban.

Penguncian akun juga diuji lewat jalur nyata: 5 percobaan salah berturut-turut
mengisi `failed_attempts` dan menyetel `locked_until` 15 menit ke depan, lalu
percobaan ke-6 **dengan kata sandi yang benar** tetap ditolak.

### Alur unggah sampul, ujung ke ujung

Ini alur yang paling penting, karena inilah yang gagal tanpa terlihat:

1. Admin login, membuka `/admin/buku/tambah`, mengirim form beserta berkas
   JPEG sungguhan (600×900, dibuat `sharp`).
2. Server Action menjawab `303` ke `/admin/buku`.
3. `cover_path` di database berisi `covers/7ff19bc7-…-32641496508e.webp`.
4. `GET /covers/7ff19bc7-…-32641496508e.webp` — **tanpa memulai ulang server**
   — menjawab `200`, `content-type: image/webp`,
   `cache-control: public, max-age=31536000, immutable`, 1068 byte.
5. Berkas yang terunduh didekode `sharp` sebagai WebP 600×900: gambar yang
   sama persis dengan yang diunggah.
6. Katalog `/katalog/telah-terbit` menjawab `200` dan memuat
   `<img src="/covers/…webp" alt="Sampul buku …">`.
7. Daftar admin dan halaman detail `/buku/<slug>` menjawab `200` dan merujuk
   berkas yang sama.

Langkah 4 adalah tepat pemeriksaan yang dulu menjawab `404 text/html`.

### Penolakan path traversal

Nama berkas yang diminta `/covers/<nama>` harus persis berbentuk UUID +
`.webp`. Semuanya menjawab `404`:

| Nama yang diminta | Hasil |
|---|---|
| `../package.json` | `404` |
| `..%2Fpackage.json` | `404` |
| `%2e%2e%2fpackage.json` | `404` |
| `catatan.txt` | `404` |

`package.json` di root aplikasi dipastikan memang ada, sehingga `404` di atas
berarti **ditolak**, bukan kebetulan tidak ditemukan.

### Dua bug yang ditemukan dan diperbaiki

Keduanya lolos dari tes otomatis dan hanya muncul saat alur nyata dijalankan
lewat HTTP pada build produksi.

1. **Sampul yang baru diunggah tidak pernah tampil.** `next start` membekukan
   daftar berkas `public/` saat server menyala. Berkas yang ditulis setelahnya
   — yaitu setiap sampul yang diunggah admin — tidak pernah disajikan, sampai
   server di-restart. Diperbaiki dengan menyajikan sampul lewat route
   `/covers/[berkas]` yang membaca disk per permintaan, dan memindahkan folder
   bawaan keluar dari `public/` ke `storage/covers`. Ini sekaligus membuat
   `COVER_DIR` boleh menunjuk folder di luar aplikasi, syarat agar sampul
   selamat saat deploy ulang.

2. **Kartu katalog menampilkan kotak abu, bukan sampul.** Kodenya masih
   beralasan "sampul belum ada", padahal Fase 2 sudah mengunggahnya dan brief
   bagian 9 mensyaratkan sampul tampil di katalog. Ketahuan karena katalog
   memuat judul buku tetapi tidak satu pun `src="/covers/…"`. Diperbaiki, dan
   sekarang ada tesnya di `app/components/BookCard.test.tsx`.

### Kebersihan repository

```bash
git status --porcelain
git grep -n -i -E "password|secret|service_role|api[_-]?key" -- app/ ':!app/package-lock.json'
```

`.env.local` tidak muncul di `git status`, dan pencarian hanya menemukan nama
variabel di `.env.example`, kode validasi, nama kolom `password_hash`, serta
password palsu di berkas tes (`password-yang-cukup-panjang`) — tidak ada nilai
sungguhan. `.env.example` sendiri berisi `DB_PASSWORD=` yang sengaja kosong.

## Blocker

Hal-hal berikut belum bisa diselesaikan dan perlu keputusan atau tindakan dari
pemilik proyek.

1. **Hosting dan domain belum dibeli.** Seluruh verifikasi Fase 1 dilakukan
   terhadap MySQL lokal. Perilaku di server sungguhan (versi PHP/Node, batas
   unggah, izin berkas) belum teruji sama sekali. Sesuai perjanjian, domain dan
   hosting didaftarkan atas nama CV Cipta Manuskrip Media.

2. **Versi MySQL/MariaDB di paket hosting belum diketahui.** Bila ternyata
   MariaDB, ada perilaku yang bisa berbeda — terutama `DEFAULT (UUID())` dan
   penegakan CHECK constraint. Bila itu terjadi, penyesuaiannya terbatas pada
   berkas di `db/migrations/`, tidak menyentuh kode aplikasi. Ini adalah alasan
   skema sengaja diletakkan seluruhnya di berkas migration.

3. **Akun admin `admin@localhost` adalah akun pengembangan.** Email dan
   passwordnya wajib diganti dengan milik client sebelum serah terima akses
   admin. Perjanjian menetapkan serah terima akses admin terjadi setelah
   pelunasan.

4. **Organisasi Supabase yang dibuat sebelumnya kini menganggur dan milik
   client.** Jangan dihapus tanpa sepengetahuan mereka.

5. **Bahan dari client masih memakai placeholder.** Naskah profil perusahaan,
   logo, dan berkas sampul buku belum diterima. Lihat `docs/DESIGN-STACK.md`
   bagian 8 untuk daftar lengkapnya. Tidak ada data perusahaan, statistik,
   testimoni, atau dokumen hukum yang dikarang untuk mengisi kekosongan itu.

## Status acceptance test brief bagian 13

Daftar periksa lengkap. "Otomatis" berarti dijalankan Vitest; "HTTP" berarti
dijalankan `curl` terhadap build produksi dan hasilnya tercatat di atas.

| # | Kriteria | Cara dibuktikan | Status |
|---|---|---|---|
| 1 | Empty state saat database kosong | otomatis + HTTP | Lulus |
| 2 | Anon tidak dapat membuka data admin atau memutasi | otomatis + HTTP | Lulus |
| 3 | User non-admin ditolak | `SPEC-AMENDMENT-01.md` §13 menggantinya | **Tidak berlaku** |
| 4 | Login nyata, refresh tetap valid, logout menutup akses | otomatis + HTTP | Lulus |
| 5 | Tambah published dengan sampul → tampil di admin, katalog, detail | otomatis + HTTP | Lulus |
| 6 | Tambah upcoming → estimasi wajib, tidak ada order di detail | otomatis | Lulus |
| 7 | Edit judul/penulis/isi/status/slug → publik berubah, slug lama mati | otomatis | Lulus |
| 8 | Ganti sampul → gambar baru tampil, berkas lama dibersihkan | otomatis | Lulus |
| 9 | Hapus buku → hilang dari admin/katalog/detail, berkas dibersihkan | otomatis | Lulus |
| 10 | Input kosong, slug duplikat, status invalid, berkas kebesaran/non-gambar ditolak | otomatis + HTTP | Lulus |
| 11 | Kegagalan simpan setelah unggah tidak meninggalkan berkas, sampul lama tetap | otomatis | Lulus |
| 12 | Dataset >12 buku: urutan A–Z, pagination, halaman invalid, pemisahan status | otomatis | **Sebagian** — lihat catatan |
| 13 | URL WhatsApp dan hasil decode pesan cocok persis | otomatis | Lulus |
| 14 | UI tidak membocorkan key; route admin noindex; robots; sitemap | belum | **Belum menyentuh Fase 3** |
| 15 | UI sederhana, rapi, responsif, cukup untuk menguji semua alur | — | Sebagaimana diminta |

Catatan jujur atas yang belum lengkap:

- **#3 tidak berlaku.** Brief aslinya meminta pembuktian bahwa "user
  authenticated non-admin" ditolak. Aplikasi ini tidak punya konsep itu:
  satu-satunya tabel akun adalah `admin_users`, dan tidak ada registrasi
  publik. `SPEC-AMENDMENT-01.md` §13 sudah menggantinya dengan pengujian
  cookie sesi palsu, sesi kedaluwarsa, dan token yang salah — ketiganya
  diuji dan lulus.
- **#12 baru sebagian.** Pagination dan penanganan halaman di luar rentang
  sudah diuji dengan 14 baris data pada Fase 1. Yang belum dijalankan adalah
  pengujian urutan A–Z lintas halaman pada dataset besar yang melewati lebih
  dari dua halaman.
- **#14 belum dikerjakan sama sekali.** `robots.txt`, `sitemap.xml`, dan
  metadata `noindex` untuk `/admin` masuk lingkup Fase 3 menurut brief §14.

## Pekerjaan tersisa

### Fase 3 — alur publik, metadata, dan tampilan

- Kedua katalog dengan pagination database penuh, pengurutan A–Z lintas
  halaman, dan invalidation setelah mutasi admin.
- `robots.txt`, `sitemap.xml`, dan `noindex` untuk route `/admin`.
- Desain visual sesungguhnya (brief bagian 4). Tampilan sekarang sengaja
  seadanya: yang dibuktikan Fase 1 dan 2 adalah aliran datanya, bukan
  desainnya.
- `next/image` untuk optimasi sampul. Saat ini `<img>` biasa dipakai dengan
  sengaja, karena sampul sudah diperkecil dan dikompres `sharp` saat diunggah.
- Halaman statis yang tersisa dan alur WhatsApp lengkap (nomor WhatsApp dan
  teks halaman dari brief bagian 9 dan 10).

### Perlu ditinjau sebelum Fase 3

- **Peninjauan seluruh branch Fase 2 oleh peninjau independen** — belum
  dijalankan pada saat laporan ini ditulis.
- Persetujuan pemilik proyek untuk melanjutkan ke Fase 3.
