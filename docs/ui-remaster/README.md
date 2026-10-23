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

Pratinjau di lingkungan ini berjalan di dua alamat, `:3000` dan `:3005`.
Alamat kedua disediakan karena peramban yang pernah membuka alamat pertama
bisa masih memegang dokumen lama; origin berbeda berarti cache-nya kosong.

Alasannya bukan selera: `next dev` menyajikan CSS dengan **nama berkas yang
selalu sama** (`app_globals_css_<tetap>.css`) dan header cache `immutable`.
Kalau berkas itu pernah termuat sebelum penyuntingan, peramban akan terus
memakai salinan lamanya dan halaman tampil tanpa sebagian gaya. Build
produksi memberi nama berkas berdasarkan isi (`css/c51bda….css`), jadi versi
baru selalu punya URL baru.
