# Progres Proyek

Laporan apa adanya. Brief bagian 13 melarang menyebut sebuah fase selesai bila
alur utamanya belum benar-benar terverifikasi — karena itu setiap klaim di
bawah ini disertai cara pembuktiannya.

Terakhir diperbarui: 20 Oktober 2026.

## Ringkasan fase

| Fase | Isi | Status |
|---|---|---|
| 1 | Fondasi, database, dan halaman publik yang membaca data nyata | **Selesai koding — menunggu peninjauan** |
| 2 | Panel admin, login, unggah sampul, halaman detail buku | **Selesai koding — menunggu peninjauan** |
| 3 | Semua alur publik, metadata, robots/sitemap | **Selesai koding — menunggu peninjauan** |

Fase 1–3 **belum boleh disebut selesai sepenuhnya**: semuanya baru
terverifikasi di komputer pengembangan, belum di server hosting. Lihat bagian
Blocker.

## Yang sudah dikerjakan di Fase 1

Delapan commit Fase 1, dipisah per satuan kerja:

| Commit | Isi |
|---|---|
| `4fa86ac` | Bootstrap Next.js 16 + TypeScript strict + Tailwind |
| `d2ec637` | Konfigurasi environment dan validasi kredensial database |
| `d5eb26f` | Migration SQL dan skrip pembuatan skema |
| `3abaf43` | Koneksi database MySQL dan pengujiannya |
| `8d906e1` | Perintah pembuatan akun admin dengan hash argon2id |
| `df43dc0` | Validasi input buku dan pembentuk slug |
| `9ad5051` | Repository buku dengan pagination dan pengujiannya |
| `61bcd0e` | Halaman katalog: empty state dan galat database terpisah |

Rancangan teknis lengkapnya ada di `docs/DESIGN-STACK.md`; perubahan lingkup
terhadap brief awal ada di `docs/SPEC-AMENDMENT-01.md`.

## Yang sudah dikerjakan di Fase 2

Enam commit Fase 2:

| Commit | Isi |
|---|---|
| `a26d0a0` | Verifikasi kata sandi argon2id dan pembatasan percobaan login |
| `ef93190` | Manajemen sesi dan penjaga route admin |
| `75d1490` | Pemrosesan dan penyimpanan berkas sampul |
| `89b44dd` | Halaman login admin dan dashboard terproteksi |
| `66de450` | Daftar buku admin dan form penambahan dengan kompensasi berkas |
| `e24ba2e` | Form edit buku dengan pergantian sampul dan aksi hapus |

Semuanya digabung ke `master` setelah peninjauan branch. Tujuh temuan yang
mengubah rencana awal dicatat di catatan pelaksanaan Fase 2
(`.superpowers/sdd/2026-10-19-fase-2-panel-admin/progress.md`, berkas kerja
lokal yang sengaja tidak masuk repo); dua di antaranya adalah perbaikan bug
yang ditemukan lewat verifikasi HTTP, bukan lewat tes otomatis — lihat
"Dua bug yang ditemukan dan diperbaiki" di bawah.

## Yang sudah dikerjakan di Fase 3

Dua belas commit di `master` setelah Fase 2, dipisah per satuan kerja:

| Commit | Isi |
|---|---|
| `1cba786` | Konten statis terpusat di `app/content/site.ts` dengan placeholder klien |
| `bbec5bc` | Kanal WhatsApp jurnal dan validasi topik asistensi |
| `8d2775e` | Pembacaan URL situs dari environment (`SITE_URL`) |
| `e628ef4` | Route group `(publik)` dengan header dan footer |
| `8948379` | Halaman `/publish-buku` dengan preview katalog dari database |
| `d9fc156` | Halaman `/publish-jurnal` dengan fasilitas dari brief |
| `f0eb196` | Halaman `/publish-jurnal/kirim-artikel` dengan tiga kategori jurnal |
| `6dc4fc1` | Fix: hapus klaim indeksasi yang tidak bersumber dari brief |
| `375f163` | Halaman `/publish-jurnal/asistensi` — input topik ke WhatsApp |
| `234c8c7` | Halaman `/tentang-kami` dengan kontak dan placeholder legalitas |
| `c79997d` | `robots.txt`, sitemap dinamis, dan metadata situs |
| `e5b915d` | Invalidasi `/publish-buku` setelah mutasi admin + acceptance test Fase 3 |

Rencana kerja lengkapnya ada di
`docs/superpowers/plans/2026-10-20-fase-3-alur-publik.md`; catatan pelaksanaan
(temuan yang mengubah rencana, satu per satu) ada di
`.superpowers/sdd/2026-10-20-fase-3-alur-publik/progress.md` — berkas kerja
lokal, sengaja tidak masuk repo.

## Yang benar-benar terverifikasi

### Tes otomatis

```bash
cd app && npx vitest run
```

Hasil terakhir (commit `e5b915d`): **40 berkas tes, 278 tes, semuanya lulus.**
Mencakup seluruh cakupan Fase 1 dan 2 ditambah Fase 3: konten statis terpusat,
kanal WhatsApp dan validasi topik asistensi, halaman publik baru
(`/publish-buku` dengan dua preview katalog, `/publish-jurnal`,
`/publish-jurnal/kirim-artikel`, `/publish-jurnal/asistensi`,
`/tentang-kami`), robots/sitemap/metadata, daftar revalidasi, dan acceptance
test alur admin → publik Fase 3.

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
├ ƒ /admin
├ ƒ /admin/buku
├ ƒ /admin/buku/[id]/edit
├ ƒ /admin/buku/tambah
├ ○ /admin/login
├ ƒ /buku/[slug]
├ ƒ /covers/[berkas]
├ ƒ /katalog/[status]
├ ƒ /publish-buku
├ ○ /publish-jurnal
├ ○ /publish-jurnal/asistensi
├ ○ /publish-jurnal/kirim-artikel
├ ○ /robots.txt
├ ƒ /sitemap.xml
└ ○ /tentang-kami

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Catatan jujur atas tabel itu: **seluruh route publik yang membaca database
adalah `ƒ` (Dynamic)** — beranda, katalog, `/publish-buku`, detail buku,
penyaji sampul, dan sitemap. Artinya mereka dirender saat diminta, bukan
dibekukan saat build; itu syarat agar buku baru langsung tampil. `robots.txt`
statik dan independen dari database.

### Verifikasi HTTP Fase 1

Dijalankan terhadap `npm run start` (build produksi), dengan `curl` —
dirangkum dari laporan Fase 1; buktinya tidak diulang di sini.

#### Tiga keadaan halaman katalog

| Keadaan | Yang tampil |
|---|---|
| Database kosong | `Belum ada buku yang diterbitkan.` |
| MySQL dimatikan | `Katalog sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.` |
| MySQL dinyalakan lagi | kembali ke `Belum ada buku yang diterbitkan.` |

Ketiganya berbeda, sesuai syarat brief bagian 9. MySQL dimatikan lewat
`mysqladmin shutdown` lalu dihidupkan kembali; pesannya berubah tanpa perlu
memulai ulang server Next.js.

#### Data nyata dari database

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

#### Paginasi

Dengan 14 baris uji, halaman 1 menampilkan 12 buku dan menautkan ke halaman 2;
`?page=2` menampilkan sisa 2 buku dengan penanda halaman aktif berpindah.
Nilai di luar rentang dijepit ke halaman terakhir (`?page=9`), sedangkan
`?page=0` dan `?page=abc` jatuh ke halaman 1.

#### Keadaan lain

| Uji | Hasil |
|---|---|
| `/katalog/sedang-ditulis` (segmen tak dikenal) | HTTP 404 |
| `/katalog/segera-terbit` dengan database kosong | `Belum ada buku yang segera terbit.` |
| Beranda `/` | Judul dan kedua tautan katalog tampil |
| `npm run db:migrate` dijalankan dua kali | Aman, tidak menggandakan tabel |

#### Kekangan database

Diuji langsung lewat klien MySQL: enam pelanggaran (status ilegal, judul
kosong, `published` tanpa sinopsis, `upcoming` tanpa estimasi, `published` yang
justru punya estimasi, slug duplikat) semuanya **ditolak** database dengan
`ERROR 3819` / `ERROR 1062`. `ON UPDATE CURRENT_TIMESTAMP` juga dipastikan
bekerja: `created_at` tetap, `updated_at` maju.

### Verifikasi HTTP Fase 2

Dijalankan terhadap `next start` (build produksi) pada port 3106 dan 3107,
dengan `curl`. Peralihan halaman dan cookie tidak bisa diuji dari Vitest —
`cookies()` dan `redirect()` hanya hidup di dalam permintaan HTTP — jadi
bagian itulah yang dibuktikan di sini.

Penjagaan akses, alur unggah sampul ujung ke ujung, penolakan path traversal,
dan dua bug yang ditemukannya tetap seperti tercatat sebelumnya dan tidak
diulang di sini — lihat riwayat laporan di git (lampiran laporan Fase 2 di
`.superpowers/sdd/2026-10-19-fase-2-panel-admin/`). Ringkasnya:

| Permintaan | Hasil |
|---|---|
| Route `/admin/*` tanpa sesi | `307` ke `/admin/login` |
| Route `/admin/*` dengan sesi sah | `200` |
| Upload sampul end-to-end | server action `303`, `cover_path` terisi, `/covers/<uuid>.webp` jawab `200 image/webp` |
| Path traversal `/covers/../package.json` dan variasinya | `404` |

Dua bug yang ditemukan dan diperbaiki saat itu (sampul tidak pernah tampil
setelah `next start` membekukan daftar `public/`; kartu katalog tanpa sampul)
keduanya kini punya tes otomatisnya sendiri:

1. **Sampul yang baru diunggah tidak pernah tampil.** `next start` membekukan
   daftar berkas `public/` saat server menyala. Berkas yang ditulis setelahnya
   — yaitu setiap sampul yang diunggah admin — tidak pernah disajikan, sampai
   server di-restart. Diperbaiki dengan menyajikan sampul lewat route
   `/covers/[berkas]` yang membaca disk per permintaan, dan memindahkan folder
   bawaan keluar dari `public/` ke `storage/covers`.
2. **Kartu katalog menampilkan kotak abu, bukan sampul.** Kodenya masih
   beralasan "sampul belum ada", padahal Fase 2 sudah mengunggahnya. Diperbaiki,
   dan sekarang ada tesnya di `app/components/BookCard.test.tsx`.

## Verifikasi HTTP Fase 3

Dijalankan terhadap `next start` (build produksi) pada port 3106, dengan
`curl` untuk halaman publik dan **Chrome headless via CDP** untuk form admin —
form admin membawa token Server Actions dan berkas unggahan yang tidak bisa
disusun manual dari curl, jadi submit-nya memakai peramban sungguhan yang
mengisi form yang sama seperti manusia dan mengirim ke endpoint HTTP yang
sama.

### Seluruh route publik hidup

| Route | Status |
|---|---|
| `/` | 200 |
| `/tentang-kami` | 200 |
| `/publish-buku` | 200 |
| `/publish-jurnal` | 200 |
| `/publish-jurnal/kirim-artikel` | 200 |
| `/publish-jurnal/asistensi` | 200 |
| `/katalog/telah-terbit` | 200 |
| `/katalog/segera-terbit` | 200 |
| `/robots.txt` | 200 |
| `/sitemap.xml` | 200 |

### robots.txt dan sitemap.xml

`GET /robots.txt` berisi:

```
User-Agent: *
Allow: /
Disallow: /admin

Sitemap: http://localhost:3000/sitemap.xml
```

`GET /sitemap.xml` memuat 8 URL — beranda, `/tentang-kami`, `/publish-buku`,
`/publish-jurnal`, `/publish-jurnal/kirim-artikel`,
`/publish-jurnal/asistensi`, `/katalog/telah-terbit`,
`/katalog/segera-terbit` — dengan URL absolut dan **tanpa satu pun URL
`/admin`**. Halaman admin menset `robots: { index: false, follow: false }`.
`noindex, nofollow` terbaca langsung di HTML `/admin/login`; untuk halaman di
belakang `(terlindungi)` buktinya dari sumber — layout group dan ketiga
halaman anaknya masing-masing mengekspor `robots` yang sama — karena halaman
itu hanya bisa diambil lewat sesi.

Semua URL berasal dari `SITE_URL`. `SITE_URL` belum diset (domain belum ada),
jadi nilainya fallback `http://localhost:3000`. **Ini wajib diperbaiki sebelum
naik produksi** — lihat Blocker 1.

### Login admin lewat form sungguhan

Login diisi dan disubmit lewat form `/admin/login` di Chrome headless (bukan
POST buatan): React mengontol form itu, action Server Actions berjalan,
redirect menuju `/admin`, dan cookie `cmm_session` HttpOnly terbentuk. Cookie
itu dipakai semua langkah admin di bawah.

### Alur admin → publik, ujung ke ujung

Tanpa memulai ulang server kapan pun:

1. Saat `books` kosong, `/publish-buku` memuat placeholder klien di blok
   preview dan kedua katalog memuat empty state.
2. Admin menambah buku **telah terbit** "Buku Uji Produksi Fase Tiga" lewat
   form `/admin/buku/tambah` — judul, penulis, sinopsis, status
   `published`, dan berkas JPEG 600×900 buatan `sharp` sebagai sampul.
   Form kembali ke `/admin/buku` menampilkan `/buku/buku-uji-produksi-fase-tiga`
   dan sampul `/covers/6cb81127-1bb5-4758-91d0-1a340cb8d84e.webp`.
3. Tanpa restart, semua permukaan publik langsung menampilkannya:
   `/publish-buku` (judul muncul), `/katalog/telah-terbit` (judul muncul),
   `/buku/buku-uji-produksi-fase-tiga` (200, judul, sinopsis, dan tautan
   WhatsApp `wa.me/6289671894900` 4×), `/sitemap.xml` (menambah
   `/buku/<slug>`), dan `GET /covers/6cb81127-….webp` menjawab **200
   `image/webp`**.
4. Admin mengubah slug menjadi `buku-uji-produksi-fase-tiga-revisi` lewat form
   edit. Hasilnya: slug lama menjawab **404**, slug baru **200**.
5. Admin menghapus buku lewat tombol "Hapus buku" (dengan konfirmasi yang
   di-stub setuju di peramban uji). Hasilnya, **semuanya kosong tanpa
   restart**: produk hilang dari `/publish-buku`, `/katalog/telah-terbit`,
   dan `/sitemap.xml`; detail `/buku/<slug-revisi>` menjawab 404; dan berkas
   sampul `/covers/6cb81127-….webp` ikut terhapus — 404, tidak ada berkas
   yatim di disk.

Catatan jujur atas langkah 3–5: terbukti di sini adalah **jalur datanya** —
mutasi admin langsung terlihat di halaman publik tanpa restart. Table route di
atas menunjukkan seluruh halaman pembaca database adalah `ƒ` (Dynamic), jadi
yang dicerminkan adalah render barunya per permintaan; klaim "eviction cache
revalidatePath terverifikasi" tidak dibuat, karena dengan halaman dinamis
yang terbukti itu render segar, bukan siklus invalidate-cache.

### Anchors dan nomor WhatsApp

| Pemeriksaan | Hasil |
|---|---|
| `/publish-buku` memuat `id="paket"` | ada (1) |
| `/publish-buku` memuat `id="asistensi"` | ada (1) |
| `/publish-jurnal/kirim-artikel` menaut `wa.me/62895629203142` | 3 tautan |
| Detail buku menaut WhatsApp admin `wa.me/6289671894900` | ada (4 referensi) |
| `/tentang-kami` menaut `tel:0895-6292-03142` dan `tel:0896-7189-4900` | ada — dengan format domestik, lihat Blocker 6 |

### Paginasi tiga halaman dan PREVIEW_LIMIT

Dibuktikan acceptance test terhadap MySQL sungguhan
(`tests/acceptance-fase-3.test.tsx`, laporan lengkap di
`.superpowers/sdd/2026-10-20-fase-3-alur-publik/task-11-report.md`):

- **30 published lintas 3 halaman**: judul `Judul Z..A` disisipkan mundur;
  gabungan page 1..3 dari `listBooks` sama persis dengan hasil sort
  (urutan A–Z), page 3 memuat tepat 6 baris, `new Set(gabungan).size === 30`,
  dan setiap judul seed ada.
- **14 upcoming di 2 halaman (12+2)**: terurut, tanpa dobel, dan tetap
  seluruhnya `upcoming` setelah 5 published ditambahkan kembali — pemisahan
  status pada level pagination.
- `page=0`, `page=abc`, `page=999` dirender tanpa galat, tanpa `db-error`, dan
  berisi halaman yang ada (dinormalkan, bukan kosong).
- **PREVIEW_LIMIT = 3**: `/publish-buku` mengambil kedua preview dengan
  `pageSize: PREVIEW_LIMIT` — tiga teratas A–Z muncul, yang keempat tidak, dan
  kesalahan tebal status (buku terbit tidak bocor ke blok segera, begitu
  pula sebaliknya) diuji dengan 4+4 buku.

### Sitemap memuat kedua status buku

Acceptance test menambah satu `published` dan satu `upcoming` lewat action
admin sungguhan dan memastikan keduanya masuk `/sitemap.xml`. Route
`/katalog/[status]` menolak segmen lain selain kedua nilai itu (404).

## Blocker

Hal-hal berikut belum bisa diselesaikan dan perlu keputusan atau tindakan dari
pemilik proyek.

1. **Hosting dan domain belum dibeli.** Seluruh verifikasi Fase 1–3 dilakukan
   terhadap MySQL lokal. Perilaku di server sungguhan (versi Node, batas
   unggah, izin berkas) belum teruji sama sekali. Sesuai perjanjian, domain
   dan hosting didaftarkan atas nama CV Cipta Manuskrip Media. **Dampak
   langsung sekarang**: `SITE_URL` belum bisa diset karena domainnya belum
   ada, sehingga `robots.txt` dan `sitemap.xml` saat ini memuat
   `http://localhost:3000` — keduanya **wajib dipindah ke domain sungguhan
   sebelum situs naik**, bukan terbatas "wajar untuk pengembangan".

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

5. **Bahan dari client masih memakai placeholder.** Halaman publik Fase 3
   sengaja memuat placeholder seperti `[Aset dari klien]`,
   `[Nama paket dari klien]`, `[Harga dari klien]`,
   `[Fasilitas paket dari klien]` — teks yang jujur bahwa isinya belum ada,
   dianggap wajar oleh pemilik proyek per 20 Oktober 2026. Naskah profil
   perusahaan, logo, dokumen legalitas, dan berkas sampul buku belum
   diterima; tidak ada data perusahaan, statistik, testimoni, atau dokumen
   hukum yang dikarang untuk mengisi kekosongan itu. Lihat
   `docs/DESIGN-STACK.md` bagian 8 untuk daftar lengkapnya. Fondasi halamannya
   sudah bangun; penggantian placeholder dengan bahan client adalah jahitan
   yang tinggal dijahit.

6. **Tautan `tel:` di `/tentang-kami` memakai format domestik — perlu
   keputusan klien.** `tel:0895-6292-03142` dan `tel:0896-7189-4900` ditulis
   apa adanya dari nomor tampilan yang dikunci brief §9 (dengan tanda hubung
   dan awalan `0`), bukan dinormalkan ke `+62…`. Konsekuensinya tautan itu
   berfungsi di Indonesia dan tidak akan tersambung dari luar negeri.
   Peninjau menilai ini bukan cacat — brief yang menentukan bentuk nomornya,
   dan mengubahnya berarti membuat representasi kedua dari nomor yang sama.
   Tetapi **belum ada yang memutuskan** apakah format internasional
   diinginkan; itu keputusan klien, dicatat di sini agar terlihat, bukan
   diam-diam diubah.

## Status acceptance test brief bagian 13

Daftar periksa lengkap. "Otomatis" berarti dijalankan Vitest; "HTTP" berarti
dijalankan terhadap build produksi dan hasilnya tercatat di atas.

| # | Kriteria | Cara dibuktikan | Status |
|---|---|---|---|
| 1 | Empty state saat database kosong | otomatis + HTTP | Lulus |
| 2 | Anon tidak dapat membuka data admin atau memutasi | otomatis + HTTP | Lulus |
| 3 | User non-admin ditolak | `SPEC-AMENDMENT-01.md` §13 menggantinya | **Tidak berlaku** |
| 4 | Login nyata, refresh tetap valid, logout menutup akses | otomatis + HTTP | Lulus |
| 5 | Tambah published dengan sampul → tampil di admin, katalog, detail | otomatis + HTTP | Lulus |
| 6 | Tambah upcoming → estimasi wajib, tidak ada order di detail | otomatis | Lulus |
| 7 | Edit judul/penulis/isi/status/slug → publik berubah, slug lama mati | otomatis + HTTP | Lulus |
| 8 | Ganti sampul → gambar baru tampil, berkas lama dibersihkan | otomatis | Lulus |
| 9 | Hapus buku → hilang dari admin/katalog/detail, berkas dibersihkan | otomatis + HTTP | Lulus |
| 10 | Input kosong, slug duplikat, status invalid, berkas kebesaran/non-gambar ditolak | otomatis + HTTP | Lulus |
| 11 | Kegagalan simpan setelah unggah tidak meninggalkan berkas, sampul lama tetap | otomatis | Lulus |
| 12 | Dataset >12 buku: urutan A–Z, pagination, halaman invalid, pemisahan status | otomatis (acceptance `acceptance-fase-3.test.tsx`) | **Lulus** — 30 published lintas 3 halaman |
| 13 | URL WhatsApp dan hasil decode pesan cocok persis | otomatis | Lulus |
| 14 | UI tidak membocorkan key; route admin noindex; robots; sitemap | otomatis + HTTP | **Lulus** |
| 15 | UI sederhana, rapi, responsif, cukup untuk menguji semua alur | — | Sebagaimana diminta |

Catatan jujur atas yang perlu dijelaskan:

- **#3 tidak berlaku.** Brief aslinya meminta pembuktian bahwa "user
  authenticated non-admin" ditolak. Aplikasi ini tidak punya konsep itu:
  satu-satunya tabel akun adalah `admin_users`, dan tidak ada registrasi
  publik. `SPEC-AMENDMENT-01.md` §13 sudah menggantinya dengan pengujian
  cookie sesi palsu, sesi kedaluwarsa, dan token yang salah — ketiganya
  diuji dan lulus.
- **#12 kini lulus penuh.** Dalam acceptance Fase 3 diuji 30 published yang
  terbaca urut A–Z lintas 3 halaman, 14 upcoming terbaca 2 halaman (12+2),
  halaman `?page=` yang aneh tidak meledak, dan pemisahan status tetap
  benar. Pencarian telusuri detail pagination pada halaman katalog juga
  sudah dikerjakan di Fase 1; pengujian 30-buku ini yang melengkapi bagian
  yang sebelumnya "Sebagian".
- **#14 kini lulus.** Route `/admin` (semua halaman di belakang
  `(terlindungi)`) memuat meta `noindex, nofollow` — dibaca dari sumber
  (`app/app/admin/(terlindungi)/layout.tsx` beserta ketiga halaman anaknya,
  yang masing-masing juga mengekspor `robots`); `noindex` di `/admin/login`
  terbaca langsung di HTML yang tersaji. `robots.txt` berisi
  `Disallow: /admin` plus direktif
  sitemap; `sitemap.xml` memuat 8 URL publik absolut dengan URL dari
  `SITE_URL`, tanpa satu pun URL `/admin`, dan memuat kedua status buku.
  `UI tidak membocorkan key`: tidak ada nilai kunci di UI (diperiksa lewat
  pencarian sensitif git di laporan verifikasi Fase 2).

## Pekerjaan tersisa

### Sebelum naik produksi

- Peninjauan independen atas seluruh branch Fase 3.
- Beli domain + hosting, lalu set `SITE_URL` ke `https://<domain>` —
  `robots.txt` dan `sitemap.xml` saat ini masih rendering `localhost:3000`.
- Kumpulkan bahan dari client (nomor WhatsApp resmi tiap layanan, teks paket,
  logo, naskah profil, dokumen legalitas, sampul buku) untuk menggantikan
  placeholder. Halaman sudah siap; yang belum adalah isinya.
- Ganti kredensial akun admin pengembangan (`admin@localhost`) sebelum serah
  terima.
- Konfirmasi versi MySQL/MariaDB di paket hosting, lalu jalankan `npm run
  db:migrate` di sana dan uji ulang route publik dengan data client.

### Di luar lingkup repo ini — Arena

Desain visual penuh (brief bagian 4) **sengaja tidak dikerjakan di repo ini** —
brief menetapkan desain dikerjakan di Arena setelah repo diimpor; yang dibangun
di Fase 3 adalah kerangka per halaman plus header/footer, dengan token warna
dipakai seperlunya. `next/image` juga belum terpasang: tes komponen mengunci
`src="/covers/<uuid>.webp"` mentah dan migrasi optimizer ditunda ke Arena
(sampul sudah diperkecil dan dikompres `sharp` saat diunggah). Keduanya
tercatat di tabel "Catatan cakupan yang sengaja ditunda" pada rencana Fase 3 —
pilihan, bukan lupa dikerjakan.
