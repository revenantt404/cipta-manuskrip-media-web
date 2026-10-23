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

**Catatan penting soal isinya.** Tangkapan layar ini dibuat di mesin tanpa
MySQL, memakai data dan sampul *sementara* yang hanya hidup selama proses
pengambilan gambar: data itu disuntikkan lewat variabel lingkungan
`CMM_DEMO_FIXTURES=1`, tidak pernah masuk ke kode yang di-commit, dan tidak
pernah menulis apa pun ke database. Sampul buku di gambar adalah berkas
contoh yang dibuat untuk keperluan ini, bukan sampul terbitan sungguhan.

Karena itu, saat aplikasi dijalankan dari repo ini tanpa database, halaman
katalog menampilkan keadaan gagal-muat yang sudah dirancang — bukan kartu
buku contoh.
