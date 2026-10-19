# CV Cipta Manuskrip Media — Situs Web

Situs web perusahaan penerbitan CV Cipta Manuskrip Media: katalog buku yang
telah terbit dan yang segera terbit, dikelola lewat panel admin.

Proyek ini **tidak memakai Supabase**. Seluruh data disimpan di MySQL yang
dikelola sendiri, diakses tanpa ORM.

## Prasyarat

| Kebutuhan | Versi | Catatan |
|---|---|---|
| Node.js | ≥ 20.9 | Dikembangkan dan diuji di Node v24.22.0 |
| MySQL | 8.4 | Diuji pada MySQL 8.4.3. Lihat `docs/DATABASE-SETUP.md` |

MariaDB belum diuji. Lihat `docs/PROGRESS.md` bagian blocker.

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
| `COVER_MAX_BYTES` | `5242880` | Batas ukuran sampul (5 MiB), dipakai mulai Fase 3 |

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

## Memeriksa kode

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript, tanpa keluaran bila bersih
npm test             # Vitest, sekali jalan
npm run test:watch   # Vitest, mode pantau
```

`npm test` menyentuh database yang sama dengan pengembangan. Tes repository
menghapus isi tabel `books` di setiap awal tes, jadi **jangan menunjuk
`DB_NAME` ke database berisi data sungguhan** saat menjalankan tes.

## Struktur folder

```
app/
├── app/                    Halaman Next.js (App Router)
│   ├── layout.tsx          Kerangka halaman, metadata, bahasa
│   ├── page.tsx            Beranda
│   └── katalog/[status]/   Katalog: telah-terbit, segera-terbit
├── components/             Komponen tampilan murni, tanpa akses database
├── db/migrations/          Berkas SQL, dijalankan berurutan
├── lib/
│   ├── db/                 Koneksi pool dan pembantu query
│   ├── books/              Tipe, repository, paginasi, status katalog
│   ├── validation/         Validasi input dan pembentuk slug
│   └── env.ts              Pembacaan dan validasi variabel environment
├── scripts/                Perintah CLI: migrate, create-admin
└── public/                 Berkas statis
```

Alur data satu arah: halaman → `lib/books/repository` → `lib/db` → MySQL.
Komponen di `components/` hanya menerima data, tidak pernah menyentuh
database — sehingga perombakan tampilan tidak bisa merusak aliran data.

## Dokumen terkait

| Berkas | Isi |
|---|---|
| `docs/DATABASE-SETUP.md` | Menyiapkan MySQL, aturan perubahan skema |
| `docs/PROGRESS.md` | Apa yang sudah selesai, apa yang masih terblokir |
| `docs/DESIGN-STACK.md` | Keputusan teknis dan alasannya |
| `docs/SPEC-AMENDMENT-01.md` | Perubahan lingkup terhadap brief awal |
| `PROJECT-BACKEND-FIRST.md` | Brief awal dari klien |
| `PERJANJIAN KESEPAKATAN KERJASAMA.pdf` | Perjanjian kerja sama yang ditandatangani |
