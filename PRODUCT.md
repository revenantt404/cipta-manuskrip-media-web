# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Penulis naskah buku** — dosen, penulis, dan masyarakat umum yang punya naskah
dan ingin menerbitkannya. Mereka datang untuk melihat paket, mengirim naskah,
atau meminta pendampingan penulisan.

**Akademisi dengan artikel jurnal** — dosen dan peneliti yang perlu menerbitkan
artikel di jurnal nasional terakreditasi atau internasional. Brief menetapkan
dosen sebagai audiens utama, tanpa menutup penulis dan masyarakat umum.

**Admin** — satu orang dari pihak CV Cipta Manuskrip Media. Pemilik CV mengisi
katalog sendiri setelah situs diserahkan; pengembang tidak menjadi operator
jangka panjang.

## Product Purpose

Situs layanan penerbitan CV Cipta Manuskrip Media: memperkenalkan dua layanan
(penerbitan buku dan publikasi artikel jurnal), menampilkan katalog buku yang
diterbitkan, dan mengarahkan calon penulis ke admin lewat WhatsApp.

Situs ini bukan toko. Tidak ada transaksi di dalamnya: tidak ada keranjang,
pembayaran, atau akun pengunjung. Setiap minat berakhir di percakapan WhatsApp
dengan admin.

**Ukuran keberhasilan yang disepakati pemilik proyek:** chat WhatsApp benar-benar
masuk, katalog terisi dan rapi, dan pemilik CV bisa mengelola buku tanpa
menghubungi pengembang lagi.

## Positioning

Satu penerbit untuk dua kebutuhan: naskah buku dan artikel jurnal ilmiah, dalam
satu tempat. Pembeda inilah yang dikonfirmasi pemilik proyek.

Situs tidak mengklaim keunggulan harga, kecepatan, atau jumlah terbitan — tidak
ada angka dari klien yang mendukungnya, dan brief melarang mengarang.

## Operating Context

- **Katalog dipakai sebagai rujukan untuk Perpusnas.** Karena itu ISBN wajib
  tampil pada buku terbit, dan buku berstatus "segera terbit" menampilkan status
  ISBN tanpa harga, sewa, atau pembelian.
- **WhatsApp adalah satu-satunya saluran tindak lanjut.** Dua nomor — satu untuk
  buku, satu untuk jurnal — masing-masing dengan kalimat pesan yang dikunci
  brief. Tidak ada formulir backend sebagai pengganti.
- **Admin mengelola buku saja.** Seluruh teks lain di situs adalah konten statis
  di `app/content/site.ts`, diubah lewat kode, bukan lewat panel.
- Katalog diisi klien sendiri setelah serah terima, dari panel admin.

## Capabilities and Constraints

**Dibangun dan terverifikasi:** katalog dua status dengan pagination server-side
12 buku per halaman dan urutan A–Z; detail buku per slug; preview katalog;
panel admin berlogin untuk tambah/ubah/hapus buku beserta sampulnya (diproses ke
WebP, sisi terpanjang maksimal 1600px); dan tombol WhatsApp di seluruh alur
layanan.

**Sengaja tidak ada** (brief §3 dan perjanjian kerja sama): akun member,
registrasi publik, pembayaran, keranjang, checkout, membaca buku di dalam situs,
unggah PDF e-book, pencarian atau filter katalog, notifikasi buku segera terbit,
CMS di luar buku, statistik, dan analytics.

**Constraint teknis yang membentuk pekerjaan berikutnya:**

- MySQL yang dikelola sendiri, tanpa ORM, tanpa BaaS. Otorisasi sepenuhnya di
  kode aplikasi; tidak ada RLS sebagai lapisan kedua.
- Hosting harus menyediakan proses Node.js yang hidup terus, MySQL, folder
  persisten untuk sampul, dan environment variable dari panel.
- Domain dan hosting wajib terdaftar atas nama CV Cipta Manuskrip Media agar
  kepemilikannya mutlak.
- Hosting belum dibeli. Situs belum pernah berjalan di luar komputer lokal.

## Brand Commitments

- Nama: **CV Cipta Manuskrip Media**. Bahasa antarmuka: Indonesia.
- Slogan: `Publikasi Semudah Beli Kopi.`
- Audiens utama dosen, tanpa menutup penulis dan masyarakat umum.
- Warna identitas dikunci brief §4 dan dipakai seperlunya: teal `#09677D`
  dengan lime `#C2CC08` sebagai aksen. Tombol teal berteks putih, tombol lime
  berteks gelap; teks lime di atas putih dilarang.
- Teks publik tertentu dikunci brief — headline tiap halaman, 13 fasilitas
  jurnal, dan tiga kategori jurnal — dan dijaga tes agar tidak berubah tak
  sengaja saat tampilan dirombak.

## Evidence on Hand

**Nyata dan boleh dipakai:**

- Nomor WhatsApp buku `0896-7189-4900` dan jurnal `0895-6292-03142`, beserta
  kalimat pesan yang ditentukan brief.
- 13 fasilitas jurnal dan tiga kategori jurnal, persis dari brief.
- Slogan dan headline tiap halaman, dikunci brief.
- Kode dan database nyata: katalog membaca MySQL, panel admin benar-benar
  menyimpan, dan seluruh alur sudah diverifikasi lewat HTTP.

**Belum ada dari klien — jangan diisi karangan:**

- Nama, harga, dan fasilitas tiga paket penerbitan buku.
- Logo, referensi desain, dan aset visual.
- Data dan sampul buku yang akan masuk katalog.
- Bukti submission jurnal dan logo indeksasi.
- Profil perusahaan, legalitas (NIB/NPWP), alamat surel, dan media sosial.
- Angka apa pun: jumlah terbitan, jumlah penulis, statistik keberhasilan,
  testimoni.

Katalog dimulai dari database kosong dan tidak pernah diisi buku fiktif.

## Product Principles

1. **Bukti di atas klaim.** Halaman hanya menyatakan yang bisa ditunjukkan.
   Tempat yang materinya belum ada diberi penanda jujur, bukan diisi contoh yang
   tampak seperti data sungguhan.
2. **Setiap jalan berakhir di WhatsApp.** Tidak ada formulir yang menampung
   naskah, tidak ada akun, tidak ada pembayaran. Tautan keluar adalah produknya.
3. **Katalog adalah rujukan, bukan etalase.** Urutan A–Z, ISBN tampil, tanpa
   filter, dan tanpa harga pada buku yang belum terbit.
4. **Klien harus bisa jalan sendiri.** Panel admin dan panduannya dinilai dari
   satu ukuran: apakah pemilik CV bisa menambah, mengubah, dan menghapus buku
   tanpa menghubungi pengembang.
5. **Fondasi tidak ikut berubah saat tampilan dirombak.** Data, validasi,
   otorisasi, dan perilaku cache punya kontrak yang dijaga tes; pekerjaan desain
   bergerak di lapisan presentasi saja.

## Accessibility & Inclusion

Brief §4 mewajibkan akses keyboard, focus state yang terlihat, dan responsivitas
dasar. Bahasa antarmuka Indonesia. Tidak ada kebutuhan aksesibilitas lain yang
ditetapkan klien.
