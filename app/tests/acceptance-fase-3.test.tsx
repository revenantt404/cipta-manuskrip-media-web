import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { execute, closePool } from "@/lib/db/query";
import { listBooks, getBookBySlug } from "@/lib/books/repository";
import { simpanBukuBaru, perbaruiBuku, hapusBuku } from "@/lib/books/manage";
import { daftarRevalidasi } from "@/lib/books/revalidate";
import { siteUrl } from "@/lib/env";
import HalamanKatalog from "@/app/(publik)/katalog/[status]/page";
import HalamanPreview from "@/app/(publik)/publish-buku/page";
import HalamanDetail from "@/app/(publik)/buku/[slug]/page";
import LayoutPublik from "@/app/(publik)/layout";
import sitemap from "@/app/sitemap";

/**
 * Acceptance test Fase 3 — brief §13 (terutama butir 12) plus invalidation
 * `/publish-buku` dari Task 11.
 *
 * Database sungguhan, halaman sungguhan dirender dari baris yang baru saja
 * ditulis, tanpa mock. Dua batas yang jujur, dilanjutkan dari Fase 2:
 *
 * - Server Action (`createBookAction`, dll.) memanggil `requireAdmin`,
 *   yang membaca cookie lewat `next/headers` dan hanya hidup di dalam
 *   permintaan HTTP — tidak bisa dipanggil dari Vitest. Mutasi di sini
 *   memakai lapisan yang sama (`simpanBukuBaru`, `perbaruiBuku`,
 *   `hapusBuku`), dan daftar alamat yang diinvalidasi diverifikasi
 *   terpisah lewat `daftarRevalidasi`. Verifikasi cache produksinya
 *   sendiri (`revalidatePath` benar-benar membuang hasil beku) dijalankan
 *   lewat `curl` terhadap `next start` dan dicatat di `docs/PROGRESS.md`
 *   (Task 12).
 * - `notFound()` juga hanya hidup di dalam permintaan. Konsekuensi
 *   "slug lama 404" yang bisa dibuktikan di sini: baris untuk slug itu
 *   memang sudah tidak ada (`getBookBySlug` → null), sehingga halaman di
 *   alamat itu pasti jatuh ke `notFound()` saat diminta sungguhan.
 */

const DIR_UJI = path.join(process.cwd(), "storage", "covers-uji-acceptance-3");

const UKURAN_HALAMAN = 12;

type StatusUji = "published" | "upcoming";

async function gambar(warna: { r: number; g: number; b: number }): Promise<Buffer> {
  return sharp({
    create: { width: 120, height: 180, channels: 3, background: warna },
  })
    .jpeg()
    .toBuffer();
}

function formBuku(
  teks: {
    title: string;
    slug?: string;
    synopsis?: string;
    status?: StatusUji;
    estimatedRelease?: string;
  },
  sampul?: Buffer
): FormData {
  const data = new FormData();
  data.set("title", teks.title);
  data.set("slug", teks.slug ?? "");
  data.set("author", "Penulis Acceptance");
  data.set("synopsis", teks.synopsis ?? "Sinopsis singkat untuk pengujian.");
  data.set("publisherInfo", "CV Cipta Manuskrip Media");
  data.set("bookInfo", "");
  data.set("status", teks.status ?? "published");
  data.set("estimatedRelease", teks.estimatedRelease ?? "");
  if (sampul === undefined) {
    // Bentuk yang dikirim browser saat admin tidak memilih berkas baru.
    data.set("cover", new File([], "", { type: "application/octet-stream" }));
  } else {
    data.set("cover", new File([new Uint8Array(sampul).buffer], "s.jpg", { type: "image/jpeg" }));
  }
  return data;
}

/** Menyimpan satu buku lewat jalur nyata dan melempar bila gagal. */
async function seedBuku(judul: string, status: StatusUji = "published") {
  const teks: Parameters<typeof formBuku>[0] =
    status === "upcoming"
      ? { title: judul, status, estimatedRelease: "Januari 2027", synopsis: "" }
      : { title: judul, status };
  const hasil = await simpanBukuBaru(formBuku(teks, await gambar({ r: 120, g: 120, b: 140 })));
  if (!hasil.ok) throw new Error(`seed "${judul}" gagal: ${JSON.stringify(hasil.errors)}`);
  return hasil.book;
}

/** Seed langsung ke database, tanpa sampul nyata — cukup untuk query. */
async function seedMentah(judul: string, slug: string, status: StatusUji) {
  await execute(
    `INSERT INTO books (title, slug, author, cover_path, status, synopsis, estimated_release)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      judul,
      slug,
      "Penulis Acceptance",
      `covers/${slug}.webp`,
      status,
      status === "published" ? "Sinopsis." : null,
      status === "upcoming" ? "Januari 2027" : null,
    ]
  );
}

async function bersihkan() {
  await execute("DELETE FROM books");
  // `maxRetries` seperti Fase 2: di Windows sesekali folder masih digenggam
  // sesaat, dan `rmSync` gagal EPERM sebagai kegagalan tes yang nyaris
  // mustahil ditelusuri.
  rmSync(DIR_UJI, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  mkdirSync(DIR_UJI, { recursive: true });
}

async function berkasTersimpan(): Promise<string[]> {
  return existsSync(DIR_UJI) ? readdirSync(DIR_UJI) : [];
}

function berkasAda(coverPath: string): boolean {
  return existsSync(path.join(DIR_UJI, path.basename(coverPath)));
}

/** Merender `/publish-buku` dari keadaan database saat ini. */
async function htmlPreview(): Promise<string> {
  const el = await HalamanPreview();
  return renderToStaticMarkup(el);
}

/** Merender satu halaman katalog untuk status dan `?page=` tertentu. */
async function htmlKatalog(status: string, page?: string): Promise<string> {
  const el = await HalamanKatalog({
    params: Promise.resolve({ status }),
    searchParams: Promise.resolve(page === undefined ? {} : { page }),
  });
  return renderToStaticMarkup(el);
}

/** Merender halaman detail `/buku/[slug]`. */
async function htmlDetail(slug: string): Promise<string> {
  const el = await HalamanDetail({ params: Promise.resolve({ slug }) });
  return renderToStaticMarkup(el);
}

/** Seluruh URL sitemap saat ini. */
async function urlsSitemap(): Promise<string[]> {
  return (await sitemap()).map((e) => e.url);
}

const dasar = siteUrl();

/** Memisah blok preview: isi antara penanda blok ini dan yang lainnya. */
function blokPreview(html: string, penanda: string, penandaLain: string): string {
  const setelah = html.split(penanda)[1] ?? "";
  return setelah.split(penandaLain)[0] ?? "";
}

const PENANDA_TERBIT = 'data-testid="preview-telah-terbit"';
const PENANDA_SEGERA = 'data-testid="preview-segera-terbit"';

beforeEach(async () => {
  process.env.COVER_DIR = "storage/covers-uji-acceptance-3";
  await bersihkan();
});

afterAll(async () => {
  await bersihkan();
  rmSync(DIR_UJI, { recursive: true, force: true });
  delete process.env.COVER_DIR;
  await closePool();
});

/* ------------------------------------------------------------------ */
/* Daftar revalidasi — invalidation Task 11                             */
/* ------------------------------------------------------------------ */

describe("daftar revalidasi mencakup /publish-buku", () => {
  it("memuat seluruh halaman yang isinya bergantung pada satu buku", () => {
    const daftar = daftarRevalidasi("buku-uji");

    expect(daftar.map((e) => e.path)).toEqual([
      "/admin/buku",
      "/katalog/[status]",
      "/publish-buku",
      "/",
      "/buku/buku-uji",
    ]);
  });

  it("halaman dinamis ditandai page agar revalidatePath memengaruhinya", () => {
    const daftar = daftarRevalidasi("x");
    expect(daftar.find((e) => e.path === "/katalog/[status]")?.type).toBe("page");
    expect(daftar.find((e) => e.path === "/publish-buku")?.type).toBe("page");
    expect(daftar.find((e) => e.path === "/")?.type).toBe("page");
    expect(daftar.find((e) => e.path === "/buku/x")?.type).toBe("page");
    // `/admin/buku` tidak butuh tipe — persis perilaku kode sebelumnya.
    expect(daftar.find((e) => e.path === "/admin/buku")?.type).toBeUndefined();
  });

  it("sitemap.xml tidak ada di daftar karena sitemap force-dynamic", () => {
    const path = daftarRevalidasi("x").map((e) => e.path);
    expect(path.join(" ")).not.toContain("sitemap");
  });
});

/* ------------------------------------------------------------------ */
/* §13.12 — sorting A–Z; pagination; invalid page; pemisahan status     */
/* ------------------------------------------------------------------ */

describe("§13.12 — pagination lintas tiga halaman", () => {
  it("30 published: gabungan page 1..3 persis daftar terurut A–Z tanpa dobel/bolong", async () => {
    // 30 judul unik, disengaja tidak berurutan — dan dimasukkan tidak
    // berurutan (dari ujung akhir ke depan), jadi urutan A–Z justru
    // terbalik dari urutan insert. Sort yang lolos karena kebetulan
    // urutan nyaring di sini.
    const huruf = "ZYXWVUTSRQPONMLKJIHGFEDCBA".split("");
    const judul = huruf.map((h) => `Judul ${h}`);
    expect(judul.length).toBe(26);
    // …plus 4 lagi supaya genap 30 dan tetap tersebar (di interstisi).
    judul.push("Judul ZZ1", "Judul ZZ2", "Judul ZZ3", "Judul ZZ4");

    for (let i = judul.length - 1; i >= 0; i -= 1) {
      await seedMentah(judul[i], `seed-${i}`, "published");
    }

    const pertama = await listBooks({ status: "published", page: 1, pageSize: UKURAN_HALAMAN });
    expect(pertama.total).toBe(30);
    expect(pertama.totalPages).toBe(3);

    const gabungan: string[] = [];
    for (let p = 1; p <= 3; p += 1) {
      const halaman = await listBooks({ status: "published", page: p, pageSize: UKURAN_HALAMAN });
      // Halaman ketiga menyisakan 30 − 24 = 6 baris.
      expect(halaman.items).toHaveLength(p === 3 ? 6 : UKURAN_HALAMAN);
      gabungan.push(...halaman.items.map((b) => b.title));
    }

    // Dengan judul `Judul X` yang berformat sama semua, urutan JavaScript
    // (perbandingan string bawaan) harus keluar sama persis dengan urutan
    // MySQL di atasnya — invarian "kedua penyortir sepakat".
    const tersortirSederhana = [...gabungan].sort();
    expect(gabungan).toEqual(tersortirSederhana);

    // Tanpa dobel dan tanpa baris hilang.
    expect(new Set(gabungan).size).toBe(30);
    for (const j of judul) expect(gabungan).toContain(j);
  });

  it("14 upcoming: dua halaman, terurut, dan tidak memuat published", async () => {
    for (let i = 1; i <= 14; i += 1) {
      await seedMentah(`Segera ${i}`, `segera-${i}`, "upcoming");
    }

    const halaman1 = await listBooks({ status: "upcoming", page: 1, pageSize: UKURAN_HALAMAN });
    const halaman2 = await listBooks({ status: "upcoming", page: 2, pageSize: UKURAN_HALAMAN });
    expect(halaman1.totalPages).toBe(2);
    expect(halaman1.items).toHaveLength(12);
    expect(halaman2.items).toHaveLength(2);
    expect(halaman2.page).toBe(2);

    const gabungan = [...halaman1.items, ...halaman2.items].map((b) => b.title);
    expect(gabungan).toEqual([...gabungan].sort());
    expect(new Set(gabungan).size).toBe(14);

    // Pemisahan status pada level pagination itu sendiri.
    for (let i = 1; i <= 5; i += 1) {
      await seedMentah(`Terbit ${i}`, `terbit-${i}`, "published");
    }
    const sesudahTambahan = [
      ...(await listBooks({ status: "upcoming", page: 1, pageSize: UKURAN_HALAMAN })).items,
      ...(await listBooks({ status: "upcoming", page: 2, pageSize: UKURAN_HALAMAN })).items,
    ].map((b) => b.title);
    expect(sesudahTambahan.every((t) => t.startsWith("Segera "))).toBe(true);
    expect(sesudahTambahan.some((t) => t.startsWith("Terbit "))).toBe(false);
  });
});

describe("§13.12 — halaman ?page= tidak sah", () => {
  beforeEach(async () => {
    await seedMentah("Buku Untuk Halaman", "buku-untuk-halaman", "published");
    await seedMentah("Buku Untuk Halaman Dua", "buku-untuk-halaman-dua", "published");
  });

  it("page=0, page=abc, dan page=999 semuanya halaman valid tanpa lempar", async () => {
    for (const pageMentah of ["0", "abc", "999"]) {
      const html = await htmlKatalog("telah-terbit", pageMentah);

      // Halaman dirender penuh — tidak lempar, tidak galat DB.
      expect(html).not.toContain("data-testid=\"db-error\"");
      expect(html).toContain("Buku yang Telah Terbit");
      // Dua buku → totalPages 1 → setiap `?page=` aneh harus jatuh ke
      // halaman yang memang ada, bukan halaman kosong.
      expect(html).toContain("Buku Untuk Halaman");
    }
  });
});

/* ------------------------------------------------------------------ */
/* Admin → publik: tambah                                               */
/* ------------------------------------------------------------------ */

describe("admin tambah → publik", () => {
  it("buku baru muncul di preview /publish-buku, katalog, dan sitemap", async () => {
    const terbit = await seedBuku("Aep Buku Baru Admin", "published");
    const segera = await seedBuku("Aep Segera Buku Admin", "upcoming");

    const preview = await htmlPreview();
    expect(blokPreview(preview, PENANDA_TERBIT, PENANDA_SEGERA)).toContain(terbit.title);
    expect(blokPreview(preview, PENANDA_SEGERA, PENANDA_TERBIT)).toContain(segera.title);

    expect(await htmlKatalog("telah-terbit")).toContain(terbit.title);
    expect(await htmlKatalog("segera-terbit")).toContain(segera.title);

    const urls = await urlsSitemap();
    expect(urls).toContain(`${dasar}/buku/${terbit.slug}`);
    expect(urls).toContain(`${dasar}/buku/${segera.slug}`);
  });
});

/* ------------------------------------------------------------------ */
/* Admin → publik: slug berubah                                         */
/* ------------------------------------------------------------------ */

describe("admin ubah slug → publik", () => {
  it("slug lama tidak menyajikan buku ini lagi, slug baru tampil penuh", async () => {
    const buku = await seedBuku("Buku Kedudukan", "published");
    const slugLama = buku.slug;

    const ubah = await perbaruiBuku(
      buku.id,
      formBuku({ title: "Buku Kedudukan", slug: "buku-kedudukan-baru" })
    );
    expect(ubah.ok).toBe(true);
    if (!ubah.ok) return;
    expect(ubah.slugLama).toBe(slugLama);
    expect(ubah.book.slug).toBe("buku-kedudukan-baru");

    // Alamat lama kosong: halaman per-slug akan notFound() saat diminta.
    // `notFound()` tidak dapat dipanggil di luar permintaan HTTP; yang
    // dibuat di sini konsekuensinya — barisnya sudah tidak ada.
    expect(await getBookBySlug(slugLama)).toBeNull();
    expect(await getBookBySlug("buku-kedudukan-baru")).not.toBeNull();

    const html = await htmlDetail("buku-kedudukan-baru");
    expect(html).toContain("Buku Kedudukan");

    // Katalog tidak boleh lagi merujuk alamat lama dalam bentuk tautan.
    // Perbandingannya tautan utuh, bukan substring: alamat baru
    // (`/buku/buku-kedudukan-baru`) memuat alamat lama sebagai awalan.
    const katalog = await htmlKatalog("telah-terbit");
    expect(katalog).toContain('/buku/buku-kedudukan-baru"');
    expect(katalog).not.toContain(`/buku/${slugLama}"`);
  });
});

/* ------------------------------------------------------------------ */
/* Admin → publik: hapus                                                */
/* ------------------------------------------------------------------ */

describe("admin hapus → publik", () => {
  it("buku hilang dari preview, katalog, sitemap; sampul dibersihkan", async () => {
    const terbit = await seedBuku("Buku Dupan", "published");
    const segera = await seedBuku("Buku Dupan Segera", "upcoming");

    const hapusTerbit = await hapusBuku(terbit.id);
    expect(hapusTerbit.ok).toBe(true);
    const hapusSegera = await hapusBuku(segera.id);
    expect(hapusSegera.ok).toBe(true);

    const preview = await htmlPreview();
    expect(blokPreview(preview, PENANDA_TERBIT, PENANDA_SEGERA)).not.toContain("Buku Dupan");
    expect(blokPreview(preview, PENANDA_SEGERA, PENANDA_TERBIT)).not.toContain("Buku Dupan");

    expect(await htmlKatalog("telah-terbit")).not.toContain("Buku Dupan");
    expect(await htmlKatalog("segera-terbit")).not.toContain("Buku Dupan");

    const urls = await urlsSitemap();
    expect(urls).not.toContain(`${dasar}/buku/${terbit.slug}`);
    expect(urls).not.toContain(`${dasar}/buku/${segera.slug}`);

    // Berkas sampul keduanya ikut dibersihkan oleh lapisan hapus.
    expect(berkasAda(terbit.coverPath)).toBe(false);
    expect(berkasAda(segera.coverPath)).toBe(false);
    expect(await berkasTersimpan()).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* §13.6 — `/publish-buku` tidak membocorkan status                      */
/* ------------------------------------------------------------------ */

describe("§13.6 preview tidak membocorkan status", () => {
  it("blok published tidak memuat upcoming dan sebaliknya", async () => {
    for (let i = 1; i <= 4; i += 1) await seedMentah(`Terbit ${i}`, `terbit-${i}`, "published");
    for (let i = 1; i <= 4; i += 1) await seedMentah(`Segera ${i}`, `segera-${i}`, "upcoming");

    const preview = await htmlPreview();
    const terbit = blokPreview(preview, PENANDA_TERBIT, PENANDA_SEGERA);
    const segera = blokPreview(preview, PENANDA_SEGERA, PENANDA_TERBIT);

    // PREVIEW_LIMIT = 3: tiga teratas A–Z muncul, yang keempat tidak —
    // kegagalan batas akan terbaca di sini, bukan diteruskan diam-diam.
    expect(terbit).toContain("Terbit 1");
    expect(terbit).toContain("Terbit 2");
    expect(terbit).toContain("Terbit 3");
    expect(terbit).not.toContain("Terbit 4");
    expect(terbit).not.toContain("Segera ");

    expect(segera).toContain("Segera 1");
    expect(segera).toContain("Segera 2");
    expect(segera).toContain("Segera 3");
    expect(segera).not.toContain("Segera 4");
    expect(segera).not.toContain("Terbit ");
  });

  it("database kosong: kedua blok memuat pesan kosongnya sendiri", async () => {
    const preview = await htmlPreview();
    expect(preview).toContain("Belum ada buku yang diterbitkan.");
    expect(preview).toContain("Belum ada buku yang segera terbit.");
  });
});

/* ------------------------------------------------------------------ */
/* Ruling AF — layout publik menghasilkan tepat satu <main>             */
/* ------------------------------------------------------------------ */

describe("Ruling AF — layout publik satu <main>", () => {
  it("layout publik di sekeliling halaman nyata memuat persis satu <main>", async () => {
    // Dengan baris nyata di database, isi halaman yang dirender bukan
    // kosong; kegagalan membungkus halaman (mis. `<main>` tambahan dari
    // halaman itu sendiri) terbaca di sini.
    await seedMentah("Buku Kotak", "buku-kotak", "published");

    const isi = await HalamanPreview();
    // Typegen menandai `params` wajib walau tidak ada segmen dinamis di
    // `(publik)` — bendanya `Promise` kosong sesuai bentuk yang diminta.
    const el = LayoutPublik({ params: Promise.resolve({}), children: isi });
    const html = renderToStaticMarkup(el);

    expect((html.match(/<main\b/g) ?? []).length).toBe(1);
    // Dan `<main>` itu benar-benar memuat isi halaman.
    expect(html).toContain("Buku Kotak");
  });
});
