# Deploy

Panduan menaikkan situs ke hosting. Ditulis untuk hosting VPS/panel yang
menyediakan **proses Node.js yang hidup terus** dan **MySQL** — brief §2
memang menuntut keduanya. Hosting statis (Netlify/Vercel static, GitHub
Pages) **tidak bisa** dipakai: katalog membaca MySQL per permintaan, dan
sampul ditulis ke disk.

## Yang wajib disediakan hosting

| Kebutuhan | Keterangan |
|---|---|
| Node.js | ≥ 20.9. Diuji di v24.22.0 |
| MySQL | 8.4. Diuji pada 8.4.3 |
| Proses Node hidup terus | `next start`, bukan serverless |
| Folder persisten | untuk sampul buku (`COVER_DIR`) |
| Environment variable | diisi dari panel hosting, bukan file ter-commit |

## Environment variable produksi

Salin `app/.env.example`, lalu isi. Yang **wajib** diubah dari nilai lokal:

| Variabel | Nilai produksi |
|---|---|
| `SITE_URL` | `https://domain-klien.com` — tanpa garis miring di ujung |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | kredensial MySQL hosting |
| `COVER_DIR` | folder **di luar** folder aplikasi, mis. `/var/lib/cmm/covers` |

`SITE_URL` yang dibiarkan `localhost` akan membuat `sitemap.xml` dan
`robots.txt` menunjuk ke alamat mesin itu sendiri. Aplikasi sengaja tidak
melempar galat bila nilainya kosong, jadi kesalahan ini tidak terlihat sampai
sitemap dibuka — periksa setelah deploy.

`COVER_DIR` di luar folder aplikasi membuat sampul selamat saat folder
aplikasi diganti pada deploy berikutnya. Folder ini harus bisa ditulis proses
Node.

## Langkah deploy

```bash
cd app
npm ci                     # memasang persis versi di package-lock.json
npm run db:migrate         # aman dijalankan berulang
npm run db:create-admin -- --email admin@domain-klien.com
npm run build
npm start
```

`npm ci` — bukan `npm install` — supaya versi yang terpasang di server sama
persis dengan yang diuji di lokal.

Akun admin dibuat **sekali**. Menjalankannya lagi untuk email yang sudah ada
akan ditolak; itu disengaja.

## Build id deterministik

`next.config.mjs` mengunci `generateBuildId` ke hash `package-lock.json`.
Dua build dari dependensi yang sama menghasilkan id yang sama, sehingga
build ulang saat server lama masih hidup tidak memaksa setiap pengunjung
mengunduh ulang seluruh aset. Build id berubah hanya ketika dependensi
berubah.

## Memperbarui versi yang sudah berjalan

Deploy ulang tidak menghapus sampul **asal** `COVER_DIR` menunjuk ke luar
folder aplikasi. Tanpa itu, sampul yang ditulis ke `storage/covers` di dalam
folder aplikasi ikut terhapus saat folder diganti.

Urutan yang aman:

```bash
git pull
cd app
npm ci
npm run build
# baru hentikan proses lama dan jalankan yang baru
```

## Setelah deploy — daftar periksa

1. `/` dan seluruh route publik menjawab 200.
2. `/admin` mengarah ke `/admin/login` (307) saat belum punya sesi.
3. `/sitemap.xml` memuat **domain produksi**, bukan `localhost`.
4. Login admin berhasil, lalu tambah satu buku uji beserta sampulnya.
5. Buku uji tampil di `/katalog/telah-terbit` dan `/buku/<slug>`.
6. `/covers/<berkas>` menyajikan sampul yang baru diunggah — bukan 404.
7. Restart proses, lalu pastikan buku uji **masih ada** dan sampulnya masih
   tampil (membuktikan `COVER_DIR` tidak berada di folder sementara).
8. Hapus buku uji setelah selesai.

## Troubleshooting

**`Turbopack is not supported on this platform ... native bindings are not
available`** — Node gagal memuat `@next/swc-*\.node`. Di Windows ini biasanya
bukan masalah proyek melainkan kebijakan **Smart App Control / WDAC** yang
memblokir berkas `.node` di folder yang belum dikenal (gejalanya:
`ERR_DLOPEN_FAILED`, "An Application Control policy has blocked this file").
Coba `npm rebuild @next/swc-win32-x64-msvc`, atau pindahkan proyek ke folder
yang sudah dipercaya kebijakan. Di Linux umumnya tidak terjadi.

**`GLIBC_2.29 not found` lalu `Cannot find module '...next.config'`** — server
memakai glibc lebih tua dari 2.29, sehingga `@next/swc-linux-x64-gnu` tidak
bisa dimuat. Next lalu jatuh ke SWC **WASM**, dan Turbopack tidak bisa jalan
dengan WASM. Karena itu `npm run build` di repo ini sudah memakai webpack
(`next build --webpack`), yang berjalan dengan SWC WASM. Tidak ada yang perlu
diubah di panel hosting — biarkan perintah build tetap `npm run build`.

Kalau ingin memakai Turbopack (lebih cepat, tetapi menuntut SWC native),
jalankan `npm run build:turbopack` di mesin yang glibc-nya 2.29 atau lebih
baru.

Tiga hal yang sudah disiapkan di repo supaya jalur ini benar:

- **Konfigurasi bernama `next.config.mjs`, bukan `next.config.ts`.** Next hanya
  men-transpilasi `next.config.ts` lewat SWC sebelum menjalankannya. Di server
  yang SWC native-nya gagal dimuat, transpilasi itu berakhir dengan
  `ERR_MODULE_NOT_FOUND` yang menunjuk ke `<hash>.next.config` — berkas yang
  tidak pernah ada. Berkas `.mjs` tidak melewati jalur itu sama sekali, jadi
  jenis kegagalan tersebut tidak bisa terjadi. Tipe tetap terjaga lewat JSDoc
  (`@type {import("next").NextConfig}`). Jangan mengganti namanya kembali ke
  `.ts`.
- `postcss.config.mjs` memuat `@tailwindcss/postcss`. Webpack memproses CSS
  lewat PostCSS, sedangkan konfigurasi `turbopack.rules` hanya dibaca
  Turbopack. Tanpa berkas ini build **berhasil** tetapi CSS-nya keluar mentah:
  tidak ada satu pun kelas utilitas Tailwind, sehingga halaman tampil tanpa
  gaya dan tanpa galat apa pun.
- `generateBuildId` memakai `process.cwd()` + `package-lock.json`. `next build`
  dan `next start` dijalankan dari folder aplikasi, jadi nilainya sama di
  kedua jalur build.

Cek cepat setelah build: `npx next start`, buka situs, dan pastikan tata
letaknya benar — bukan sekadar "build sukses".

**`Access denied for user 'root'@'127.0.0.1' (using password: NO)`** — aplikasi
memakai nilai contoh dari `.env.example`, bukan kredensial hosting. `root` tidak
pernah ada di hosting (user di sana selalu berprefiks, mis. `u982783321_admin`),
dan `using password: NO` berarti `DB_PASSWORD` kosong.

Penyebab yang paling sering: **berkas `.env` di panel tertimpa setiap deploy**,
karena isinya berasal dari repo dan repo hanya memuat `.env.example`. Periksa
dengan membuka `.env` di panel setelah deploy — kalau isinya sama dengan
`.env.example`, itu buktinya.

Dua cara memperbaiki, pilih salah satu:

1. **Environment Variables di panel** (dianjurkan). Isi `DB_HOST`,
   `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `SITE_URL`, `COVER_DIR` di
   menu Environment Variables, bukan di berkas. Panel akan menyuntikkannya
   sebagai environment proses setiap kali aplikasi dijalankan.
2. **Berkas `.env` yang tidak tertimpa.** Letakkan di luar folder yang
   diganti saat deploy, atau hapus `.env.example` dari salinan deploy. Cara ini
   rapuh — setiap deploy bisa mengembalikannya.

Untuk memastikan nilai mana yang benar-benar terbaca, pesan galat di layar
login menyebutkan nama user yang dipakai driver. Kalau tertulis `'root'`,
belum ada satupun variabel panel yang masuk.

**`connect ECONNREFUSED 127.0.0.1:3306`** — MySQL belum jalan, atau kredensial
di environment salah. Tes integrasi memakai database sungguhan, jadi galat ini
juga muncul saat `npm test` bila MySQL mati.

**Sampul 404 setelah deploy** — `COVER_DIR` menunjuk ke folder yang ikut
diganti, atau proses Node tidak punya izin tulis ke folder itu.

**`npm ci` menolak karena lockfile tidak sinkron** — `package.json` diubah
tanpa menjalankan `npm install` di lokal. Jalankan `npm install`, commit
`package-lock.json` yang baru, lalu ulangi.
