# Desain Teknis & Stack — Website CV Cipta Manuskrip Media

**Tanggal:** 19 Oktober 2026
**Status:** Menunggu persetujuan sebelum Fase 1 dikerjakan
**Menggantikan:** bagian 2, 5, 6, 7, 11, 12, 13, dan 14 pada `PROJECT-BACKEND-FIRST.md` — rinciannya di `docs/SPEC-AMENDMENT-01.md`

Dokumen ini menggantikan Supabase dengan MySQL sesuai keputusan pemilik proyek. Seluruh keputusan teknis di bawah ini diambil oleh pelaksana dan boleh dibatalkan pemilik proyek sebelum Fase 1 dimulai.

---

## 1. Apa yang dibangun

Situs layanan penerbitan untuk CV Cipta Manuskrip Media: lima halaman publik dan satu dashboard admin untuk mengelola buku.

**Publik (tanpa login):**

| Route | Isi |
|---|---|
| `/` | Beranda, headline "Publikasi Semudah Beli Kopi." |
| `/tentang-kami` | Profil, legalitas, kontak, media sosial |
| `/publish-buku` | 3 paket, asistensi penulisan, preview katalog |
| `/publish-jurnal` | Fasilitas, bukti submission |
| `/publish-jurnal/kirim-artikel` | 3 kategori jurnal → WhatsApp |
| `/publish-jurnal/asistensi` | Input topik → WhatsApp |
| `/katalog/telah-terbit` | Katalog A–Z, 12 per halaman |
| `/katalog/segera-terbit` | Katalog A–Z, 12 per halaman |
| `/buku/[slug]` | Detail buku + tombol WhatsApp |

**Admin (perlu login):**

| Route | Isi |
|---|---|
| `/admin/login` | Login email + password |
| `/admin` | Ringkasan + tautan pengelolaan buku |
| `/admin/buku` | Daftar buku |
| `/admin/buku/tambah` | Form tambah |
| `/admin/buku/[id]/edit` | Form edit + hapus |

**Yang tidak dibangun** (sesuai perjanjian kerja sama dan brief): akun member, registrasi publik, pembayaran online, cart, checkout, baca buku di dalam situs, upload PDF e-book, pencarian/filter katalog, notifikasi buku segera terbit, CMS selain buku, statistik, testimoni, atau data perusahaan yang belum tersedia dari klien.

---

## 2. Stack final

| Lapisan | Pilihan | Sumber keputusan |
|---|---|---|
| Framework | Next.js App Router + TypeScript strict mode | brief |
| Styling | Tailwind CSS | brief |
| Database | MySQL / MariaDB di hosting | keputusan pemilik proyek |
| Pemrosesan gambar | `sharp` — perbesar maksimum 1600px, kompres | brief |
| Mutasi data | Server Actions | brief |
| Akses data | SQL langsung + satu lapisan tipis `lib/db/` | keputusan pelaksana (§3) |
| Migrasi | file `.sql` bernomor di `db/migrations/` | keputusan pelaksana (§3) |
| Auth admin | Sesi sendiri, admin disimpan di database | keputusan pelaksana (§4) |
| Penyimpanan sampul | File di storage hosting, path di database | keputusan pelaksana (§5) |
| Repositori | GitHub privat | materi klien tidak boleh publik |

Tidak memakai WordPress, PHP, page builder, atau layanan BaaS.

---

## 3. Keputusan: tanpa ORM dulu

Jumlah query di proyek ini kecil dan bentuknya sederhana: daftar buku per status dengan pagination, satu buku per slug, satu buku per id, insert, update, delete, dan satu baris admin. ORM menambah dependensi, file skema, dan lapisan yang harus dipelajari tanpa memberi banyak manfaat pada ukuran ini.

Bentuknya:

- `lib/db/` — koneksi database (satu pool) dan helper query.
- `lib/books/` — fungsi `listBooks({ status, page })`, `getBookBySlug`, `getBookById`, `createBook`, `updateBook`, `deleteBook`.
- `lib/auth/` — pemeriksaan sesi dan admin.
- `lib/validation/` — validasi input, dipakai bersama form dan server.
- `lib/storage/` — validasi file, pemrosesan gambar, path, simpan/hapus.
- `lib/whatsapp.ts` — pembentuk URL dan pesan WhatsApp.

Semua query memakai parameter terikat, bukan penggabungan string, sehingga tidak bisa disuntik SQL.

Kalau nanti query bertambah rumit, Drizzle bisa ditambahkan tanpa membongkar struktur ini.

---

## 4. Auth admin: bentuk yang akan dibangun

Ini bagian paling berisiko pada stack tanpa Supabase, jadi ditulis eksplisit.

**Dibangun:**

- Tabel `admin_users` — satu baris. Kolom: `id`, `email`, `password_hash`, `failed_attempts`, `locked_until`, `created_at`.
- Tabel `sessions` — kolom: `token_hash`, `admin_id`, `expires_at`, `created_at`.
- Password di-hash dengan **argon2id**.
- Token sesi 32 byte acak. Yang disimpan di database adalah hash token, bukan token aslinya. Cookie **tidak ditandatangani** — pencabutan sesi cukup dengan menghapus barisnya, tanpa kunci yang perlu dirotasi.
- Cookie sesi: `httpOnly`, `Secure`, `SameSite=Lax`.
- Sesi punya masa berlaku dan dihapus saat logout, sehingga akses benar-benar tertutup — ini syarat acceptance test pada brief.
- Pembatasan percobaan login gagal disimpan **di database** (`failed_attempts`, `locked_until`), bukan di memori proses — penghitung di memori hilang saat restart dan tidak berlaku lintas proses, sehingga kontrolnya tidak nyata. Membuka lockout dilakukan lewat SQL.

**Tidak dibangun:** registrasi publik, lupa password lewat email, halaman kelola akun, login Google/OAuth.

**Mengganti password admin** dilakukan lewat satu perintah `UPDATE` di phpMyAdmin. Karena maintenance bulanan dipegang pelaksana, jalur ini praktis dan tidak perlu deploy ulang. Memberi client tombol ganti password adalah fitur tambahan di luar kesepakatan.

**Alternatif yang ditolak:**

- Library auth siap pakai — lebih aman secara teori karena mekanismenya sudah teruji, tetapi menambah dependensi dan skema tabel yang harus diikuti.
- Kredensial di environment variable — paling sedikit kodenya, tetapi mengganti password berarti harus deploy ulang aplikasi.

---

## 5. Sampul buku: alur penyimpanan

Sampul **tidak disimpan di database**. Database hanya menyimpan nama file dan metadata buku.

Alasan tidak memakai kolom BLOB: satu sampul berukuran 200 KB–2 MB, dan beberapa puluh buku akan membengkakkan ukuran database, memperlambat backup, serta mendekati batas ukuran database paket hosting. Folder penyimpanan berukuran 50 GB jauh lebih lega.

**Alur upload:**

1. Admin memilih file di form.
2. Server memeriksa ukuran file (maksimum 5 MB) **sebelum** memproses apa pun.
3. `sharp` mendekode gambar. Kalau gagal didekode, file ditolak — ini yang mencegah file non-gambar meskipun namanya berakhiran `.jpg`.
4. Gambar diperkecil hingga sisi terpanjang maksimum 1600px; gambar yang lebih kecil tidak diperbesar.
5. Hasilnya dikompres, lalu disimpan dengan nama acak (UUID). Nama file dari admin tidak pernah dipakai.
6. Path disimpan di database. URL publik dibentuk oleh resolver terpisah.

**Syarat hosting:** folder penyimpanan sampul tidak boleh terhapus ketika aplikasi di-deploy ulang. Kalau hosting menempatkan aplikasi di folder yang diganti setiap deploy, folder sampul harus berada di luarnya.

---

## 6. Hosting: ditunda, dengan syarat yang harus dijaga

Pembelian paket ditunda. Saat membelinya nanti, empat syarat ini wajib ada — kalau salah satu tidak ada, stack ini tidak bisa jalan:

1. Mampu menjalankan proses Node.js yang hidup terus, bukan sekadar menyajikan file statis.
2. Menyediakan MySQL / MariaDB.
3. Menyediakan folder yang bertahan antar-deploy untuk sampul.
4. Environment variable dapat diatur dari panel.

**Uji di jam pertama setelah hosting dibeli, sebelum menulis kode aplikasi:**

1. Deploy aplikasi Next.js kosong dari GitHub → build sukses → halaman terbuka.
2. Atur satu environment variable dari panel → terbaca oleh aplikasi.
3. Aplikasi menyambung ke MySQL → `SELECT 1` berhasil.
4. Tulis satu file ke folder sampul → deploy ulang → file masih ada.
5. File tersebut dapat dibuka lewat URL publik.
6. `sharp` berjalan saat memproses satu gambar nyata.

**Harga.** Paket pada tangkapan layar pemilik proyek: Rp35.900/bulan dengan kontrak 48 bulan = Rp1.723.200 dibayar sekaligus, perpanjangan Rp121.900/bulan. Perjanjian kerja sama mengalokasikan Rp1.000.000 untuk domain `.com` dan hosting tahun pertama. Selisih harga dan masa kontrak perlu diputuskan bersama client, bukan semata keputusan teknis.

**Akun pembelian.** Perjanjian bagian II mensyaratkan domain dan hosting didaftarkan atas nama CV Cipta Manuskrip Media agar kepemilikannya mutlak. Pastikan akun Hostinger yang dipakai untuk membeli memang milik client.

---

## 7. Otorisasi tanpa RLS

Supabase menyediakan RLS: aturan siapa yang boleh membaca dan mengubah data diletakkan di database, sehingga celah pada kode aplikasi masih tertahan di lapisan database. MySQL tidak memiliki padanannya.

Konsekuensinya, seluruh pemeriksaan izin berpindah ke kode aplikasi: setiap Server Action dan setiap route yang mengubah data memeriksa sesi admin lebih dahulu, tanpa terkecuali.

Dampaknya pada pengujian: acceptance test brief butir 2 dan 3, yang semula diuji dengan menembak database secara langsung sebagai anon, berubah bentuk menjadi pengujian lewat HTTP — setiap endpoint mutasi harus gagal ketika dipanggil tanpa sesi admin yang sah. Ini dicatat di `docs/SPEC-AMENDMENT-01.md`.

**Risiko yang diterima secara sadar:** kalau ada satu route mutasi yang lupa memeriksa sesi, tidak ada lapisan kedua yang menahan. Mitigasinya adalah pengujian otomatis yang memanggil setiap endpoint mutasi tanpa sesi dan memastikan semuanya ditolak.

---

## 8. Materi yang belum tersedia dari client

Diisi penanda jujur, tidak dikarang:

- Nama, harga, dan fasilitas tiga paket penerbitan → `[Nama paket dari klien]`, `[Harga dari klien]`, `[Fasilitas paket dari klien]`
- Logo
- Referensi tampilan desain
- Data dan sampul buku yang akan dimasukkan
- Bukti submission jurnal dan logo indeksasi → `[Aset dari klien]`

Nomor WhatsApp sudah pasti dari perjanjian: buku `0896-7189-4900` (dibentuk `6289671894900`), jurnal `0895-6292-03142` (dibentuk `62895629203142`).

Database publik dimulai kosong. Katalog tidak diisi buku fiktif.

---

## 9. Rencana Fase 1 (dikerjakan setelah dokumen ini disetujui)

1. Bootstrap Next.js + TypeScript strict + Tailwind, satu package manager dengan lockfile.
2. Struktur folder sesuai brief bagian 11, dengan `lib/db/`, `lib/auth/`, `lib/storage/` menggantikan `lib/supabase/`.
3. Migration SQL: tabel `books`, `admin_users`, `sessions`, index untuk urutan judul A–Z, trigger `updated_at`.
4. Perintah setup untuk membuat database lokal, tabel, dan satu akun admin.
5. Koneksi database sungguhan, plus satu halaman publik yang membaca data nyata dengan empty state dan error koneksi yang dibedakan.
6. `.env.example`, `.gitignore`, `README.md`, dan panduan setup.
7. Lint, type-check, laporan hasil, lalu berhenti untuk persetujuan sebelum Fase 2.

Desain visual, font, warna, dan animasi **tidak** dikerjakan pada tahap ini — sesuai brief, itu dikerjakan belakangan di Arena setelah repo diimpor.

## 10. Basis data pengembangan

Pengembangan dan pengujian lokal memakai **MySQL 8.4.3** yang sudah tersedia di komputer pemilik proyek melalui Laragon (`C:\laragon\bin\mysql\mysql-8.4.3-winx64`). Tidak perlu memasang apa pun lagi.

MySQL 8.4 memenuhi kebutuhan desain ini: ekspresi default untuk UUID, CHECK constraint yang benar-benar ditegakkan, dan functional index untuk urutan case-insensitive.

**Risiko yang diakui:** versi MySQL/MariaDB di paket hosting belum diketahui karena paketnya belum dibeli. Kalau nanti ternyata MariaDB dengan perilaku berbeda, penyesuaiannya terbatas pada file migration — kode aplikasi tidak berubah. Ini diuji pada jam pertama setelah hosting dibeli.
