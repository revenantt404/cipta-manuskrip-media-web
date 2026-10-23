# Pratinjau UI — remaster halaman publik

Tangkapan layar di folder ini merekam hasil perombakan tampilan supaya bisa
ditinjau tanpa menyalakan server.

| Berkas | Halaman | Lebar |
|---|---|---|
| `01-katalog-desktop.png` | `/katalog/telah-terbit` | 1440 |
| `03-detail-buku.png` | `/buku/[slug]` | 1440 |
| `05-404.png` | alamat tidak ditemukan | 1440 |
| `06-katalog-390.png` | `/katalog/telah-terbit` | 390 |
| `08-admin-form.png` | `/admin/preview/buku/tambah` | 1440 |
| `09-admin-daftar-390.png` | `/admin/preview/buku` | 390 |
| `11-beranda-hero.png` | beranda — hero | 1440 |
| `12-beranda-alur.png` | beranda — alur kerja | 1440 |
| `13-beranda-kontak.png` | beranda — kontak | 1440 |
| `14-navbar-kaca.png` | navbar kaca saat halaman digulir | 1440 |

**Navbar.** Bentuknya tetap pita membulat yang mengambang di tengah seperti
desain awal; yang berubah bahannya. Header menempel di atas
(`position: sticky`) dan panelnya ber-`backdrop-filter: blur(18px)
saturate(165%)`, jadi konten yang lewat di belakangnya terlihat diburamkan.

**Catatan penting soal isinya.** Tangkapan layar ini dibuat di mesin tanpa
MySQL, memakai data dan sampul *sementara* yang hanya hidup selama proses
pengambilan gambar: data itu disuntikkan lewat variabel lingkungan
`CMM_DEMO_FIXTURES=1`, tidak pernah masuk ke kode yang di-commit, dan tidak
pernah menulis apa pun ke database. Sampul buku di gambar adalah berkas
contoh yang dibuat untuk keperluan ini, bukan sampul terbitan sungguhan.

Karena itu, saat aplikasi dijalankan dari repo ini tanpa database, halaman
katalog menampilkan keadaan gagal-muat yang sudah dirancang — bukan kartu
buku contoh.

**Soal gerak.** Animasi tidak terlihat pada tangkapan layar diam. Ringkasnya:
hero masuk berurutan, cincin orbit di belakang judul berputar pelan (cincin
tengah putus-putus dan berputar ke arah sebaliknya), bagian-bagian muncul saat
digulir, kartu terangkat saat hover, navbar kaca ikut menebal bayangannya saat
halaman digulir, dan seluruh gerak dimatikan bila sistem pengguna meminta
`prefers-reduced-motion`.

## Menjalankan pratinjau

Untuk melihat hasil seperti di gambar, jalankan mode produksi — bukan
`next dev`:

```bash
cd app
npm run build
npm run start -- --hostname 0.0.0.0 --port 3000
```

Pratinjau di lingkungan ini berjalan di tiga alamat, `:3000`, `:3005`, dan
`:3006`.
Alamat kedua disediakan karena peramban yang pernah membuka alamat pertama
bisa masih memegang dokumen lama; origin berbeda berarti cache-nya kosong.

Alasannya bukan selera: `next dev` menyajikan CSS dengan **nama berkas yang
selalu sama** (`app_globals_css_<tetap>.css`) dan header cache `immutable`.
Kalau berkas itu pernah termuat sebelum penyuntingan, peramban akan terus
memakai salinan lamanya dan halaman tampil tanpa sebagian gaya. Build
produksi memberi nama berkas berdasarkan isi (`css/c51bda….css`), jadi versi
baru selalu punya URL baru.

## Pesan WhatsApp

Semua tautan `wa.me` dibuat di satu tempat, `app/lib/whatsapp.ts`. Nilai yang
berubah-ubah — judul buku dan topik asistensi — diapit **tanda petik dua**,
supaya batas antara nilai dan kalimat pengantar tetap terbaca oleh admin.
Keputusan ini diambil pemilik proyek pada 23 Oktober 2026 dan berlaku untuk
keempat pembentuk pesan:

- `Mau pesan buku cetak judul "<judul>"`
- `Mau sewa ebook judul "<judul>"`
- `Saya mau dibantu asistensi buku topik "<topik>".`
- `saya mau dibantu asistensi artikel topik "<topik>".`

Perbedaan huruf awal `S`, ejaan `ebook`, dan titik akhir hanya pada pesan
asistensi tetap dipertahankan.

Pesan kirim naskah di `/publish-jurnal/kirim-artikel` juga mendapat baris
kedua berisi kategori kartu yang ditekan:

```
ini naskah artikel saya, admin.
Kategori jurnal: "Jurnal Internasional Index Copernicus"
```

Kalimat `ini naskah artikel saya, admin.` tetap utuh huruf demi huruf (huruf
awal kecil, berakhir titik) dan tanpa kategori ia kembali persis seperti dulu.

Sejak 24 Oktober 2026 **paket yang dipilih** di halaman Publish Buku ikut
dikirim sebagai baris kedua, dengan tanda petik dua yang sama:

```
Saya mau dibantu asistensi buku topik "Metodologi Penelitian".
Paket pilihan: "Paket Profesional - Rp4.500.000"
```

Baris pertama sengaja tidak berubah sedikit pun — hanya ada tambahan baris di
bawahnya. Pemilihan paket dan formulir membaca satu sumber yang sama lewat
`app/components/use-paket-terpilih.ts`, jadi ringkasan di atas formulir tidak
mungkin berbeda dengan yang terkirim. Tanpa paket terpilih, pesannya kembali
utuh seperti di atas. Formulir jurnal tidak memakai paket karena halaman
jurnal tidak punya tier harga.

## Rel lebar

Navigasi, banner beranda, panel halaman dalam, dan grid bagian beranda berhenti
di garis tepi yang sama. Sebelumnya banner beranda melebar sampai tepi jendela
(`max-width: 1460px`) sementara navbar hanya `1120px`, jadi keduanya tidak
pernah bertemu — paling kelihatan di layar 1440px.

Aturannya sekarang satu: isi selebar `1120px`, ditambah jarak tepi yang
mengikuti padding header (`24px`, `16px` di bawah 900px, `10px` di bawah
700px). Blok "REL LEBAR" di akhir `app/globals.css` menuliskan itu untuk
`.home-hero`, `.publish-page`, `.journal-page`, `.about-page`, `.katalog-page`,
`.detail-page`, `.notfound`, dan seluruh bagian beranda. Angka `max-width`
sengaja `1120 + 2 x jarak tepi`, supaya yang sejajar adalah tepi panel, bukan
isi di dalamnya.

Diverifikasi pada 1440, 1280, 1184, 1024, 900, 768, dan 390 piksel: tepi
`.site-nav` dan tepi panel di bawahnya selalu sama persis (mis. 1440 →
`160..1280`).

## Navigasi panel admin

Hanya satu butir menu yang boleh menyala, dan yang menang adalah alamat paling
spesifik. Sebelumnya aturannya `pathname === href` atau awalan untuk "Kelola
Buku", sehingga di `/admin/buku/tambah` kedua butir menyala bersamaan. Logika
itu kini berdiri sendiri di `app/components/admin-nav-state.ts` dengan tes
`admin-nav-state.test.ts`:

- `/admin/buku/tambah` → **Tambah Buku**
- `/admin/buku/12/edit` → **Kelola Buku**
- `/admin` → **Ringkasan**

Nomor `08-admin-form.png` di atas sudah diperbarui dengan keadaan setelah
perbaikan.

## Efek kartu paket terpilih

Kartu tier yang ditekan diberi tiga lapis umpan balik, semuanya CSS:

1. **cincin komet** — gradien conic 3px yang berputar 5,4 detik sekali di
   tepi kartu, dengan ekor memudar supaya arah putarannya terbaca;
2. **alas diam** — gradien kedua di bawah komet, jadi tepi kartu tetap
   terbaca di bagian yang tidak sedang dilewati cahaya;
3. **halo** — bayangan lime yang berdenyut 4,6 detik, ditambah "pop" 0,55
   detik saat kartu baru dipilih.

Cincin dibuat dengan `mask-composite: exclude` pada elemen semu, dan sudutnya
dianimasikan lewat `@property --cmm-paket-angle` agar gradien conic bisa
berputar mulus. Bila mask tidak didukung, `border-color` dan `box-shadow`
tetap memberi garis tepi; `forced-colors` mendapat `outline` sistem.

**Kenapa bukan three.js.** Yang diperlukan cuma garis tepi beberapa piksel.
WebGL menambah sekitar 170 KB JavaScript, satu konteks GPU per kartu, dan
kanvas yang harus ditumpuk di atas kartu — bebannya jauh melebihi hasilnya,
terutama di ponsel. Versi CSS ini nol dependensi, nol permintaan jaringan,
dan tetap tampil sebelum JavaScript jalan.

Dengan `prefers-reduced-motion: reduce`, semua animasi mati dan cincin diganti
gradien diam yang tetap terlihat.
