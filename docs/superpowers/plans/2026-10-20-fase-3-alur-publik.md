# Fase 3: Alur Publik Fungsional — Halaman Statis, Preview Katalog, WhatsApp Jurnal, dan Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melengkapi seluruh alur publik yang belum ada — lima halaman statis (beranda versi final, `/publish-buku`, `/publish-jurnal`, dua subhalaman jurnal, `/tentang-kami`), preview katalog langsung dari database dengan batas tetap, alur WhatsApp jurnal, `robots.txt`, `sitemap.xml`, dan metadata — lalu memverifikasi setiap route serta perubahan admin → publik pada build produksi.

**Architecture:** Halaman publik dipindahkan ke route group `(publik)` yang memiliki layout sendiri berisi header (hanya Beranda dan Tentang Kami, sesuai brief §9) dan footer. Halaman admin tetap di luar group itu sehingga tidak mewarisi header/footer publik. Semua teks statis dan placeholder klien dikumpulkan di `content/site.ts` supaya perombakan UI di Arena cukup menyentuh satu berkas konten. Preview katalog memakai `listBooks()` yang sudah ada dengan `pageSize` tetap, sehingga urutan A–Z dan pemisahan statusnya berasal dari database, bukan dari pemotongan di JavaScript. Alur WhatsApp jurnal ditambahkan ke `lib/whatsapp.ts` sebagai fungsi murni yang dapat diuji tanpa DOM.

**Tech Stack:** Next.js 16.4.2 (App Router, Turbopack), React 19.3.0, TypeScript 5.9.3 (strict), MySQL 8.4.3 (`mysql2`), Tailwind CSS v4, Vitest 5.0.5.

**Spec:** `PROJECT-BACKEND-FIRST.md` (terutama §3, §4, §9, §10, §13, §14), `docs/DESIGN-STACK.md` §1 dan §8, `docs/SPEC-AMENDMENT-01.md`.

---

## Keadaan awal yang sudah terverifikasi

Fase 1 dan Fase 2 sudah menyelesaikan lebih banyak dari yang tercatat di `docs/PROGRESS.md` untuk lingkup Fase 3:

| Sudah ada dan lulus tes | Catatan |
|---|---|
| `/katalog/[status]` dengan pagination database | 12/halaman, A–Z, `?page=`, normalize halaman invalid, empty state, blok galat DB |
| `/buku/[slug]` detail per status | published: sinopsis + 2 tombol WhatsApp; upcoming: informasi buku + estimasi, tanpa order |
| `BookCard` menampilkan sampul sungguhan | berkas `/covers/[berkas]` |
| `noindex` pada layout admin dan halaman login | brief §7 |
| `lib/books/repository.ts` | `listBooks({status,page,pageSize})`, `getBookBySlug`, dll. |

Yang **belum** ada: seluruh halaman statis, header/footer publik, preview katalog di `/publish-buku`, kanal WhatsApp jurnal, `robots.txt`, `sitemap.xml`, `metadataBase`, dan invalidation untuk `/publish-buku`.

---

## Global Constraints

- **Teks persis.** Semua string di bawah dikunci brief §9 dan §10. Tes mengunci string itu apa adanya — termasuk titik akhir, en dash (`–`), dan penulisan `ebook` tanpa tanda hubung.
- **Placeholder jujur.** Nama paket, harga, dan fasilitas memakai `[Nama paket dari klien]`, `[Harga dari klien]`, `[Fasilitas paket dari klien]`. Aset jurnal memakai `[Aset dari klien]`. Tidak ada statistik, testimoni, alamat, NIB, NPWP, email, media sosial, atau PDF legal karangan (brief §3, §9; DESIGN-STACK §8).
- **WhatsApp.** Nomor buku `6289671894900`, nomor jurnal `62895629203142`. Format `https://wa.me/[nomor]?text=[pesan]`, seluruh pesan lewat `encodeURIComponent`, dibuka dengan `target="_blank" rel="noopener noreferrer"`. Tidak ada form backend pengganti WhatsApp; topik asistensi tidak pernah disimpan.
- **Pagination.** Brief menetapkan 12 buku per halaman pada katalog. Preview di `/publish-buku` memakai batas tetap **3 buku per status**, didokumentasikan di kode dan `docs/PROGRESS.md`, dan dipakai oleh kedua preview lewat satu konstanta.
- **Urutan.** A–Z case-insensitive di database (`ORDER BY title ASC, id ASC`), bukan setelah pagination di JavaScript.
- **Dinamis.** Setiap halaman yang membaca database wajib `export const dynamic = "force-dynamic"`. `sitemap.ts` juga, karena ia Route Handler yang di-cache secara bawaan.
- **Halaman async diuji dengan `await`, bukan dirender langsung.** `renderToStaticMarkup(<Page />)` melempar "A component suspended while responding to synchronous input" untuk komponen async — sudah dibuktikan di repo ini. Pola yang benar: `const el = await Page({ params: Promise.resolve(...) })` lalu `renderToStaticMarkup(el)`. Pola ini sudah diverifikasi bekerja terhadap `/katalog/[status]` yang ada.
- **Admin terpisah.** Halaman admin tidak boleh mewarisi header/footer publik. Penjagaan admin berjalan di dua lapis: `app/admin/(terlindungi)/layout.tsx` untuk halaman, dan `requireAdmin()` di setiap Server Action mutasi (`actions.ts`) — layout tidak ikut berjalan untuk pemanggilan action, jadi keduanya wajib ada. Layout tetap satu-satunya tempat halaman admin dijaga.
- **Tanpa `next/image` di fase ini.** Tes komponen mengunci `src="/covers/<uuid>.webp"`; migrasi optimizer ditunda ke Arena (PROGRESS.md sudah mencatatnya).
- **Tanpa desain premium.** Token warna brief §4 dipakai seperlunya pada halaman publik baru; admin, katalog, dan detail tidak dirombak melebihi apa yang dibutuhkan.
- **Satu `<main>` per dokumen.** Layout publik memegang `<main>`; halaman di dalamnya memakai `<div>` sebagai pembungkus terluar. Dua tag `<main>` bersarang adalah HTML tidak sah.
- **Mode gelap dilepas.** Rangka awal Next membawa blok `prefers-color-scheme: dark` yang membalik latar ke hampir hitam; brief §4 menetapkan latar putih. Blok itu dihapus di Task 4, bukan dipertahankan.

---

## Catatan pelaksanaan (koreksi terhadap teks tugas)

Ditemukan saat pemindaian awal sebelum Task 1 dijalankan. Tiap butir di bawah **menggantikan** teks tugas yang bersangkutan.

| Tugas | Teks semula | Yang benar |
|---|---|---|
| 10 | Menyunting `app/buku/[slug]/page.tsx` | `app/app/(publik)/buku/[slug]/page.tsx` — Task 4 sudah memindahkannya |
| 10 | "tes harus mengunci bahwa metadata root memuat `metadataBase`" | `app/layout.tsx` tidak dapat diimpor Vitest (`next/font/google` mengembalikan bukan fungsi). Metadata dibentuk fungsi murni `metadataSitus(source?)` di `app/lib/site-metadata.ts`; `layout.tsx` mengimpornya, tes mengunci fungsi itu |
| 10 | Sitemap membaca `listAllBooks` | `listAllBooks` berhalaman (bawaan 12) sehingga sitemap terpotong. Tambahkan `listBooksForSitemap(): Promise<Book[]>` di repository — seluruh buku, tanpa pagination, terurut judul |
| 11 | Menerima `/publish-buku` lewat `revalidasiBuku` privat di `actions.ts` | `actions.ts` hanya mengekspor fungsi async (`"use server"`), jadi daftar path dipindah ke `app/lib/books/revalidate.ts` sebagai `daftarRevalidasi(slug): Revalidasi[]` murni; `actions.ts` mengulanginya memanggil `revalidatePath` |
| 11 | Berkas `app/tests/acceptance-fase-3.test.ts` | `.tsx` — berkasnya merender halaman |
| 11 | Acceptance memanggil `createBookAction` | `createBookAction` butuh `cookies()` dan tidak dapat dipanggil di luar permintaan HTTP. Acceptance memakai lapisan yang sama dengan Fase 2 (`simpanBukuBaru`, `perbaruiBuku`, `hapusBuku`) dan memverifikasi daftar path revalidasi secara terpisah |
| 10 | Tidak disebut | `robots.ts` dan `sitemap.ts` memakai **default export** (`export default function robots()` / `sitemap()`), bukan named export — begitu kontrak Next 16.4.2 (dibaca dari `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/`). Tesnya boleh mengimpor dengan nama apa pun (`import robots from "@/app/robots"`) |


---

## Review Focus

1. **Route group `(publik)` memindahkan halaman yang sudah terverifikasi.** `/`, `/katalog/[status]`, dan `/buku/[slug]` pindah ke dalam group. URL tidak berubah, tetapi setiap route wajib diuji ulang lewat HTTP pada build produksi — bukan hanya `npm test`.
2. **Preview katalog tidak boleh membocorkan status.** Nilai `status` preview diambil dari konstanta, bukan dari URL, sehingga `/publish-buku` tidak bisa menampilkan buku upcoming di blok published atau sebaliknya.
3. **`sitemap.ts` dan `robots.ts` di-cache bawaan.** `sitemap.ts` membaca database, jadi tanpa `force-dynamic` buku baru tidak akan muncul sampai server di-restart — kelas bug yang sama dengan bug sampul Fase 2.
4. **`metadataBase` tanpa domain.** Domain belum dibeli. `siteUrl()` membaca `SITE_URL` dari environment dengan nilai bawaan `http://localhost:3000`, dan blocker-nya dicatat — bukan domain karangan yang ikut ter-commit. Tanpa `metadataBase`, build 16.4.2 hanya memberi peringatan (bukan galat), sehingga yang bocor ke produksi diam-diam adalah `http://localhost:3000` di canonical dan OG image. Karena itu tes harus mengunci bahwa metadata root memuat `metadataBase` yang berasal dari `siteUrl()`.
5. **Scroll anchor.** `Kirim Naskah` dan `Asistensi Penulisan` adalah tautan anchor biasa (`#paket`, `#asistensi`), bukan JavaScript. Kedua target wajib ada di halaman yang sama.
6. **Pesan jurnal bertitik akhir, pesan buku tidak.** `ini naskah artikel saya, admin.` dan `saya mau dibantu asistensi artikel topik [topik].` berakhir dengan titik; `Mau pesan buku cetak judul [judul]` tidak. Jangan menyeragamkan.
7. **Topik asistensi di-trim sebelum dipakai.** Spasi di awal/akhir dibuang, input kosong atau hanya spasi ditolak dengan pesan, dan topik tidak pernah dikirim ke server kita.
8. **`"use server"` hanya boleh mengekspor fungsi async.** Tidak ada berkas `"use server"` baru di fase ini; bila muncul, aturan itu berlaku.

---

### Task 1: Konten Statis Terpusat (`content/site.ts`)

**Files:**
- Create: `app/content/site.ts`
- Test: `app/content/site.test.ts`

**Interfaces:**
- Produces:
  - `NAV_UTAMA: ReadonlyArray<{ label: string; href: string }>` — hanya Beranda dan Tentang Kami
  - `TAUTAN_LAYANAN: ReadonlyArray<{ label: string; href: string }>` — untuk footer
  - `KONTAK: { adminBuku: string; adminJurnal: string }` — format tampil `0896-7189-4900`, `0895-6292-03142`
  - `PAKET_BUKU: ReadonlyArray<{ nama: string; harga: string; fasilitas: string }>` — tepat 3, semuanya placeholder
  - `FASILITAS_JURNAL: readonly string[]` — 13 item persis
  - `KATEGORI_JURNAL: readonly string[]` — tepat 3, dengan en dash di butir pertama
  - `PREVIEW_LIMIT: number` — `3`

- [ ] **Step 1: Tulis tes yang mengunci teks persis dan jumlah item**

```typescript
// app/content/site.test.ts
import { describe, it, expect } from "vitest";
import {
  NAV_UTAMA, TAUTAN_LAYANAN, KONTAK, PAKET_BUKU,
  FASILITAS_JURNAL, KATEGORI_JURNAL, PREVIEW_LIMIT,
} from "./site";

describe("content/site", () => {
  it("header hanya memuat Beranda dan Tentang Kami", () => {
    expect(NAV_UTAMA).toEqual([
      { label: "Beranda", href: "/" },
      { label: "Tentang Kami", href: "/tentang-kami" },
    ]);
  });

  it("footer mengulang tautan dua layanan", () => {
    expect(TAUTAN_LAYANAN.map((t) => t.href)).toEqual([
      "/publish-buku",
      "/publish-jurnal",
    ]);
  });

  it("nomor kontak memakai format tampil yang ditetapkan brief", () => {
    expect(KONTAK.adminBuku).toBe("0896-7189-4900");
    expect(KONTAK.adminJurnal).toBe("0895-6292-03142");
  });

  it("tepat tiga paket dan semuanya placeholder, bukan data karangan", () => {
    expect(PAKET_BUKU).toHaveLength(3);
    for (const paket of PAKET_BUKU) {
      expect(paket.nama).toBe("[Nama paket dari klien]");
      expect(paket.harga).toBe("[Harga dari klien]");
      expect(paket.fasilitas).toBe("[Fasilitas paket dari klien]");
    }
  });

  it("daftar fasilitas jurnal 13 item persis seperti brief", () => {
    expect(FASILITAS_JURNAL).toEqual([
      "LOA cepat",
      "DOI aktif",
      "dokumentasi korespondensi lengkap",
      "review transparan",
      "jurnal bukan predator",
      "revisi minor–mayor",
      "Turnitin",
      "konversi skripsi/tesis/disertasi",
      "penerjemahan artikel",
      "proofreading",
      "layout",
      "template artikel",
      "garansi terbit",
    ]);
  });

  it("tepat tiga kategori jurnal dengan en dash pada SINTA", () => {
    expect(KATEGORI_JURNAL).toEqual([
      "Jurnal Nasional Terakreditasi SINTA 1–4",
      "Jurnal Internasional Index Copernicus",
      "Jurnal Internasional Scopus dan SCImago",
    ]);
  });

  it("batas preview kecil, tetap, dan dipakai kedua preview", () => {
    expect(PREVIEW_LIMIT).toBe(3);
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run content/site.test.ts`
Expected: FAIL — modul `./site` tidak ditemukan.

- [ ] **Step 3: Implementasikan `app/content/site.ts`**

Tulis berkas berisi semua konstanta di atas. Beri komentar kepala bahwa berkas ini sengaja satu-satunya tempat teks statis, agar perombakan UI di Arena tidak menyentuh logika, dan bahwa nilai placeholder wajib diganti hanya setelah klien mengirim materi.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run content/site.test.ts`
Expected: PASS (7 tes).

- [ ] **Step 5: Commit**

```bash
git add app/content/site.ts app/content/site.test.ts
git commit -m "$(cat <<'EOF'
feat: tambah konten statis terpusat dengan placeholder klien

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Kanal WhatsApp Jurnal (`lib/whatsapp.ts`)

**Files:**
- Modify: `app/lib/whatsapp.ts`
- Modify: `app/lib/whatsapp.test.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces:
  - `buildJournalSubmitUrl(): string`
  - `buildJournalAssistUrl(topik: string): string`
  - `pesanAsistensi(topikMentah: string): { ok: true; url: string } | { ok: false; error: string }`
  - `NOMOR_JURNAL: string` (untuk ditampilkan di `/tentang-kami` bila perlu)

- [ ] **Step 1: Tambahkan tes untuk kedua pesan jurnal dan validasi topik**

```typescript
// tambahkan ke app/lib/whatsapp.test.ts
import { buildJournalSubmitUrl, buildJournalAssistUrl, pesanAsistensi } from "./whatsapp";

describe("whatsapp jurnal", () => {
  it("membentuk tautan kirim naskah dengan pesan persis", () => {
    expect(buildJournalSubmitUrl()).toBe(
      "https://wa.me/62895629203142?text=ini%20naskah%20artikel%20saya%2C%20admin."
    );
  });

  it("membentuk tautan asistensi dengan topik dan titik akhir", () => {
    const url = buildJournalAssistUrl("analisis wacana kritis");
    expect(url).toBe(
      "https://wa.me/62895629203142?text=saya%20mau%20dibantu%20asistensi%20artikel%20topik%20analisis%20wacana%20kritis."
    );
  });

  it("pesan asistensi memangkas spasi tepi sebelum dipakai", () => {
    const hasil = pesanAsistensi("  literasi digital  ");
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(decodeURIComponent(new URL(hasil.url).searchParams.get("text") ?? "")).toBe(
        "saya mau dibantu asistensi artikel topik literasi digital."
      );
    }
  });

  it("menolak topik kosong dan yang hanya berisi spasi", () => {
    for (const mentah of ["", "   ", "\t\n"]) {
      const hasil = pesanAsistensi(mentah);
      expect(hasil.ok).toBe(false);
    }
  });

  it("mempertahankan karakter khusus topik setelah didekode", () => {
    const topik = "Pendidikan & Teknologi (Edisi 2+1) — Résumé";
    const hasil = pesanAsistensi(topik);
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(decodeURIComponent(new URL(hasil.url).searchParams.get("text") ?? "")).toBe(
        `saya mau dibantu asistensi artikel topik ${topik}.`
      );
    }
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run lib/whatsapp.test.ts`
Expected: FAIL — `buildJournalSubmitUrl` bukan ekspor.

- [ ] **Step 3: Implementasikan kanal jurnal di `app/lib/whatsapp.ts`**

Tambahkan `NOMOR_JURNAL = "62895629203142"`, kedua pembentuk URL, dan `pesanAsistensi`. Komentar wajib mencatat tiga hal: pesan jurnal **berakhir titik** sedangkan pesan buku tidak; huruf awal sengaja kecil persis seperti brief; dan topik tidak pernah dikirim ke server kita.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run lib/whatsapp.test.ts`
Expected: PASS (8 tes total: 3 lama + 5 baru).

- [ ] **Step 5: Commit**

```bash
git add app/lib/whatsapp.ts app/lib/whatsapp.test.ts
git commit -m "$(cat <<'EOF'
feat: tambah kanal whatsapp jurnal dan validasi topik asistensi

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: URL Situs dari Environment (`lib/env.ts`)

**Files:**
- Modify: `app/lib/env.ts`
- Modify: `app/lib/env.test.ts`
- Modify: `app/.env.example`

**Interfaces:**
- Produces: `siteUrl(source?: EnvSource): string` — nilai `SITE_URL` tanpa garis miring di ujung; bawaan `http://localhost:3000` bila kosong atau bukan URL sah.

- [ ] **Step 1: Tulis tes untuk `siteUrl`**

```typescript
// tambahkan ke app/lib/env.test.ts
import { siteUrl } from "./env";

describe("siteUrl", () => {
  it("memakai SITE_URL apa adanya tanpa garis miring di ujung", () => {
    expect(siteUrl({ SITE_URL: "https://ciptamanuskrip.com" })).toBe("https://ciptamanuskrip.com");
    expect(siteUrl({ SITE_URL: "https://ciptamanuskrip.com/" })).toBe("https://ciptamanuskrip.com");
  });

  it("jatuh ke localhost bila belum diisi", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
    expect(siteUrl({ SITE_URL: "   " })).toBe("http://localhost:3000");
  });

  it("mengabaikan nilai yang bukan URL http(s) yang sah", () => {
    for (const salah of ["bukan-url", "ftp://contoh.com", "javascript:alert(1)"]) {
      expect(siteUrl({ SITE_URL: salah })).toBe("http://localhost:3000");
    }
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run lib/env.test.ts`
Expected: FAIL — `siteUrl` bukan ekspor.

- [ ] **Step 3: Implementasikan `siteUrl` dan tambahkan `SITE_URL` ke `.env.example`**

Terima hanya protokol `http:` atau `https:`, buang garis miring di ujung, kembalikan nilai bawaan untuk sisanya. Di `.env.example`, tulis `SITE_URL=http://localhost:3000` dengan komentar bahwa domain produksi belum dibeli dan nilai ini wajib diisi saat deploy.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run lib/env.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/lib/env.ts app/lib/env.test.ts app/.env.example
git commit -m "$(cat <<'EOF'
feat: tambah pembacaan url situs dari environment

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Layout Publik dan Beranda Final

**Files:**
- Create: `app/components/SiteHeader.tsx`
- Create: `app/components/SiteFooter.tsx`
- Create: `app/app/(publik)/layout.tsx`
- Move: `app/app/page.tsx` → `app/app/(publik)/page.tsx` (isi diganti)
- Move: `app/app/katalog/[status]/page.tsx` → `app/app/(publik)/katalog/[status]/page.tsx`
- Move: `app/app/buku/[slug]/page.tsx` → `app/app/(publik)/buku/[slug]/page.tsx`
- Modify: `app/app/globals.css`
- Test: `app/components/SiteHeader.test.tsx`, `app/components/SiteFooter.test.tsx`, `app/app/(publik)/page.test.tsx`

**Interfaces:**
- Consumes: `NAV_UTAMA`, `TAUTAN_LAYANAN` dari `content/site`
- Produces:
  - `<SiteHeader />` — tautan Beranda dan Tentang Kami saja
  - `<SiteFooter />` — nama perusahaan dan tautan layanan
  - Layout publik berisi header + `<main>` + footer

- [ ] **Step 1: Tulis tes markup untuk header, footer, dan beranda**

```typescript
// app/components/SiteHeader.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader } from "./SiteHeader";

describe("SiteHeader", () => {
  const html = renderToStaticMarkup(<SiteHeader />);

  it("menautkan Beranda dan Tentang Kami", () => {
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/tentang-kami"');
  });

  it("tidak menautkan layanan — brief membatasi header pada dua tautan", () => {
    expect(html).not.toContain('href="/publish-buku"');
    expect(html).not.toContain('href="/publish-jurnal"');
    expect(html).not.toContain('href="/katalog/');
  });
});
```

```typescript
// app/components/SiteFooter.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  const html = renderToStaticMarkup(<SiteFooter />);

  it("mengulang tautan kedua layanan", () => {
    expect(html).toContain('href="/publish-buku"');
    expect(html).toContain('href="/publish-jurnal"');
  });

  it("menyebut nama perusahaan tanpa data karangan", () => {
    expect(html).toContain("CV Cipta Manuskrip Media");
    expect(html).not.toMatch(/NIB|NPWP|@gmail|@yahoo/);
  });
});
```

```typescript
// app/app/(publik)/page.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "./page";

describe("beranda", () => {
  const html = renderToStaticMarkup(<Home />);

  it("memakai headline dan pendukung persis dari brief", () => {
    expect(html).toContain("Publikasi Semudah Beli Kopi.");
    expect(html).toContain("Layanan penerbitan buku dan publikasi artikel ilmiah.");
  });

  it("tombol mengarah ke dua halaman layanan, bukan katalog", () => {
    expect(html).toContain('href="/publish-buku"');
    expect(html).toContain('href="/publish-jurnal"');
    expect(html).toContain("Publish Buku");
    expect(html).toContain("Publish Jurnal");
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run components/SiteHeader.test.tsx components/SiteFooter.test.tsx "app/(publik)/page.test.tsx"`
Expected: FAIL — berkas belum ada.

- [ ] **Step 3: Buat komponen, layout, token warna, dan pindahkan halaman**

- `globals.css`: tambahkan token brief §4 ke blok `@theme inline` — `--color-teal`, `--color-teal-hover`, `--color-teal-soft`, `--color-lime`, `--color-lime-hover`, `--color-lime-soft`, `--color-teks`, `--color-teks-sec`, `--color-garis`, `--color-latar-alt`. Jangan mengubah token yang sudah ada.
- `SiteHeader.tsx` dan `SiteFooter.tsx`: presentasi murni, `next/link`, `<header>`/`<footer>` semantik, `aria-label` pada `nav`.
- `app/app/(publik)/layout.tsx`: `SiteHeader` → `<main className="flex-1">{children}</main>` → `SiteFooter`.
- Pindahkan tiga halaman dengan `git mv` supaya riwayatnya terjaga; isi ketiganya tidak diubah selain beranda.
- Beranda baru: headline, paragraf pendukung, dua tombol layanan memakai token teal/lime.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run components/SiteHeader.test.tsx components/SiteFooter.test.tsx "app/(publik)/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Verifikasi tidak ada route yang berubah URL**

Run: `cd app && npm run build`
Expected: build sukses dan daftar route tetap memuat `/`, `/katalog/[status]`, `/buku/[slug]`, `/admin`, tanpa path `(publik)`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: pindahkan halaman publik ke route group dengan header dan footer

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Halaman `/publish-buku` dengan Preview Katalog

**Files:**
- Create: `app/app/(publik)/publish-buku/page.tsx`
- Create: `app/components/CataloguePreview.tsx`
- Test: `app/app/(publik)/publish-buku/page.test.tsx`
- Test: `app/components/CataloguePreview.test.tsx`

**Interfaces:**
- Consumes: `listBooks({ status, page: 1, pageSize: PREVIEW_LIMIT })`, `PAKET_BUKU`, `PREVIEW_LIMIT`, `catalogueKind`
- Produces: `<CataloguePreview heading emptyMessage items lihatSemuaHref />`; halaman dengan anchor `#paket` dan `#asistensi`

- [ ] **Step 1: Tulis tes untuk `CataloguePreview` dan halaman**

```typescript
// app/components/CataloguePreview.test.tsx
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CataloguePreview } from "./CataloguePreview";
import type { Book } from "@/lib/books/types";

function buku(judul: string, slug: string): Book { /* objek Book lengkap */ }

describe("CataloguePreview", () => {
  it("merender kartu buku dan tautan Lihat Semua ke katalog status terkait", () => {
    const html = renderToStaticMarkup(
      <CataloguePreview
        heading="Buku yang Telah Terbit"
        emptyMessage="Belum ada buku yang diterbitkan."
        items={[buku("Algoritma", "algoritma")]}
        lihatSemuaHref="/katalog/telah-terbit"
      />
    );
    expect(html).toContain("Algoritma");
    expect(html).toContain('href="/katalog/telah-terbit"');
    expect(html).toContain("Lihat Semua");
  });

  it("menampilkan empty state statusnya sendiri saat daftar kosong", () => {
    const html = renderToStaticMarkup(
      <CataloguePreview
        heading="Buku Segera Terbit"
        emptyMessage="Belum ada buku yang segera terbit."
        items={[]}
        lihatSemuaHref="/katalog/segera-terbit"
      />
    );
    expect(html).toContain("Belum ada buku yang segera terbit.");
  });
});
```

```typescript
// app/app/(publik)/publish-buku/page.test.tsx
describe("publish-buku", () => {
  // 1. headline "Terbit Buku Sekali Klik." ada
  // 2. tepat 3 kartu paket, semuanya memuat ketiga placeholder klien
  // 3. anchor #paket dan #asistensi ada, tombol Kirim Naskah / Asistensi Penulisan mengarah ke sana
  // 4. kedua preview memakai PREVIEW_LIMIT dan hanya berisi statusnya sendiri (data uji nyata di DB)
  // 5. Lihat Semua menunjuk katalog yang sesuai
  // 6. saat DB mati, blok galat tampil dan halaman tidak melempar
});
```

Halaman ini async dan membaca database, jadi dirender dengan pola `await`
yang sudah diverifikasi di repo ini:

```typescript
const el = await Page();
const html = renderToStaticMarkup(el);
```

Tes halaman memakai database sungguhan dengan pola yang sama seperti
`tests/acceptance-fase-2.test.tsx` (hapus buku uji di `beforeEach`/`afterAll`),
bukan mock.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run components/CataloguePreview.test.tsx "app/(publik)/publish-buku/page.test.tsx"`
Expected: FAIL.

- [ ] **Step 3: Implementasikan komponen dan halaman**

Urutan halaman persis mengikuti brief: headline → dua tombol scroll → tiga kartu paket (`#paket`) → section asistensi (`#asistensi`) → preview published → preview upcoming. Kedua preview memakai `PREVIEW_LIMIT`. Halaman wajib `export const dynamic = "force-dynamic"`.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run components/CataloguePreview.test.tsx "app/(publik)/publish-buku/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/app/(publik)/publish-buku" app/components/CataloguePreview.tsx app/components/CataloguePreview.test.tsx
git commit -m "$(cat <<'EOF'
feat: tambah halaman publish-buku dengan preview katalog dari database

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Halaman `/publish-jurnal`

**Files:**
- Create: `app/app/(publik)/publish-jurnal/page.tsx`
- Test: `app/app/(publik)/publish-jurnal/page.test.tsx`

**Interfaces:**
- Consumes: `FASILITAS_JURNAL`
- Produces: halaman statis dengan empat area dan dua tombol

- [ ] **Step 1: Tulis tes yang mengunci headline, 13 fasilitas, empat area, dan dua tombol**

```typescript
describe("publish-jurnal", () => {
  const html = renderToStaticMarkup(<Page />);

  it("memakai headline persis", () => {
    expect(html).toContain("Publikasi Artikel Ilmiah Sekali Klik.");
  });

  it("memuat keempat area dengan satu placeholder aset yang jujur", () => {
    for (const area of ["Bukti Submission", "Dokumentasi Korespondensi", "Logo Indeksasi", "Fasilitas"]) {
      expect(html).toContain(area);
    }
    expect(html).toContain("[Aset dari klien]");
  });

  it("memuat seluruh 13 fasilitas tanpa menambah janji", () => {
    for (const f of FASILITAS_JURNAL) expect(html).toContain(f);
    expect(html).toContain("revisi minor–mayor");
  });

  it("kedua tombol menuju halaman yang benar", () => {
    expect(html).toContain('href="/publish-jurnal/kirim-artikel"');
    expect(html).toContain('href="/publish-jurnal/asistensi"');
    expect(html).toContain("Kirim Artikel");
    expect(html).toContain("Belum Ada Artikel");
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run "app/(publik)/publish-jurnal/page.test.tsx"`
Expected: FAIL.

- [ ] **Step 3: Implementasikan halaman**

Halaman statis tanpa akses database, jadi **tanpa** `force-dynamic`. Jangan menambah statistik, jumlah terbit, atau janji apa pun di luar 13 fasilitas.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run "app/(publik)/publish-jurnal/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/app/(publik)/publish-jurnal"
git commit -m "$(cat <<'EOF'
feat: tambah halaman publish-jurnal dengan fasilitas dari brief

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Halaman `/publish-jurnal/kirim-artikel`

**Files:**
- Create: `app/app/(publik)/publish-jurnal/kirim-artikel/page.tsx`
- Test: `app/app/(publik)/publish-jurnal/kirim-artikel/page.test.tsx`

**Interfaces:**
- Consumes: `KATEGORI_JURNAL`, `buildJournalSubmitUrl()`
- Produces: tiga kartu kategori, masing-masing satu tautan WhatsApp ke nomor jurnal

- [ ] **Step 1: Tulis tes untuk tiga kategori dan tautan WhatsApp**

```typescript
describe("kirim-artikel", () => {
  const html = renderToStaticMarkup(<Page />);

  it("tepat tiga kategori, tidak lebih", () => {
    for (const k of KATEGORI_JURNAL) expect(html).toContain(k);
    expect(html).toContain("SINTA 1–4");
    expect(KATEGORI_JURNAL).toHaveLength(3);
  });

  it("setiap tautan WhatsApp memakai nomor jurnal dan pesan persis", () => {
    const tautan = html.match(/href="https:\/\/wa\.me\/[^"]+"/g) ?? [];
    expect(tautan).toHaveLength(3);
    for (const t of tautan) {
      expect(t).toContain("wa.me/62895629203142?text=ini%20naskah%20artikel%20saya%2C%20admin.");
    }
  });

  it("tidak ada form unggah artikel", () => {
    expect(html).not.toContain('type="file"');
    expect(html).not.toContain("<form");
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run "app/(publik)/publish-jurnal/kirim-artikel/page.test.tsx"`
Expected: FAIL.

- [ ] **Step 3: Implementasikan halaman**

Setiap tautan wajib `target="_blank" rel="noopener noreferrer"`. Tidak ada unggahan berkas, tidak ada kategori tambahan.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run "app/(publik)/publish-jurnal/kirim-artikel/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/app/(publik)/publish-jurnal/kirim-artikel"
git commit -m "$(cat <<'EOF'
feat: tambah halaman kirim artikel dengan tiga kategori jurnal

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Halaman `/publish-jurnal/asistensi` dengan Input Topik

**Files:**
- Create: `app/app/(publik)/publish-jurnal/asistensi/page.tsx`
- Create: `app/components/FormAsistensi.tsx` (`"use client"`)
- Test: `app/app/(publik)/publish-jurnal/asistensi/page.test.tsx`
- Test: `app/components/FormAsistensi.test.tsx`

**Interfaces:**
- Consumes: `pesanAsistensi`, `KATEGORI_JURNAL`
- Produces: `<FormAsistensi />` — input teks, tombol, pesan galat di klien; memanggil `window.open(hasil.url, "_blank", "noopener,noreferrer")`

- [ ] **Step 1: Tulis tes markup halaman dan komponen**

```typescript
// app/app/(publik)/publish-jurnal/asistensi/page.test.tsx
describe("asistensi", () => {
  const html = renderToStaticMarkup(<Page />);

  it("menampilkan tiga kategori yang sama", () => {
    for (const k of KATEGORI_JURNAL) expect(html).toContain(k);
  });

  it("menyediakan input topik yang diberi label", () => {
    expect(html).toContain('name="topik"');
    expect(html).toMatch(/<label[^>]*for="topik"/);
  });
});
```

```typescript
// app/components/FormAsistensi.test.tsx
describe("FormAsistensi", () => {
  it("merender input, tombol kirim, dan area pesan galat", () => {
    const html = renderToStaticMarkup(<FormAsistensi />);
    expect(html).toContain('id="topik"');
    expect(html).toContain("Lanjut ke WhatsApp");
    expect(html).toContain('role="alert"');
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run "app/(publik)/publish-jurnal/asistensi/page.test.tsx" components/FormAsistensi.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementasikan halaman dan komponen klien**

`FormAsistensi` memegang nilai input dan pesan galat, memanggil `pesanAsistensi` saat submit, lalu `window.open`. Validasi sepenuhnya berasal dari `pesanAsistensi` — jangan menduplikasi aturan trim di komponen. Halaman tidak mengakses database dan tidak menyimpan topik di mana pun.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run "app/(publik)/publish-jurnal/asistensi/page.test.tsx" components/FormAsistensi.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/app/(publik)/publish-jurnal/asistensi" app/components/FormAsistensi.tsx app/components/FormAsistensi.test.tsx
git commit -m "$(cat <<'EOF'
feat: tambah halaman asistensi jurnal dengan input topik ke whatsapp

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Halaman `/tentang-kami`

**Files:**
- Create: `app/app/(publik)/tentang-kami/page.tsx`
- Test: `app/app/(publik)/tentang-kami/page.test.tsx`

**Interfaces:**
- Consumes: `KONTAK`
- Produces: empat area (profil/legalitas, dokumen resmi, kontak, media sosial) dengan placeholder jujur

- [ ] **Step 1: Tulis tes yang mengunci nomor kontak dan melarang data karangan**

```typescript
describe("tentang-kami", () => {
  const html = renderToStaticMarkup(<Page />);

  it("menampilkan nomor admin buku dan jurnal persis", () => {
    expect(html).toContain("0896-7189-4900");
    expect(html).toContain("0895-6292-03142");
    expect(html).toContain("Admin Buku");
    expect(html).toContain("Admin Jurnal");
  });

  it("memuat keempat area", () => {
    for (const a of ["Profil", "Dokumen Resmi", "Kontak", "Media Sosial"]) expect(html).toContain(a);
  });

  it("tidak mengarang alamat, NIB, NPWP, email, atau tautan sosial", () => {
    expect(html).not.toMatch(/NIB|NPWP/i);
    expect(html).not.toContain("http://instagram");
    expect(html).not.toContain("http://facebook");
    expect(html).not.toContain("@gmail");
  });
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run "app/(publik)/tentang-kami/page.test.tsx"`
Expected: FAIL.

- [ ] **Step 3: Implementasikan halaman**

Gunakan placeholder yang menyatakan materinya belum tersedia, bukan kalimat yang berpura-pura lengkap. Nomor tampil boleh dijadikan tautan `tel:` — bukan `wa.me`, karena brief hanya menetapkan format WhatsApp untuk tautan pesan buku/jurnal.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run "app/(publik)/tentang-kami/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/app/(publik)/tentang-kami"
git commit -m "$(cat <<'EOF'
feat: tambah halaman tentang kami dengan kontak dan placeholder legalitas

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: `robots.txt`, `sitemap.xml`, dan Metadata Situs

**Files:**
- Create: `app/app/robots.ts`
- Create: `app/app/sitemap.ts`
- Modify: `app/app/layout.tsx`
- Test: `app/app/robots.test.ts`
- Test: `app/app/sitemap.test.ts`

**Interfaces:**
- Consumes: `siteUrl`, `listAllBooks` (atau query langsung), `getBookBySlug`
- Produces:
  - `robots()` → `{ rules: { userAgent: "*", allow: "/", disallow: ["/admin"] }, sitemap: `${siteUrl()}/sitemap.xml` }`
  - `sitemap()` → route publik + satu entri per buku nyata

- [ ] **Step 1: Tulis tes untuk keduanya**

```typescript
// app/app/robots.test.ts
describe("robots", () => {
  const hasil = robots();
  it("melarang /admin", () => {
    const aturan = Array.isArray(hasil.rules) ? hasil.rules[0] : hasil.rules;
    expect(aturan.disallow).toContain("/admin");
  });
  it("menunjuk sitemap absolut", () => {
    expect(hasil.sitemap).toMatch(/^https?:\/\/.+\/sitemap\.xml$/);
  });
});
```

```typescript
// app/app/sitemap.test.ts
describe("sitemap", () => {
  // 1. memuat keenam route publik dan kedua katalog
  // 2. memuat /buku/[slug] untuk buku yang benar-benar ada di database
  // 3. tidak memuat /admin atau /admin/login
  // 4. setiap URL absolut terhadap siteUrl()
  // 5. saat database mati, tetap mengembalikan route statis tanpa melempar
});
```

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run app/robots.test.ts app/sitemap.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementasikan `robots.ts`, `sitemap.ts`, dan metadata root**

- `sitemap.ts` wajib `export const dynamic = "force-dynamic"` — tanpa itu hasilnya dibekukan saat build dan buku baru tidak pernah masuk sitemap.
- Setiap `url` di sitemap harus absolut dan dibentuk dari `siteUrl()`. `sitemap.ts` **tidak dapat membaca `metadataBase`** — nilai bawaan framework adalah `http://localhost:3000`, yang akan bocor ke produksi bila URL ditulis relatif.
- Bungkus pembacaan database dengan `try/catch`; bila gagal, kembalikan route statis saja.
- `lastModified` per buku memakai `updatedAt`.
- `layout.tsx`: tambahkan `metadataBase: new URL(siteUrl())` dan `title: { default: "CV Cipta Manuskrip Media", template: "%s — CV Cipta Manuskrip Media" }`.
- `app/buku/[slug]/page.tsx` saat ini membentuk judul lengkapnya sendiri (`${book.title} — CV Cipta Manuskrip Media`). Dengan `template` baru, itu akan menjadi dobel, jadi ubah menjadi `title: book.title` supaya template root yang menambahkan akhiran. Perilaku `try/catch` yang mengembalikan `{}` saat galat DB tetap dipertahankan.
- `title.template` menuntut `default`; tanpa itu build gagal.
- Jangan menulis `robots: { index: true }` atau objek `robots` parsial di halaman anak mana pun. Penggabungan metadata bersifat dangkal: objek `robots` dari halaman anak **menggantikan** milik layout, dan halaman admin bisa ikut terindeks.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run app/robots.test.ts app/sitemap.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app/robots.ts app/app/sitemap.ts app/app/robots.test.ts app/app/sitemap.test.ts app/app/layout.tsx
git commit -m "$(cat <<'EOF'
feat: tambah robots, sitemap dinamis, dan metadata situs

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Invalidation `/publish-buku` dan Acceptance Test Fase 3

**Files:**
- Modify: `app/app/admin/(terlindungi)/buku/actions.ts` (`revalidasiBuku`)
- Create: `app/tests/acceptance-fase-3.test.ts`
- Test: `app/app/admin/(terlindungi)/buku/actions.test.ts` (bila belum ada, buat yang memeriksa daftar path)

**Interfaces:**
- Consumes: `createBookAction`, `updateBookAction`, `deleteBookAction`, `listBooks`, `listAllBooks`, `simpanBukuBaru`
- Produces: invalidation yang mencakup `/publish-buku`, dan bukti pagination lintas lebih dari dua halaman

- [ ] **Step 1: Tulis tes invalidation dan acceptance test**

Acceptance Fase 3 wajib membuktikan, dengan database sungguhan:

1. **Dataset >12 buku lintas tiga halaman.** Masukkan 30 buku published dengan judul yang sengaja tidak berurutan saat dimasukkan; gabungkan `page 1..3` dan pastikan hasilnya sama persis dengan daftar judul terurut A–Z, tanpa duplikat dan tanpa baris hilang. Ulangi untuk 14 buku upcoming agar pemisahan status terbukti.
2. **Halaman invalid.** `?page=0`, `?page=abc`, `?page=999` menghasilkan halaman valid tanpa lempar dan tanpa loop.
3. **Admin → publik.** Tambah buku lewat `createBookAction`, lalu pastikan buku itu muncul di preview `/publish-buku`, di katalog statusnya, dan di sitemap.
4. **Slug berubah.** Setelah `updateBookAction` mengganti slug, slug lama 404 dan yang baru tampil.
5. **Hapus.** Buku hilang dari preview, katalog, dan sitemap; berkas sampul dibersihkan.
6. **`/publish-buku` tidak membocorkan status.** Blok published tidak memuat buku upcoming dan sebaliknya.

- [ ] **Step 2: Jalankan tes untuk memverifikasi kegagalan**

Run: `cd app && npx vitest run tests/acceptance-fase-3.test.ts`
Expected: FAIL — `/publish-buku` belum diinvalidasi dan/atau berkas belum ada.

- [ ] **Step 3: Tambahkan `/publish-buku` ke `revalidasiBuku`**

```typescript
function revalidasiBuku(slug: string): void {
  revalidatePath("/admin/buku");
  revalidatePath("/katalog/[status]", "page");
  revalidatePath("/publish-buku", "page");
  revalidatePath("/", "page");
  revalidatePath(`/buku/${slug}`, "page");
}
```

`sitemap.xml` sengaja **tidak** ada di daftar itu: `app/sitemap.ts` memakai
`force-dynamic`, jadi ia dibentuk ulang setiap permintaan dan tidak pernah
menyajikan hasil beku. Menambahkan `revalidatePath("/sitemap.xml")` hanya
menambah baris yang tidak melakukan apa pun.

- [ ] **Step 4: Jalankan tes untuk memverifikasi kelulusan**

Run: `cd app && npx vitest run tests/acceptance-fase-3.test.ts`
Expected: PASS.

- [ ] **Step 5: Jalankan seluruh suite**

Run: `cd app && npm test && npm run lint && npm run typecheck && npm run build`
Expected: seluruh tes lulus, lint dan typecheck bersih, build sukses dengan `/sitemap.xml` dan `/robots.txt` muncul di daftar route.

- [ ] **Step 6: Commit**

```bash
git add "app/app/admin/(terlindungi)/buku/actions.ts" app/tests/acceptance-fase-3.test.ts
git commit -m "$(cat <<'EOF'
feat: invalidasi preview publish-buku dan tambah acceptance test fase 3

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Verifikasi HTTP Build Produksi dan Laporan Progres

**Files:**
- Modify: `docs/PROGRESS.md`
- Modify: `app/README.md`

**Interfaces:**
- Tidak ada kode baru. Task ini membuktikan Task 1–11 benar-benar bekerja pada `next start`, bukan hanya di Vitest.

- [ ] **Step 1: Jalankan build produksi dan server**

Run: `cd app && npm run build && npm run start -- -p 3106`
Expected: server menyala tanpa galat.

- [ ] **Step 2: Verifikasi setiap route publik**

Dengan `curl -s -o /dev/null -w "%{http_code}"` untuk: `/`, `/tentang-kami`, `/publish-buku`, `/publish-jurnal`, `/publish-jurnal/kirim-artikel`, `/publish-jurnal/asistensi`, `/katalog/telah-terbit`, `/katalog/segera-terbit`, `/buku/<slug-nyata>`, `/robots.txt`, `/sitemap.xml`. Semuanya `200`.

Periksa isi: `robots.txt` memuat `Disallow: /admin` dan `Sitemap:`; `sitemap.xml` memuat URL absolut dan tidak memuat `/admin`.

- [ ] **Step 3: Verifikasi perubahan admin → publik pada build produksi**

Login lewat `/admin/login`, tambah buku, lalu **tanpa memulai ulang server** periksa bahwa buku muncul di `/publish-buku`, katalog, detail, dan `sitemap.xml`. Sunting slug, pastikan slug lama `404`. Hapus, pastikan hilang dari keempat tempat.

- [ ] **Step 4: Verifikasi anchor dan tautan WhatsApp pada HTML yang tersaji**

`curl -s /publish-buku | grep -o 'id="paket"\|id="asistensi"'` → keduanya ada. `curl -s /publish-jurnal/kirim-artikel | grep -o 'wa.me/62895629203142'` → tiga tautan. Tautan buku di `/buku/<slug>` menunjuk `wa.me/6289671894900`.

- [ ] **Step 5: Perbarui `docs/PROGRESS.md` dan `app/README.md`**

Catat: status Fase 3, bukti per route, keputusan batas preview 3 (`PREVIEW_LIMIT`), keputusan sitemap memuat kedua status buku, blocker `SITE_URL`/domain yang belum dibeli, serta penanda bahwa halaman statis masih memuat placeholder klien. Perbarui tabel acceptance brief §13: butir 12 menjadi lulus (dengan bukti tiga halaman), butir 14 menjadi lulus (robots, sitemap, noindex). Jangan menyebut Fase 3 selesai bila ada butir yang belum dijalankan — tulis apa adanya.

- [ ] **Step 6: Bersihkan berkas sementara dan commit**

Pastikan `.recon-dossiers.json`, `.recon-kode.json`, dan `tmp-*.txt` tidak ikut ter-commit; hapus dari working tree bila masih ada.

```bash
git add docs/PROGRESS.md app/README.md
git commit -m "$(cat <<'EOF'
docs: catat verifikasi fase 3 dan batas preview katalog

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: Berhenti**

Brief §14 menutup Fase 3 dengan "verifikasi setiap route dan perubahan admin → publik, lalu berhenti." Jangan melanjutkan ke Fase 4 (QA, handoff, deploy) tanpa instruksi pengguna.

---

## Catatan cakupan yang sengaja ditunda

| Hal | Alasan |
|---|---|
| `next/image` untuk sampul | Tes komponen mengunci `src` mentah; sampul sudah dikompres sharp. Ditunda ke Arena. |
| Perombakan visual menyeluruh | Brief §14: "UI tetap sederhana; bukan tahap desain premium." Hanya token warna §4 yang dipakai. |
| Halaman legal/PDF | Materi belum ada dari klien; brief melarang dokumen karangan. |
| Domain produksi | Hosting dan domain belum dibeli; `SITE_URL` tetap blocker yang dicatat. |
| Database uji terpisah | Di luar lingkup Fase 3; risiko sudah dicatat di `docs/PROGRESS.md`. |
