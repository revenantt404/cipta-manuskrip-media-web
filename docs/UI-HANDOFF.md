# UI Handoff — CV Cipta Manuskrip Media

Panduan untuk melanjutkan **desain visual** di Arena.ai (Agent Mode). Dokumen ini
menjelaskan apa yang boleh diubah, apa yang tidak boleh, dan cara memverifikasi
bahwa perombakan tidak merusak fungsi yang sudah terbukti.

Ditulis untuk dua pembaca sekaligus: kamu (pemilik proyek) dan agen AI di Arena
yang membacakan dokumen ini sebelum menyentuh kode. Bagian "Instruksi untuk agen
Arena" bisa disalin apa adanya sebagai prompt.

---

## 1. Status repo dan batas tanggung jawab

| | |
|---|---|
| Repo | `github.com/revenantt404/cipta-manuskrip-media-web` — **wajib privat** (berisi materi klien). Status visibilitas belum diperiksa ulang dari mesin ini; pastikan **Settings → General → Danger Zone → Change visibility** menunjukkan Private sebelum memberi akses ke pihak lain |
| Branch | `master` |
| Fase selesai | Fase 1 (fondasi + MySQL), Fase 2 (admin), Fase 3 (alur publik) |
| Yang belum | Fase 4: push, deployment, dan dokumen admin |
| Stack | Next.js 16.4.2 · React 19.3.0 · TypeScript 5.9.3 · Tailwind CSS v4 · MySQL 8.4 |
| Pekerjaan UI | **belum dimulai** — yang ada kerangka fungsional sederhana |

**Batas yang ditetapkan brief §11 dan §14:** perombakan UI di Arena hanya
menyentuh **komponen presentasi, CSS/token, dan layout**. Kontrak data,
validasi, keamanan, alur data, dan perilaku cache **tidak boleh berubah**.

Alasannya bukan estetika: hal-hal itu sudah diverifikasi lewat tes otomatis dan
verifikasi HTTP terhadap build produksi. Mengubahnya di tahap desain berarti
membuang bukti yang sudah ada.

---

## 2. Memulai di Arena Agent Mode

### Yang perlu disiapkan

1. **Repo harus sudah ada di GitHub.** Arena meng-clone dari GitHub; ia tidak
   bisa mengambil folder lokal. Lihat §6 untuk urutan push.
2. **Akses GitHub.** Connect GitHub di Arena, lalu beri akses hanya ke repo
   `cipta-manuskrip-media-web`. Jangan beri akses ke seluruh organisasi.
3. **Database yang bisa dijangkau dari internet** — opsional, tetapi tanpa ini
   halaman katalog tidak bisa di-preview. Lihat §3.

### Alur kerja Arena (Agent Mode + GitHub Connector)

Arena meng-clone repo ke sandbox, mengedit, menjalankan perintah bash, dan
mengembalikan hasilnya sebagai **pull request**. Setiap sesi = satu PR.

Praktisnya: kamu tetap menjadi gerbang terakhir. Tidak ada perubahan yang masuk
`master` tanpa kamu setujui.

---

## 3. Batasan terpenting: database tidak ikut

**Ini sumber kegagalan yang paling sering terjadi saat handover.**

Arena hanya menerima **kode** dari GitHub. Tidak ada database, tidak ada sampul
yang sudah diunggah, tidak ada akun admin. Konsekuensinya:

| Halaman | Tanpa database |
|---|---|
| `/`, `/publish-jurnal`, `/publish-jurnal/kirim-artikel`, `/publish-jurnal/asistensi`, `/tentang-kami` | ✅ Tampil penuh — halaman statis |
| `/katalog/telah-terbit`, `/katalog/segera-terbit` | ⚠️ Tampil, tetapi isinya pesan galat database |
| `/publish-buku` | ⚠️ Kerangka tampil; kedua preview menampilkan pesan galat |
| `/buku/[slug]` | ⚠️ Tampil, tetapi berisi pesan "Buku sedang tidak dapat dimuat" — bukan halaman buku. (404 hanya muncul bila database hidup dan slug-nya memang tidak ada) |
| `/admin/*` | ❌ Dialihkan ke halaman masuk; tidak ada akun admin |

**Tiga pilihan**, dari termudah ke tersulit:

1. **Kerjakan UI halaman statis lebih dulu.** Beranda, tiga halaman jurnal, dan
   tentang-kami bisa dirombak penuh tanpa database. Ini yang paling tidak
   berisiko dan sudah cukup untuk sebagian besar pekerjaan desain.
2. **Beri agen akses ke database uji.** Perlu MySQL yang bisa dijangkau dari
   sandbox Arena (tunnel seperti ngrok/Cloudflare Tunnel, atau database terkelola),
   lalu isi `.env.local` di sandbox dengan kredensialnya. **Jangan pernah**
   menempelkan kredensial produksi ke chat.
3. **Minta agen hanya mengubah komponen**, denganmu yang menjalankan dan
   memverifikasi secara lokal. Paling aman untuk data, paling tidak nyaman untuk
   iterasi.

Untuk merombak tampilan katalog dan kartu buku tanpa database, agen bisa
mengandalkan `app/components/BookCard.tsx` — komponennya murni dan menerima props,
jadi bisa dirender dengan data contoh di dalam tes, tanpa menyentuh MySQL.

---

## 4. Peta berkas: apa yang aman diubah

**Semua path di dokumen ini relatif terhadap akar repo.** Proyek Next-nya ada di
dalam folder `app/`, jadi berkas Next.js selalu dimulai dengan `app/app/`,
`app/components/`, `app/lib/`, dan seterusnya — `app/` pertama adalah folder
proyek, `app/` kedua adalah direktori `app` milik Next.

### Boleh diubah bebas (lapisan presentasi)

| Berkas | Isi |
|---|---|
| `app/app/globals.css` | **Token warna brief §4** dan seluruh styling Tailwind v4 |
| `app/app/(publik)/layout.tsx` | Header + `<main>` + footer, kerangka semua halaman publik |
| `app/app/(publik)/page.tsx` | Beranda |
| `app/app/(publik)/publish-buku/page.tsx` | Halaman layanan buku |
| `app/app/(publik)/publish-jurnal/**` | Tiga halaman jurnal |
| `app/app/(publik)/tentang-kami/page.tsx` | Profil perusahaan dan kontak |
| `app/app/(publik)/katalog/[status]/page.tsx` | Katalog — **boleh diubah tampilannya, bukan alur datanya** |
| `app/app/(publik)/buku/[slug]/page.tsx` | Detail buku — idem |
| `app/app/not-found.tsx` | Halaman 404 berbahasa Indonesia — boleh dirombak tampilannya |
| `app/app/layout.tsx` | Kerangka dokumen dan font — jangan hapus `metadata = metadataSitus()` |
| `app/components/*.tsx` | Seluruh komponen presentasi |

Panel admin (`app/app/admin/**`) **juga boleh didesain**, tetapi di sesi
terpisah dari halaman publik. Bukan karena teknis: panelnya punya aturan sendiri
(`requireAdmin` di layout, `noindex`, form dengan `useActionState`), dan
menumpuk kedua lingkup dalam satu sesi membuat PR terlalu besar untuk ditinjau.

### Jangan diubah tanpa alasan kuat

| Berkas | Kenapa |
|---|---|
| `app/content/site.ts` | Teks dikunci brief. **Placeholder `[...]` wajib tetap placeholder** sampai klien mengirim materinya |
| `app/lib/whatsapp.ts` | Nomor dan kalimat pesan dikunci brief §10, persis, termasuk titik akhir dan huruf kecil di awal |
| `app/lib/books/status.ts` | Heading katalog dan empty state dikunci brief §9 (`Belum ada buku yang diterbitkan.` dan `Belum ada buku yang segera terbit.`) |
| `app/lib/site-metadata.ts` | `metadataBase` dari `SITE_URL` |
| `app/lib/env.ts` | Validasi environment |

### Jangan disentuh sama sekali

| Berkas / folder | Kenapa |
|---|---|
| `app/lib/books/`, `app/lib/auth/`, `app/lib/db/`, `app/lib/storage/`, `app/lib/validation/` | Logika bisnis, keamanan, akses data |
| `app/app/admin/**/actions.ts`, `form-state.ts` | Server Actions + kontrak form |
| `app/app/covers/[berkas]/route.ts` | Penyaji sampul, memuat penjagaan path traversal |
| `app/db/migrations/*.sql` | Skema database |
| `app/tests/`, `*.test.ts(x)` | Bukti verifikasi. **Kalau tes harus diubah agar lolos, itu tandanya perombakan merusak perilaku** |
| `.env.local` | Kredensial nyata; ter-ignore dan tidak pernah masuk repo. `.env.example` boleh disunting bila ada variabel baru — ia tidak berisi rahasia |

---

## 5. Aturan yang tidak boleh rusak

Ini bukan preferensi desain. Melanggarnya berarti merusak sesuatu yang sudah
diverifikasi.

### 5.1 Placeholder klien harus tetap jujur

Materi klien belum ada. Yang sekarang tampil adalah penanda kurung siku seperti
`[Nama paket dari klien]`. **Jangan menggantinya dengan data karangan** — tidak
ada harga, nama paket, statistik, testimoni, logo mitra, atau dokumen legalitas
yang boleh dibuat-buat (brief §3). Mengganti placeholder dengan contoh demi
"supaya desainnya kelihatan bagus" adalah pelanggaran, bukan peningkatan.

### 5.2 Teks yang dikunci brief

Pemeriksaannya lewat tes, tetapi ketahuinya supaya tidak dikira kelalaian:

- Nav header **hanya** Beranda dan Tentang Kami (§9). Tautan layanan ada di footer.
- 13 fasilitas jurnal, urutan dan ejaannya persis, termasuk `revisi minor–mayor`
  dengan **en dash** (`–`), bukan tanda hubung.
- Tiga kategori jurnal, dengan `SINTA 1–4` memakai en dash.
- Kalimat WhatsApp: `ini naskah artikel saya, admin.` dan
  `saya mau dibantu asistensi artikel topik [topik].` **berakhir titik**;
  `Mau pesan buku cetak judul [judul]` **tidak**. Ejaan `ebook` tanpa tanda hubung.
  Asistensi **buku** memakai `Saya mau dibantu asistensi buku topik [topik].` —
  huruf awal besar, dan kata `buku`, bukan `artikel`. Kalimat itu tidak berasal
  dari brief (brief hanya mengunci asistensi artikel); bentuknya dipilih pemilik
  proyek, dan perbedaannya dengan versi jurnal disengaja.
- Nomor tampil `0896-7189-4900` (buku) dan `0895-6292-03142` (jurnal); bentuk
  `wa.me` masing-masing `6289671894900` dan `62895629203142`.

### 5.3 Tepat satu `<main>` per dokumen

Layout `(publik)` memiliki `<main>`. Setiap halaman di dalam grup itu memakai
`<div>` sebagai pembungkus terluar. Kalau sebuah halaman mengembalikan `<main>`
sendiri, dokumen punya dua landmark dan HTML-nya tidak sah. Ada tes yang
menguncinya (`app/tests/acceptance-fase-3.test.tsx`, blok "Ruling AF") — tetapi tes
itu merender layout di sekeliling `/publish-buku` saja, jadi halaman lain harus
tetap diperiksa mata saat dirombak.

Admin punya aturan yang sama di lingkupnya sendiri: layout `(terlindungi)`
memiliki `<main>`, dan halaman anaknya (`/admin`, `/admin/buku`,
`/admin/buku/tambah`, `/admin/buku/[id]/edit`) tidak merender `<main>` kedua.
`/admin/login` berada di luar grup itu dan memang punya `<main>` sendiri — itu
benar, jangan diseragamkan.

### 5.4 Header/footer tidak boleh bocor ke admin

Admin berada di luar route group `(publik)` dengan sengaja. Jangan memindahkan
halaman admin ke dalam grup, dan jangan memasang header publik di layout root —
kalau dipasang di root, panel admin ikut memakainya.

### 5.5 `force-dynamic` pada halaman yang membaca database

Halaman-halaman ini **wajib** tetap punya `export const dynamic = "force-dynamic"`:

- `app/app/(publik)/katalog/[status]/page.tsx`
- `app/app/(publik)/buku/[slug]/page.tsx`
- `app/app/(publik)/publish-buku/page.tsx`
- `app/app/covers/[berkas]/route.ts`
- `app/app/sitemap.ts`
- `app/app/admin/(terlindungi)/layout.tsx` — satu deklarasi di sini membuat
  **seluruh** halaman anaknya dinamis. Tiga anaknya (`/admin`, `/admin/buku`,
  `/admin/buku/[id]/edit`) mengulang deklarasinya sendiri; `/admin/buku/tambah`
  tidak, dan tetap dinamis karena layout. Yang wajib dipertahankan adalah milik
  layout — sisanya boleh ada.

Halaman statis (`/`, `/publish-jurnal/*`, `/tentang-kami`, `/admin/login`)
**tidak** memakai `force-dynamic` dan tidak boleh diberi — itu mematikan
prarender yang justru diinginkan. Jangan tertukar dengan halaman anak admin:
berkas halaman itu tidak mendeklarasikan `force-dynamic`, tetapi routenya tetap
dinamis karena layout `(terlindungi)` di atasnya. Tabel route hasil
`npm run build` adalah cara memastikannya (`○` statis vs `ƒ` dinamis).

Tanpa itu, Next.js membekukan hasil query saat build: buku baru tidak muncul,
sampul baru 404, sampai server dijalankan ulang. Ini pernah terjadi di Fase 2 —
kelas bug yang sama, dan sudah didokumentasikan di `docs/PROGRESS.md`.

### 5.6 `cacheComponents` harus tetap `false`

`app/next.config.ts` menyetel `cacheComponents: false`. Dengan nilai bawaan
(`true`) di Next 16.4.2, route segment config ditolak saat build dan halaman yang
membaca database gagal di-prerender.

### 5.7 Pagination dan pemisahan status milik database

`listBooks({ status, page, pageSize })` adalah satu-satunya sumber daftar buku.
Jangan memotong daftar di JavaScript atau mengambil semua baris lalu
memfilter di komponen — urutan A–Z, batas 12 per halaman, dan pemisahan
`published`/`upcoming` semuanya berasal dari query.

### 5.8 Topik asistensi tidak pernah dikirim ke server

`FormAsistensi` hanya membentuk URL WhatsApp di browser. Tidak ada `fetch`,
tidak ada Server Action, tidak ada penyimpanan. Jangan menambahkan.

Komponen yang sama dipakai di dua tempat dengan prop `jenis`:

| Halaman | `jenis` | Label input | Nomor tujuan |
|---|---|---|---|
| `/publish-buku` (`#asistensi`) | `"buku"` | `Topik Asistensi Penulisan Buku` | `6289671894900` |
| `/publish-jurnal/asistensi` | `"jurnal"` | `Topik Asistensi Penulisan Artikel Jurnal Ilmiah` | `62895629203142` |

Label itu dikunci tes, dan id inputnya berbeda (`topik-buku` / `topik-jurnal`)
supaya `<label for>` tidak pernah menunjuk kotak yang salah kalau kelak kedua
form tampil di halaman yang sama.

### 5.9 `tel:` dan `wa.me` bukan hal yang sama

Halaman tentang-kami memakai `tel:` untuk nomor tampil. Pesan WhatsApp memakai
`wa.me`. Keduanya sengaja berbeda; jangan menyatukan.

### 5.10 ISBN dan harga punya aturan tampil sendiri

Katalog ini dipakai untuk pengajuan ke Perpusnas, jadi tampilannya mengikuti
status buku:

- **Telah terbit** — kartu dan halaman detail menampilkan ISBN, harga buku
  cetak, dan sewa ebook, plus dua tombol WhatsApp: **Beli Buku Cetak** dan
  **Sewa Ebook**.
- **Segera terbit** — baris ISBN berbunyi `Segera terbit`; **tidak ada** harga
  maupun tombol pesan sama sekali. Bukan harga `-`, bukan tombol nonaktif:
  barisnya tidak dirender.
- **Belum ditetapkan** (sudah terbit, tetapi admin belum mengisi) — tampil `-`,
  bukan `Rp0`. Nol berarti gratis, dan itu klaim yang salah.

Aturannya hidup di `app/components/BookCard.tsx`, `app/components/BookDetail.tsx`,
dan `app/lib/books/price.ts`. Boleh diubah tampilannya (urutan baris, warna,
tipografi), tetapi **kondisi mana yang dirender** tidak boleh berubah — ada tes
komponen yang menguncinya.

Format angka memakai `formatRupiah()`; jangan menyusun `"Rp" + angka` sendiri.
`Intl` mengeluarkan spasi tak-terlihat setelah `Rp` yang sudah dibuang fungsi
itu, dan pemisah ribuan Indonesia harus titik.

Tombol admin untuk ISBN dan kedua harga **dinonaktifkan** saat status
`segera terbit` di `app/app/admin/(terlindungi)/buku/FormBuku.tsx`. Server tetap
menolaknya lewat validator meski HTML disunting — penonaktifan di browser hanya
membantu admin, bukan pengaman.

### 5.11 `<main>` di halaman 404

`app/app/not-found.tsx` berada di akar `app/`, di luar grup `(publik)`, jadi ia
**tidak mewarisi** layout publik dan harus merender `<main>` sendiri beserta
header dan footer. Kalau kelak halaman ini dipindah ke dalam `(publik)`, `<main>`
miliknya harus dihapus. Halaman ini juga menangkap alamat yang tidak cocok
dengan route mana pun, bukan hanya `notFound()` dari dalam halaman.

---

## 6. Urutan handover yang benar

**Jangan impor ke Arena sebelum langkah 1–4 selesai.**

```
1. Tutup Fase 3            → review akhir, working tree bersih
2. Kerjakan Fase 4         → docs/ADMIN-GUIDE.md, bersih-bersih
3. Push ke GitHub          → repo privat, atas instruksi pemilik
4. Verifikasi clone bersih → clone ke folder baru, ikuti README, pastikan build lolos
5. Impor ke Arena          → connect GitHub, pilih repo + branch master
```

**Semua perintah npm dijalankan dari `app/`, bukan dari akar repo.** Tidak ada
`package.json` di akar; yang ada di `app/`. Kesalahan ini menghasilkan
`ENOENT: package.json` yang membingungkan kalau tidak disebutkan.

Langkah 4 bukan formalitas. Repo yang hanya pernah dibuka di satu mesin sering
menyimpan ketergantungan tersembunyi — berkas yang ter-ignore padahal dibutuhkan,
atau nilai environment yang tertinggal di shell. Clone bersih yang berhasil
`npm install && npm test && npm run build` adalah bukti bahwa handover-nya nyata.

### Yang TIDAK ikut pindah lewat GitHub

| Tidak pindah | Cara menyiapkannya di tempat baru |
|---|---|
| Isi database | Jalankan `npm run db:migrate`, lalu isi data lewat panel admin |
| Akun admin | `npm run db:create-admin -- --email ...` |
| Berkas sampul | Ikut diunggah ulang lewat panel admin — `storage/` ter-ignore |
| `.env.local` | Salin dari `.env.example`, isi nilainya |
| Dokumen legal (PDF perjanjian) | Disimpan terpisah oleh pemilik; sengaja tidak di repo |

---

## 7. Instruksi untuk agen Arena

Salin blok berikut sebagai prompt awal. Ganti bagian `[...]` sesuai kebutuhan.

> Kamu bekerja pada repo Next.js 16.4.2 (App Router, TypeScript strict, Tailwind
> CSS v4) milik CV Cipta Manuskrip Media, sebuah penerbit buku. Tugasmu **hanya
> merombak lapisan presentasi**: komponen di `app/components/`, halaman di
> `app/app/(publik)/`, dan token di `app/app/globals.css`.
>
> **Jangan mengubah** `app/lib/**`, `app/app/admin/**`, `app/content/site.ts`,
> `app/db/migrations/**`, atau berkas tes mana pun. Kalau sebuah tes gagal
> setelah perubahanmu, perbaiki perubahanmu — jangan tesnya.
>
> (Panel admin boleh didesain, tetapi **bukan di sesi ini** — lihat §4. Hapus
> larangan `app/app/admin/**` di atas hanya bila sesi memang khusus admin.)
>
> **Aturan yang mengikat:**
> - `export const dynamic = "force-dynamic"` wajib tetap ada di halaman katalog,
>   detail buku, publish-buku, covers, sitemap, dan admin.
> - Layout `(publik)` memiliki satu-satunya `<main>`; halaman di dalamnya memakai
>   `<div>` sebagai pembungkus terluar.
> - Teks di `app/content/site.ts` dikunci brief. Placeholder seperti
>   `[Nama paket dari klien]` harus **tetap** seperti itu — jangan diganti data
>   karangan apa pun (harga, statistik, testimoni, logo, legalitas).
> - Nomor dan kalimat WhatsApp di `app/lib/whatsapp.ts` tidak boleh diubah.
> - Token warna brief §4 ada di `globals.css`; boleh ditambah, jangan dihapus
>   tanpa alasan.
> - `next/image` belum dipasang (tes mengunci `src` mentah). Kalau mau
>   memakainya, ubah tesnya di PR yang sama dan jelaskan alasannya.
> - `cacheComponents` di `next.config.ts` harus tetap `false`.
>
> **Sebelum menyatakan selesai, jalankan:** `npm run build` **lalu**
> `npm run lint && npm run typecheck`. Urutannya bukan selera: `LayoutProps`
> dihasilkan `next build`, jadi typecheck sebelum build di clone baru gagal
> dengan `Cannot find name 'LayoutProps'`. Laporkan hasilnya apa adanya.
> `npm test` butuh MySQL yang sedang berjalan — kalau tidak tersedia, laporkan
> tes mana yang tidak dijalankan, jangan diam-diam melewatinya.

---

## 8. Checklist regression

Jalankan setelah setiap PR desain. Kolom kanan adalah cara termurah
memverifikasinya.

### Otomatis

| Perintah | Yang dijamin |
|---|---|
| `npm run lint` | Tidak ada pelanggaran ESLint |
| `npm run typecheck` | Tipe konsisten; terutama menangkap props komponen yang berubah |
| `npm run build` | Seluruh route bisa dibangun; tabel route keluar tanpa galat |
| `npm test` | 40 berkas tes, sebagian butuh MySQL. **Menghapus data:** `DELETE FROM books` di 8 berkas dan `DELETE FROM admin_users` di 5 berkas — termasuk `app/tests/acceptance-fase-2.test.tsx` dan `app/app/admin/actions.test.ts`. Jangan pernah arahkan `DB_NAME` ke database berisi data sungguhan |

### Manual — halaman publik

| # | Periksa | Cara |
|---|---|---|
| 1 | Header hanya Beranda + Tentang Kami | Buka `/`, hitung tautan di header |
| 2 | Footer memuat Publish Buku + Publish Jurnal | Scroll ke bawah |
| 3 | Tepat satu `<main>` per halaman | DevTools → cari `<main>` |
| 4 | Tautan anchor `#paket` dan `#asistensi` menggulir ke section-nya | `/publish-buku`, klik dua tombol di bawah headline |
| 5 | WhatsApp jurnal: 3 tautan, pesan berakhir titik | `/publish-jurnal/kirim-artikel`, klik kanan → salin tautan |
| 6 | Asistensi: topik kosong ditolak, topik berisi membentuk pesan | `/publish-jurnal/asistensi` dan `/publish-buku` (§`asistensi`) — label keduanya berbeda, nomor tujuannya juga |
| 7 | Detail buku: status published → tombol pesan; upcoming → estimasi, tanpa tombol | Butuh dua buku nyata |
| 8 | Placeholder masih placeholder | `/publish-buku`, `/publish-jurnal`, `/tentang-kami` |
| 9 | Admin tidak memakai header/footer publik | `/admin/login` |

### Manual — alur admin → publik

Butuh database + akun admin. Lakukan **pada build produksi**
(`npm run build && npm run start`), bukan `next dev`: di dev semua halaman
selalu dirender ulang, sehingga `force-dynamic` yang hilang tidak terlihat
gejalanya. Justru di build produksi-lah halaman tanpa deklarasi itu dibekukan,
dan bug "buku baru tidak muncul" muncul. Yang dibuktikan pemeriksaan ini adalah
**jalur data** — baris yang baru ditulis terbaca oleh halaman publik — bukan
pengusiran cache: ketiga halaman katalog/detail sudah `force-dynamic`, jadi
`revalidatePath` di sana hanya membersihkan cache router sisi klien, bukan
hasil beku di server.

| # | Langkah | Harapan |
|---|---|---|
| 1 | Tambah buku **published** dengan sampul | Muncul di `/admin/buku`, `/publish-buku`, `/katalog/telah-terbit`, `/buku/<slug>`, `sitemap.xml` — **tanpa restart** |
| 2 | Tambah buku **upcoming** | Muncul hanya di katalog/preview upcoming; detail tanpa tombol pesan |
| 3 | Ubah slug | Slug lama berstatus 404; slug baru tampil |
| 4 | Ganti sampul | Gambar baru muncul; berkas lama terhapus |
| 5 | Hapus buku | Hilang dari `/admin/buku`, `/publish-buku`, kedua katalog, dan `sitemap.xml`; `/buku/<slug>` jadi 404; berkas sampul terhapus |
| 6 | `robots.txt` | `Disallow: /admin` |
| 7 | `sitemap.xml` | Tanpa `/admin`, memuat buku kedua status, URL absolut |

---

## 9. Jebakan yang sudah pernah menggigit

Dicatat bukan untuk nostalgia — semuanya pernah benar-benar terjadi di proyek ini.

| Jebakan | Gejalanya | Cara menghindari |
|---|---|---|
| `public/` dibekukan saat boot | Sampul baru 404 sampai restart | Sampul disajikan `/covers/[berkas]`, **bukan** dari `public/` |
| Halaman DB tanpa `force-dynamic` | Buku baru tidak muncul di build produksi | Jangan hapus `export const dynamic` |
| Halaman lupa dibungkus `(terlindungi)` | Panel admin terbuka tanpa login | Setiap halaman admin baru masuk ke dalam grup itu |
| `next/font/google` di Vitest | `Geist is not a function` | Metadata dipisah ke fungsi murni di `lib/site-metadata.ts` |
| Membandingkan slug sebagai substring | Tes lolos padahal salah — slug baru memuat slug lama sebagai awalan | Bandingkan tautan utuh (`/buku/<slug>"`) |
| Tailwind v4 tanpa config | `tailwind.config.*` tidak ada | Semua token di `@theme inline` dalam `globals.css` |
| `metadataBase` kosong | Build hanya memberi peringatan; `localhost:3000` bocor ke canonical | `SITE_URL` wajib diisi sebelum produksi |

---

## 10. Yang masih terbuka

Bukan tugas desain, tetapi memengaruhi tampilan final:

| Hal | Dampak ke UI |
|---|---|
| **Materi klien belum ada** | Tiga kartu paket, profil perusahaan, dokumen resmi, media sosial, bukti submission, logo indeksasi semuanya penanda kurung siku |
| **Domain belum dibeli** | `SITE_URL` masih `localhost`; canonical/OG memakai localhost |
| **`next/image` belum dipasang** | Sampul memakai `<img>` mentah; tes komponen mengunci `src`. Migrasi optimizer = perubahan kode + tes dalam satu PR |
| **Format `tel:` domestik** | Nomor ditautkan apa adanya (`tel:0895-…`), berfungsi di Indonesia, tidak dari luar negeri. Keputusan klien |
| **Versi MySQL di hosting belum diketahui** | MariaDB belum diuji |

---

## 11. Rujukan

| Dokumen | Isi |
|---|---|
| `app/README.md` | Install, env, perintah, struktur folder |
| `docs/PROGRESS.md` | Yang sudah selesai, bukti verifikasi, blocker |
| `docs/DESIGN-STACK.md` | Keputusan teknis dan alasannya |
| `docs/DATABASE-SETUP.md` | Menyiapkan MySQL |
| `PROJECT-BACKEND-FIRST.md` | Brief asli; §9–§11 mengikat UI |
