# CV Cipta Manuskrip Media — Situs Web

Situs web perusahaan penerbitan CV Cipta Manuskrip Media: katalog buku yang
telah terbit dan yang segera terbit, dikelola lewat panel admin.

Proyek ini **tidak memakai Supabase**. Seluruh data disimpan di MySQL yang
dikelola sendiri, diakses tanpa ORM.

## Prasyarat

| Kebutuhan | Versi | Catatan |
|---|---|---|
| Node.js | ≥ 20.9 | Dikembangkan dan diuji di Node v24.22.0 |
| MySQL | 8.4 | Diuji pada MySQL 8.4.3 |

MariaDB 11.8 didukung (diuji sebagai target hosting). Untuk menaikkan situs ke server, lihat `docs/DEPLOY.md` dan `docs/UPLOAD-DATABASE.md`.

## Menyiapkan proyek

```bash
cd app
npm install
```

Salin contoh konfigurasi, lalu isi nilainya:

```bash
cp .env.example .env.local
```

`.env.local` berisi kredensial asli dan **tidak pernah di-commit**. Variabel
yang dibutuhkan:

| Variabel | Bawaan | Keterangan |
|---|---|---|
| `DB_HOST` | `127.0.0.1` | |
| `DB_PORT` | `3306` | |
| `DB_USER` | `root` | |
| `DB_PASSWORD` | (kosong) | Kosongkan bila MySQL tidak memakai password |
| `DB_NAME` | `cipta_manuskrip_media` | Dibuat otomatis oleh migration bila belum ada |
| `BOOKS_PER_PAGE` | `12` | Jumlah buku per halaman katalog |
| `SITE_URL` | `http://localhost:3000` | Asal URL absolut untuk sitemap dan robots; wajib diisi alamat produksi sebelum situs naik |
| `COVER_MAX_BYTES` | `5242880` | Batas ukuran berkas sampul (5 MiB), sebelum diproses |
| `COVER_DIR` | `storage/covers` | Folder fisik penyimpanan sampul |

`COVER_DIR` boleh dikosongkan (dipakai `storage/covers` di dalam folder
aplikasi) atau diarahkan ke folder **di luar** folder aplikasi. Yang terakhir
itu yang dianjurkan di hosting: sampul tidak ikut terhapus saat aplikasi
di-deploy ulang. Folder mana pun yang dipakai, sampul **tidak** disajikan
sebagai berkas statis — isinya dibaca oleh route `/covers/[berkas]` per
permintaan. Sampul disimpan di luar folder aplikasi di hosting supaya selamat
saat deploy ulang — lihat `docs/DEPLOY.md`.

## Menyiapkan database

```bash
npm run db:migrate
```

Perintah ini membuat database bila belum ada, lalu menjalankan seluruh berkas
`.sql` di `db/migrations/` secara berurutan. Aman dijalankan berulang.

Membuat akun admin:

```bash
npm run db:create-admin -- --email nama@domain.com
```

Password ditanyakan lewat terminal dan tidak ditampilkan saat diketik. Bisa juga
diisi lewat variabel `ADMIN_PASSWORD` untuk pemakaian non-interaktif. Password
minimal 12 karakter dan disimpan sebagai hash argon2id, tidak pernah sebagai
teks biasa.

## Menjalankan

```bash
npm run dev          # mode pengembangan di http://localhost:3000
npm run build        # build produksi
npm run start        # menjalankan hasil build
```

## Memakai panel admin

Masuk di `/admin/login` dengan akun yang dibuat lewat `db:create-admin`. Setelah
masuk, halaman `/admin` menautkan ke pengelolaan buku.

**Daftar buku** (`/admin/buku`) — semua buku, terbit maupun segera terbit,
beserta sampulnya, dengan tombol Ubah dan Hapus per baris.

**Tambah buku** (`/admin/buku/tambah`) — satu form berisi seluruh kolom:

| Kolom | Wajib | Catatan |
|---|---|---|
| Judul | ya | Slug dibuat otomatis dari judul |
| Slug | tidak | Kosongkan untuk memakai hasil otomatis; isi untuk memperbaikinya |
| Penulis | ya | |
| Sinopsis | untuk terbit | Wajib bila statusnya "telah terbit" |
| Informasi penerbit | tidak | Dikosongkan akan diisi nama perusahaan |
| Status | ya | "telah terbit" atau "segera terbit" |
| Estimasi terbit | untuk segera terbit | Wajib bila statusnya "segera terbit", dan **harus kosong** bila statusnya "telah terbit" — keduanya ditegakkan database, bukan hanya form |
| Sampul | ya | JPEG, PNG, atau WebP; maksimal 5 MiB |

Sampul diperkecil (sisi terpanjang maksimal 1600px) dan dikonversi ke WebP saat
diunggah, lalu disimpan dengan nama acak. Nama berkas dari komputer Anda tidak
pernah dipakai — jadi nama seperti `../../berkas.jpg` pun tidak berbahaya.

**Ubah buku** (`/admin/buku/<id>/edit`) — form yang sama dengan nilai
terisinya. Memilih berkas sampul baru akan menggantinya; berkas lama baru
dihapus **setelah** penyimpanan berhasil. Bila penyimpanan gagal, berkas baru
dibuang dan sampul lama tetap utuh.

**Hapus buku** — ada tombol konfirmasi. Menghapus buku juga menghapus berkas
sampulnya.

Bila validasi gagal, isian yang sudah Anda ketik tidak hilang — form kembali
dengan pesan di kolom yang bermasalah.

### Keamanan yang perlu diketahui admin

- Lima kali salah kata sandi berturut-turut mengunci akun selama 15 menit,
  termasuk untuk kata sandi yang benar sekalipun.
- Sesi berlaku 7 hari dan disimpan di database, sehingga bisa dicabut seketika
  lewat tombol keluar.
- Seluruh halaman admin selain halaman masuk tertutup bagi pengunjung yang
  belum masuk: server mengalihkan mereka ke `/admin/login`.

## Memeriksa kode

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript, tanpa keluaran bila bersih
npm test             # Vitest, sekali jalan
npm run test:watch   # Vitest, mode pantau
```

**Urutannya penting di clone baru: jalankan `npm run build` sebelum
`npm run typecheck`.** Layout memakai tipe `LayoutProps`, yang bukan tipe
bawaan melainkan **dihasilkan Next.js saat build**. Di clone yang belum
pernah di-build, `npm run typecheck` gagal dengan
`Cannot find name 'LayoutProps'` — itu bukan kerusakan kode, hanya tipe yang
belum dibuat. `npm run build` sendiri tidak terpengaruh urutan ini.

`npm test` menyentuh database yang sama dengan pengembangan, dan **tes
menghapus seluruh isi tabel `books` dan `admin_users`** di setiap awal tes —
termasuk akun admin yang sedang Anda pakai masuk. Isi database lokal akan
hilang dan harus dibuat ulang sesudahnya. Jangan pernah menunjuk `DB_NAME`
ke database berisi data sungguhan saat menjalankan tes.

Membuat ulang akun admin setelah tes:

```bash
ADMIN_PASSWORD=sandi-lokal-dev-panjang npm run db:create-admin -- --email admin@localhost
```

## Struktur folder

```
app/
├── app/                    Halaman Next.js (App Router)
│   ├── layout.tsx          Kerangka halaman, metadata, bahasa
│   ├── robots.ts           robots.txt: Allow semua, Disallow /admin
│   ├── sitemap.ts          sitemap.xml dinamis (force-dynamic)
│   ├── (publik)/           Route group halaman publik dengan header/footer
│   │   ├── page.tsx        Beranda
│   │   ├── katalog/[status]/   Katalog: telah-terbit, segera-terbit
│   │   ├── buku/[slug]/    Detail satu buku
│   │   ├── publish-buku/   Layanan penerbitan buku + preview katalog
│   │   ├── publish-jurnal/ Layanan penerbitan jurnal (3 subhalaman)
│   │   └── tentang-kami/   Profil perusahaan dan kontak
│   ├── covers/[berkas]/    Penyaji berkas sampul (route handler)
│   └── admin/              Panel admin
│       ├── (terlindungi)/  Route group bergerbang layout — lihat catatan
│       └── login/          Halaman masuk (satu-satunya route admin terbuka)
├── components/             Komponen tampilan murni, tanpa akses database
├── content/site.ts         Seluruh teks statis dan placeholder klien
├── db/migrations/          Berkas SQL, dijalankan berurutan
├── lib/
│   ├── auth/               Verifikasi sandi, sesi, penjaga route
│   ├── books/              Tipe, repository, paginasi, status, revalidasi
│   ├── db/                 Koneksi pool dan pembantu query
│   ├── storage/            Pemrosesan sampul dan aturan path-nya
│   ├── site-metadata.ts    Metadata situs dari SITE_URL
│   ├── whatsapp.ts         Pembentuk tautan WhatsApp dan validasi topik
│   ├── validation/         Validasi input dan pembentuk slug
│   └── env.ts              Pembacaan dan validasi variabel environment
├── scripts/                Perintah CLI: migrate, create-admin
├── storage/covers/         Sampul yang diunggah (tidak di-commit)
└── public/                 Berkas statis
```

Alur data satu arah: halaman → `lib/books/repository` → `lib/db` → MySQL.
Komponen di `components/` hanya menerima data, tidak pernah menyentuh
database — sehingga perombakan tampilan tidak bisa merusak aliran data.

**Route group `(terlindungi)` bukan hiasan.** Satu-satunya tempat
`requireAdmin()` dijalankan adalah `app/admin/(terlindungi)/layout.tsx`. Halaman
admin yang diletakkan di luar group itu — misalnya `app/admin/buku/` alih-alih
`app/admin/(terlindungi)/buku/` — **tidak mewarisi penjagaan sama sekali** dan
dapat dibuka siapa pun. Ini pernah terjadi dan ketahuan lewat verifikasi HTTP,
bukan lewat tes. Setiap halaman admin baru harus masuk ke dalam group itu.

## Dokumen terkait

| Berkas | Isi |
|---|---|
| `docs/UPLOAD-DATABASE.md` | Membuat database di panel hosting, mengisi env, migrasi, akun admin |
| `docs/DEPLOY.md` | Menaikkan situs ke hosting, environment produksi, daftar periksa |
| `PROJECT-BACKEND-FIRST.md` | Brief awal dari klien |

Perjanjian kerja sama yang ditandatangani **tidak** ada di repo ini: dokumen
itu memuat nama asli, tanda tangan, dan nilai perjanjian, sehingga disimpan
terpisah oleh pemilik proyek.
