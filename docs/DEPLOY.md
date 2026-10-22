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

`next.config.ts` mengunci `generateBuildId` ke hash `package-lock.json`.
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

**`connect ECONNREFUSED 127.0.0.1:3306`** — MySQL belum jalan, atau kredensial
di environment salah. Tes integrasi memakai database sungguhan, jadi galat ini
juga muncul saat `npm test` bila MySQL mati.

**Sampul 404 setelah deploy** — `COVER_DIR` menunjuk ke folder yang ikut
diganti, atau proses Node tidak punya izin tulis ke folder itu.

**`npm ci` menolak karena lockfile tidak sinkron** — `package.json` diubah
tanpa menjalankan `npm install` di lokal. Jalankan `npm install`, commit
`package-lock.json` yang baru, lalu ulangi.
