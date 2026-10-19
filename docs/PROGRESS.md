# Progres Proyek

Laporan apa adanya. Brief bagian 13 melarang menyebut sebuah fase selesai bila
alur utamanya belum benar-benar terverifikasi — karena itu setiap klaim di
bawah ini disertai cara pembuktiannya.

Terakhir diperbarui: 19 Oktober 2026.

## Ringkasan fase

| Fase | Isi | Status |
|---|---|---|
| 1 | Fondasi, database, dan halaman publik yang membaca data nyata | **Selesai koding — menunggu peninjauan** |
| 2 | Panel admin, login, unggah sampul, halaman detail buku | Belum dimulai |
| 3 | Desain visual (Arena), unggah berkas sampul sungguhan | Belum dimulai |

Fase 1 **belum boleh disebut selesai sepenuhnya**: ia baru terverifikasi di
komputer pengembangan, belum di server hosting. Lihat bagian Blocker.

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

## Yang benar-benar terverifikasi

### Tes otomatis

```bash
cd app && npm test
```

Hasil: **9 berkas tes, 67 tes, semuanya lulus.** Mencakup validasi input,
pembentuk slug, paginasi, pemetaan baris database, repository buku (tulis,
baca, ubah, hapus, dan penolakan slug duplikat), koneksi database, dan
keluaran perintah pembuatan admin.

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

## Pekerjaan tersisa

### Fase 2 — panel admin

- Halaman masuk admin dengan pembatasan percobaan masuk dan penguncian sementara.
  Kolom `failed_attempts` dan `locked_until` sudah disiapkan di skema, berikut
  tabel `sessions`, tetapi belum ada kode yang memakainya.
- Panel admin: daftar, tambah, ubah, hapus buku.
- Unggah sampul dengan batas 5 MiB (`COVER_MAX_BYTES` sudah ada di konfigurasi).
- Halaman detail buku di `/buku/[slug]` — tautan dari kartu katalog sudah
  mengarah ke sana, tetapi halamannya belum dibuat.

### Fase 3 — tampilan dan berkas

- Desain visual sesungguhnya (brief bagian 4). Tampilan sekarang sengaja
  seadanya: yang dibuktikan Fase 1 adalah aliran datanya, bukan desainnya.
- Penyimpanan berkas sampul sungguhan. Saat ini kartu buku menampilkan kotak
  abu sebagai penanda tempat, karena belum ada berkas dan `next/image` belum
  dikonfigurasi.
- Nomor WhatsApp dan teks halaman dari brief bagian 9 dan 10.

### Perlu ditinjau sebelum Fase 2

- **Peninjauan seluruh branch Fase 1 oleh peninjau independen** — belum
  dijalankan pada saat laporan ini ditulis.
- Persetujuan pemilik proyek untuk melanjutkan ke Fase 2.
