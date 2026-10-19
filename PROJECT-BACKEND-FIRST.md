# PROJECT — CV Cipta Manuskrip Media
## Backend-first · Brief mandiri untuk Claude Code

## 1. Instruksi utama

Bangun website CV Cipta Manuskrip Media dengan prioritas FUNGSI NYATA terlebih dahulu. Ini bukan proyek desain UI saat ini.

Target pertama: aplikasi Next.js benar-benar terhubung dengan Supabase, admin dapat login dan mengelola buku beserta sampul, dan perubahan melalui dashboard terlihat di halaman publik dari database yang sama. UI cukup sederhana, rapi, responsif, dan dapat dipakai untuk menguji semua alur.

Jangan menghabiskan waktu untuk hero premium, animasi, ilustrasi, art direction, atau eksplorasi visual. Jangan mengganti integrasi nyata dengan localStorage, fixture, mock login, atau data hardcoded agar terlihat selesai.

Pengerjaan backend dan fungsi dilakukan di Claude Code. Setelah fungsi teruji, repository disimpan di GitHub. Repository tersebut nanti diimpor ke Arena.ai untuk pengerjaan UI. Karena itu, pisahkan logika bisnis, akses data, validasi, dan komponen presentasi sejak awal. Perombakan UI nantinya tidak boleh memerlukan pembangunan ulang backend.

Kerjakan per fase, verifikasi, perbarui dokumentasi, lalu berhenti untuk persetujuan sebelum fase berikutnya. Mulai dari fase 1 dalam bagian 14.

## 2. Stack wajib

- Next.js App Router.
- TypeScript dengan strict mode.
- Tailwind CSS untuk UI dasar.
- Supabase PostgreSQL untuk database.
- Supabase Auth untuk akun admin.
- Supabase Storage untuk sampul buku.
- Gunakan `@supabase/supabase-js` dan `@supabase/ssr` dengan pola SSR/cookie resmi yang sesuai versi terpasang.
- Server Components secara default; Client Components hanya saat interaksi memerlukannya.
- Server Actions atau Route Handlers untuk mutasi tervalidasi, pilih pola yang konsisten.
- Package manager tunggal dengan lockfile. Pakai versi stabil yang saling kompatibel dan dokumentasikan.

Tidak memakai WordPress, PHP, page builder, atau backend terpisah yang tidak diperlukan.

## 3. Batas fitur dan sumber kebenaran

- Pengunjung tanpa akun dapat melihat layanan, katalog, dan detail buku.
- Admin hanya mengelola buku; bukan CMS seluruh website.
- Konten selain buku disimpan di file TypeScript, misalnya `content/site.ts`.
- Tidak ada akun member, registrasi publik, pembayaran, cart, checkout, pembaca/unduhan buku, upload PDF e-book, pencarian/filter katalog, atau notifikasi buku segera terbit.
- Jangan menambah statistik, testimoni, harga, logo mitra, legalitas, atau data perusahaan palsu.
- Placeholder jelas untuk materi yang belum tersedia dari klien. Database publik awal boleh kosong; jangan mengisi katalog dengan buku fiktif.
- Seed khusus pengujian hanya digunakan di lingkungan test/development, berlabel data uji, dan tidak masuk produksi.

## 4. Identitas dan UI sementara

- Nama: CV Cipta Manuskrip Media.
- Bahasa antarmuka: Indonesia.
- Slogan: `Publikasi Semudah Beli Kopi.`
- Audiens utama dosen tanpa menutup layanan untuk penulis dan masyarakat umum.

Gunakan UI dasar yang mudah dites: label jelas, tabel/form sederhana, navigasi berfungsi, loading, error, empty state, not-found, dan feedback sukses. Akses keyboard, focus state, dan responsivitas dasar tetap wajib.

Warna identitas untuk penggunaan seperlunya:
- Putih `#FFFFFF`.
- Primary teal `#09677D`, hover `#075569`, soft `#E8F4F6`.
- Aksen lime `#C2CC08`, hover `#AAB306`, soft `#F7F9D8`.
- Teks utama `#102A31`, sekunder `#5F7075`.
- Border `#DCE6E8`, background alternatif `#F7FAFB`.
- Tombol teal memakai teks putih; lime memakai teks gelap. Jangan pakai teks lime di atas putih.

Jangan mengunci styling pada business logic. Font, layout, komponen visual, dan motion akan dikerjakan belakangan di Arena.

## 5. Database

Buat migration SQL versioned dalam repository, bukan perubahan dashboard tanpa catatan.

Tabel `public.books`:
- `id uuid primary key default gen_random_uuid()`.
- `title text not null`.
- `slug text not null unique`.
- `author text not null`.
- `synopsis text`: wajib nonblank untuk `published`.
- `publisher_info text not null default 'CV Cipta Manuskrip Media'`.
- `book_info text`: informasi buku upcoming.
- `cover_path text not null`: path relatif dalam bucket, bukan URL mentah.
- `status text not null`: hanya `published` atau `upcoming`.
- `estimated_release text`: nonblank untuk upcoming; NULL untuk published.
- `created_at timestamptz not null default now()`.
- `updated_at timestamptz not null default now()`.

Aturan:
- CHECK constraint untuk field wajib nonblank, status, dan kewajiban kondisional sinopsis/estimasi. Terapkan juga validasi server; jangan hanya mengandalkan validasi browser.
- Slug lowercase dan format aman URL, otomatis dari judul, dapat diedit admin; benturan ditangani dengan pesan jelas. Database UNIQUE tetap menjadi pengaman race condition.
- Trigger memperbarui `updated_at`.
- Index untuk status dan urutan `lower(title), id` agar pagination deterministik. Katalog diurutkan judul A–Z case-insensitive di DATABASE, bukan sesudah pagination di JavaScript.
- Sediakan query/view/RPC terkontrol jika diperlukan untuk sorting expression melalui Supabase; view harus menghormati RLS (misalnya security invoker). Jangan membuat fungsi elevated yang melewati otorisasi tanpa alasan.

### Otorisasi dan RLS

- Aktifkan RLS.
- Anon dan authenticated boleh SELECT katalog buku.
- Hanya admin yang sah boleh INSERT, UPDATE, DELETE.
- Registrasi publik harus dimatikan. Akun admin dibuat manual.
- Jangan menyamakan seluruh user authenticated dengan admin secara implisit. Gunakan allowlist `public.admin_users` yang memetakan user ID Supabase Auth, dikelola manual melalui lingkungan tepercaya, bukan dari browser.
- User tidak bisa menambahkan dirinya ke allowlist. Tidak ada halaman pengelolaan role.
- Gunakan pemeriksaan admin yang sama pada mutasi server, route admin, RLS buku, dan policy storage.
- Jika memakai helper SQL security definer untuk cek membership, kunci search_path, batasi privilege, dan hindari RLS rekursif. Dokumentasikan desain keamanan.
- Uji akses langsung anon dan user non-admin, bukan hanya menyembunyikan tombol.

## 6. Storage sampul

Bucket: `book-covers`, public read.

- Public boleh membaca sampul; hanya admin sah boleh upload/update/delete.
- Hanya JPEG, PNG, dan WebP; maksimum file input 5 MiB. Jangan menerima SVG, PDF, atau file arbitrer.
- Validasi ukuran dan isi file di server, bukan hanya ekstensi/MIME dari browser. Decode/re-encode gambar untuk memverifikasi dan mengompresnya; batasi dimensi/pixel agar input berbahaya tidak membebani server.
- Target sisi terpanjang maksimum 1600 px, pertahankan rasio; jangan upscale gambar kecil. Terapkan batas ukuran upload hasil dan konfigurasi bucket yang konsisten.
- Gunakan path aman unik, misalnya UUID dengan ekstensi output; jangan mengandalkan nama file pengguna.
- Simpan path di database, URL publik dibentuk oleh resolver terpisah.
- Gunakan runtime Node untuk pemrosesan gambar jika library membutuhkannya. Pastikan batas request deployment mendukung ukuran input yang dipilih.
- Preview lokal boleh digunakan sebelum submit, tetapi file final harus tersimpan nyata di Supabase.

### Konsistensi file dan database

Supabase Storage dan PostgreSQL bukan satu transaksi atomik. Tangani kompensasi secara eksplisit:
- Tambah: upload baru → insert buku → jika insert gagal, hapus file baru.
- Ganti sampul: upload baru → update database → baru hapus file lama. Jika update gagal, hapus file baru dan pertahankan file lama.
- Hapus buku: hapus record secara terotorisasi, lalu bersihkan file terkait; jika cleanup gagal, laporkan sebagai cleanup tertunda, bukan mengklaim seluruh proses berhasil sempurna.
- Jangan hapus file yang masih dipakai record lain. Pilih kepemilikan sampul unik per buku dan validasi path saat mutasi.
- Catat kegagalan cleanup tanpa membocorkan secret; dokumentasikan prosedur retry/pembersihan orphan yang bisa dijalankan admin teknis.

## 7. Auth dan keamanan aplikasi

Rute admin:
- `/admin/login`
- `/admin`
- `/admin/buku`
- `/admin/buku/tambah`
- `/admin/buku/[id]/edit`

Fungsi:
- Login email/password dan logout menggunakan Supabase Auth nyata.
- Lindungi semua route admin selain login di server.
- Verifikasi user/session menggunakan pola Supabase SSR resmi untuk versi yang dipakai; jangan mempercayai session browser atau middleware saja.
- Verifikasi role admin pada setiap mutasi dan akses data admin. RLS menjadi lapisan tambahan.
- Tangani session expired, invalid credentials, user bukan admin, loading, dan kegagalan jaringan dengan feedback jelas.
- Tidak ada registrasi publik atau password admin hardcoded.
- Jangan mengirim service-role/secret key ke browser. Alur aplikasi normal memakai session user dan RLS, bukan service-role untuk melewati otorisasi.
- Jangan mencatat password, token, cookie, atau data rahasia pada log.
- Validasi seluruh input di server, gunakan Supabase SDK/parameter terikat, dan render teks tanpa HTML mentah tak tepercaya.
- Gunakan URL redirect internal yang tervalidasi; hindari open redirect.
- Ikuti proteksi origin/CSRF framework untuk mutasi; jangan mematikan pengaman agar preview bekerja.
- Mutasi hanya melalui metode yang sesuai, bukan GET. Pertimbangkan retry, double-submit, dan pesan kegagalan yang aman.
- Dashboard diberi noindex dan dilarang di robots, tetapi ini BUKAN mekanisme keamanan.

## 8. Dashboard admin yang benar-benar dapat dipakai

- `/admin`: tautan jelas ke pengelolaan buku; jangan tambah analytics/CMS.
- Daftar buku dari database dengan judul, penulis, status, sampul, aksi edit/hapus.
- Tambah dan edit seluruh field yang relevan.
- Slug otomatis dari judul namun dapat diperbaiki; validasi unik.
- Sinopsis wajib untuk published; estimasi wajib untuk upcoming dan dikosongkan saat berubah menjadi published.
- Upload, preview, ganti, dan hapus sampul melalui alur aman. Karena sampul buku wajib, penghapusan pilihan sampul pada form harus diikuti pengganti sebelum buku disimpan; penghapusan buku membersihkan file terkait.
- Konfirmasi sebelum hapus; pending state dan cegah submit ganda.
- Kesalahan validasi tidak menghapus input yang telah diisi.
- Perubahan tetap tersimpan setelah refresh, logout/login, dan restart aplikasi.

Setelah mutasi berhasil, lakukan invalidation/revalidation cache dengan benar untuk daftar admin, katalog, homepage/preview katalog yang menampilkan buku, serta detail slug terkait. Jika slug berubah, invalidasi slug lama dan baru. Detail lama tidak boleh tetap menyajikan data stale. Pilih strategi caching sederhana dan dokumentasikan. Verifikasi pada production build, bukan hanya dev.

## 9. Halaman publik yang terhubung database

Header hanya Beranda (`/`) dan Tentang Kami (`/tentang-kami`). Layanan diakses dari tombol beranda; footer boleh mengulang tautan layanan.

### `/`
- Headline persis `Publikasi Semudah Beli Kopi.`
- Pendukung: `Layanan penerbitan buku dan publikasi artikel ilmiah.`
- Publish Buku → `/publish-buku`.
- Publish Jurnal → `/publish-jurnal`.
- Tidak perlu menambah katalog atau section pemasaran baru di homepage.

### `/publish-buku`
- Headline persis `Terbit Buku Sekali Klik.`
- Urutan: tepat 3 kartu paket → asistensi penulisan → preview katalog published → preview katalog upcoming.
- Paket: `[Nama paket dari klien]`, `[Harga dari klien]`, `[Fasilitas paket dari klien]`.
- Kirim Naskah scroll ke paket; Asistensi Penulisan scroll ke section asistensi pada halaman sama.
- Kedua preview katalog berasal dari database nyata, masing-masing satu status, diurutkan A–Z. Batas preview boleh kecil dan harus konsisten serta didokumentasikan.
- Lihat Semua menuju katalog status terkait.

### `/katalog/telah-terbit` dan `/katalog/segera-terbit`
- Satu status per halaman, query database nyata, sorting A–Z case-insensitive dengan tie-breaker stabil.
- Pagination server-side, 12 buku per halaman, query `?page=`.
- Nomor halaman dan tombol berlabel persis `Next`; `Prev` opsional.
- Tidak ada search/filter/kategori.
- Parse page sebagai integer positif, normalisasi input invalid dan halaman di luar rentang ke halaman valid tanpa redirect loop.
- Sembunyikan pagination bila hanya ada satu halaman.
- Sampul/judul menuju `/buku/[slug]`.
- Empty state published: `Belum ada buku yang diterbitkan.`
- Empty state upcoming: `Belum ada buku yang segera terbit.`

### `/buku/[slug]`
Published:
- Sampul, judul, penulis, sinopsis, informasi penerbit.
- Tombol pesan buku cetak dan sewa e-book ke WhatsApp.
Upcoming:
- Sampul, judul, penulis, informasi buku, estimasi terbit.
- Tidak ada order atau daftar notifikasi.

Gunakan lookup database, not-found jika tidak ada, metadata dari data buku, dan alt text sampul. Jangan mencampur error koneksi database dengan status buku tidak ditemukan.

### `/publish-jurnal`
- Headline persis `Publikasi Artikel Ilmiah Sekali Klik.`
- Area bukti submission, dokumentasi korespondensi, logo indeksasi, fasilitas. Aset belum ada: `[Aset dari klien]`.
- Fasilitas sesuai brief: LOA cepat; DOI aktif; dokumentasi korespondensi lengkap; review transparan; jurnal bukan predator; revisi minor–mayor; Turnitin; konversi skripsi/tesis/disertasi; penerjemahan artikel; proofreading; layout; template artikel; garansi terbit. Jangan menambah angka/janji baru.
- Kirim Artikel → `/publish-jurnal/kirim-artikel`.
- Belum Ada Artikel → `/publish-jurnal/asistensi`.

### `/publish-jurnal/kirim-artikel`
Tepat tiga kategori:
1. Jurnal Nasional Terakreditasi SINTA 1–4.
2. Jurnal Internasional Index Copernicus.
3. Jurnal Internasional Scopus dan SCImago.

Tombol langsung ke WhatsApp; tidak ada upload artikel ke server.

### `/publish-jurnal/asistensi`
- Tiga kategori jurnal yang sama.
- Input topik penelitian; trim dan validasi tidak kosong/whitespace.
- Buka WhatsApp dengan pesan yang ditentukan, bukan simpan topik ke database.

### `/tentang-kami`
- Area profil/legalitas, dokumen resmi, kontak, media sosial.
- Admin buku: `0896-7189-4900`.
- Admin jurnal: `0895-6292-03142`.
- Placeholder jujur untuk data belum tersedia, tidak membuat alamat/NIB/NPWP/email/sosmed atau PDF legal palsu.

## 10. WhatsApp — nomor dan pesan wajib

Format `https://wa.me/[nomor]?text=[pesan]`; encode seluruh pesan menggunakan `encodeURIComponent`. Buka tab baru dengan `rel="noopener noreferrer"`.

Nomor buku wajib persis `6289671894900`:
- `Mau pesan buku cetak judul [judul]`
- `Mau sewa ebook judul [judul]`

Nomor jurnal wajib persis `62895629203142`:
- Kirim: `ini naskah artikel saya, admin.`
- Asistensi: `saya mau dibantu asistensi artikel topik [topik].`

Ganti judul/topik dari input/data sebenarnya. Pertahankan penulisan `ebook`. Jangan mengoreksi nomor, menambah kategori, salam, atau teks lain. Tidak ada form backend pengganti WhatsApp.

## 11. Struktur siap perombakan UI di Arena

Pisahkan minimal:
- `app/`: routing, server page, layout, loading/error/not-found.
- `components/`: presentasi/UI sederhana.
- `content/site.ts`: konten statis.
- `lib/supabase/`: client browser/server dan refresh session sesuai versi framework.
- `lib/books/`: repository/query/mutasi buku, bukan query tersebar di komponen presentasi.
- `lib/auth/`: pemeriksaan user/admin.
- `lib/validation/`: schema input bersama bila sesuai, server tetap otoritatif.
- `lib/storage/`: validasi, pemrosesan, path, upload/cleanup, resolver URL.
- `lib/whatsapp.ts`: pembentuk URL/pesan.
- `types/`: tipe aplikasi/database.
- `supabase/migrations/`: SQL schema, index, trigger, RLS, storage policy.
- `tests/`: pengujian yang dapat diulang.

Struktur boleh disesuaikan mengikuti idiom Next.js versi terpasang. Hindari abstraksi berlebihan. Tidak perlu membuat REST API tambahan jika Server Actions sudah memadai.

Tetapkan kontrak terketik, minimal listBooks({status,page,pageSize}), getBookBySlug, getBookById, createBook, updateBook, deleteBook. Kontrak paginasi mengembalikan items, total, page, pageSize. Validasi mutasi dan authorization tetap pada server; jangan mengekspor modul server/secret ke browser.

Di tahap Arena nanti, perubahan utama ada pada komponen presentasi, CSS/token, dan layout. Pertahankan kontrak, validasi, keamanan, data flow, dan perilaku cache. Jangan menjanjikan integrasi/perombakan tanpa regression test.

## 12. Environment, setup, dan GitHub

Sediakan `.env.example` dengan NAMA variabel tanpa nilai rahasia. Ikuti penamaan Supabase versi terpasang, jelaskan public project URL dan publishable/anon key. Secret administratif jika benar-benar dibutuhkan hanya untuk setup di lingkungan tepercaya, bukan variabel NEXT_PUBLIC atau dependency runtime browser.

Jika credential/project Supabase belum tersedia:
- Jangan mengarang credential atau mengklaim sudah terhubung.
- Siapkan kode/migration dan petunjuk manual, lalu minta data minimum yang diperlukan melalui konfigurasi environment lokal yang aman.
- Jangan meminta pengguna menempelkan service-role key ke chat/repository.
- Laporkan verifikasi live sebagai terblokir sampai benar-benar dapat diuji.

Dokumentasikan langkah manual: membuat project, env lokal, menjalankan migration, konfigurasi bucket, mematikan signup, membuat user admin, memasukkan user ke allowlist melalui SQL tepercaya, serta konfigurasi URL Auth untuk lokal/deployment yang sesuai.

Untuk GitHub:
- Sertakan source, lockfile, migration, test, panduan, dan `.env.example`.
- `.gitignore`: env sungguhan, secret, node_modules, .next, build output, log sensitif, dan file lokal.
- Jangan commit credential, service-role key, atau data pribadi klien.
- Jangan push/publish tanpa instruksi pengguna dan repository yang jelas.
- Buat panduan clone/import repository di Arena, install, isi env, jalankan aplikasi, dan regression test sebelum/sesudah perubahan UI.
- Database/storage tidak ikut berpindah bersama GitHub; environment tujuan perlu konfigurasi dan akses ke Supabase. Jangan menganggap import source otomatis membawa data/secret.

## 13. Acceptance test — fungsi harus terbukti

Minimal verifikasi:
1. Pengunjung melihat empty state ketika database kosong.
2. Anon tidak dapat membuka data admin atau melakukan mutasi langsung melalui database/storage.
3. User authenticated non-admin juga ditolak.
4. Admin login nyata, refresh halaman tetap valid, logout menutup akses.
5. Tambah published dengan sampul nyata → muncul pada daftar admin, preview publish-buku, katalog published, dan detail; reload tetap ada.
6. Tambah upcoming → estimasi wajib, muncul hanya pada katalog/preview yang sesuai dan detail tanpa order.
7. Edit judul, penulis, isi, status, dan slug → halaman publik berubah; slug lama tidak menyajikan buku lama secara stale.
8. Ganti sampul → gambar baru tampil, file lama dibersihkan setelah update berhasil.
9. Hapus buku → hilang dari admin/katalog/detail, file dibersihkan atau kegagalan cleanup terlapor untuk retry.
10. Input kosong, slug duplikat, status invalid, file terlalu besar, dan file non-gambar ditolak oleh server/database sebagaimana relevan.
11. Simulasi kegagalan penyimpanan database setelah upload tidak meninggalkan file baru tanpa penanganan; update gagal tidak menghilangkan sampul lama.
12. Dataset test >12 buku membuktikan sorting A–Z lintas halaman, pagination, invalid page handling, dan pemisahan status.
13. URL WhatsApp dan hasil decode pesan cocok persis.
14. UI tidak membocorkan key rahasia; route admin noindex, robots melarang admin, sitemap hanya route publik dan buku nyata.
15. Lint, type-check, build, dan test otomatis yang relevan lulus. Verifikasi invalidation pada production build jika lingkungan mendukung.

Gunakan unit test untuk validator, slug, pesan WA, serta normalisasi page; integration/e2e untuk RLS, storage, auth, CRUD, dan sinkronisasi publik. Test live memakai lingkungan pengujian yang jelas, bukan merusak data produksi. Catat pengujian manual vs otomatis dan apa yang masih belum diuji. Jangan menyebut fase selesai bila alur utama hanya mock atau belum terverifikasi.

## 14. Fase pelaksanaan

### Fase 1 — Fondasi dan koneksi database nyata
- Bootstrap stack, env example, struktur dasar, migration schema/index/RLS/storage policy.
- Panduan konfigurasi Supabase dan pembuatan admin.
- Halaman publik sederhana yang melakukan query nyata, menangani hasil kosong dan error koneksi secara berbeda.
- Verifikasi migration/koneksi pada Supabase bila credential tersedia. Jika belum, tandai blocker dengan jujur.
- Lint, type-check, update progress, lalu berhenti.

### Fase 2 — Admin end-to-end
- Auth SSR dan allowlist admin.
- CRUD buku, validasi, pemrosesan/upload sampul, kompensasi cleanup.
- Daftar dan detail publik minimal dari DB yang sama agar perubahan admin langsung dapat diuji pada fase ini.
- Uji akses anon/non-admin serta persistensi setelah refresh. Dokumentasikan, lalu berhenti.

### Fase 3 — Semua alur publik fungsional
- Preview katalog, kedua katalog dengan pagination database, detail berdasarkan status, invalidation, dan metadata.
- Lengkapi halaman statis dan alur WhatsApp.
- UI tetap sederhana; bukan tahap desain premium.
- Verifikasi setiap route dan perubahan admin → publik, lalu berhenti.

### Fase 4 — QA dan handoff GitHub → Arena
- Regression test, perbaikan fungsi/keamanan, panduan admin, deployment, dan handoff UI.
- Bersihkan mock/fixture produksi, pastikan repo tanpa secret.
- Siapkan repository untuk GitHub; push hanya bila diminta.
- Berhenti. Desain premium tidak dikerjakan dalam brief backend-first ini.

## 15. Dokumen deliverable

Dokumen berikut DIBUAT OLEH IMPLEMENTASI DI CLAUDE CODE, tidak harus sudah ada sebelum mulai:
- `README.md`: install, env, run, build, test, dan arsitektur ringkas.
- `docs/SUPABASE-SETUP.md`: migration, auth, allowlist, storage/policy, konfigurasi manual.
- `docs/ADMIN-GUIDE.md`: panduan admin bahasa Indonesia untuk login, tambah/edit/hapus buku, ganti sampul, dan cek hasil di publik.
- `docs/PROGRESS.md`: fase, hasil verifikasi, blocker, dan pekerjaan tersisa.
- `docs/UI-HANDOFF.md`: file yang aman diubah saat desain, kontrak data/action, aturan penting yang tidak boleh rusak, cara import dari GitHub ke Arena, dan checklist regression.
- Catatan deployment dan cleanup orphan storage.

## Instruksi mulai

Mulai dari fase 1. Audit folder/repository jika sudah ada; jangan menimpa pekerjaan atau mereset database tanpa izin. Jelaskan rencana singkat, lalu implementasikan kode yang diperlukan. Prioritaskan bukti koneksi nyata, alur admin yang dapat dipakai, dan data publik yang sinkron. Setelah setiap fase, laporkan hasil, verifikasi yang benar-benar dijalankan, dan blocker; jangan lanjut fase berikutnya otomatis.
