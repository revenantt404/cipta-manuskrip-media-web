import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Page from "./page";
import { execute, query, closePool } from "@/lib/db/query";
import { PREVIEW_LIMIT, PAKET_BUKU } from "@/content/site";

/**
 * Halaman `/publish-buku` — brief §10.
 *
 * Database sungguhan, bukan mock: yang diuji adalah halaman yang benar
 * menampilkan buku nyata dari tabel `books`. Dua hal yang perlu dijaga:
 *
 * 1. Preview published tidak pernah memuat buku upcoming — kebocoran status
 *    inilah yang paling merusak penawaran (buku yang belum terbit tampil
 *    sebagai sudah terbit).
 * 2. Kegagalan database tidak boleh menggagalkan seluruh dokumen; blok galat
 *    tampil dan sisa halaman tetap terbaca.
 */

async function seed(judul: string, slug: string, status: "published" | "upcoming") {
  await execute(
    `INSERT INTO books (title, slug, author, cover_path, status, synopsis, estimated_release)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      judul,
      slug,
      "Penulis Uji",
      `covers/${slug}.webp`,
      status,
      status === "published" ? "Sinopsis." : null,
      status === "upcoming" ? "Januari 2027" : null,
    ]
  );
}

async function slugsDibaca(status: "published" | "upcoming"): Promise<string[]> {
  const baris = await query<{ slug: string }>("SELECT slug FROM books WHERE status = ?", [status]);
  return baris.map((b) => b.slug);
}

beforeEach(async () => {
  await execute("DELETE FROM books");
});

afterAll(async () => {
  await execute("DELETE FROM books");
  await closePool();
});

describe("publish-buku", () => {
  it("menampilkan headline brief dan dua tombol scroll ke anchor", async () => {
    const el = await Page();
    const html = renderToStaticMarkup(el);

    expect(html).toContain("Terbit Buku Sekali Klik.");
    expect(html).toContain('href="#paket"');
    expect(html).toContain('href="#asistensi"');
    expect(html).toContain("Kirim Naskah");
    expect(html).toContain("Asistensi Penulisan");
  });

  it("memuat id paket dan asistensi sebagai target scroll", async () => {
    const el = await Page();
    const html = renderToStaticMarkup(el);

    expect(html).toContain('id="paket"');
    expect(html).toContain('id="asistensi"');
  });

  /**
   * Section asistensi buku harus benar-benar bisa dipakai, bukan sekadar
   * teks: formnya mengirim topik ke admin buku dengan label yang menyebut
   * "buku" secara eksplisit, sehingga tidak tertukar dengan form artikel.
   */
  it("menyediakan form asistensi buku dengan label dan input buku", async () => {
    const el = await Page();
    const html = renderToStaticMarkup(el);

    expect(html).toContain("Topik Asistensi Penulisan Buku");
    expect(html).toContain('id="topik-buku"');
    expect(html).toContain("Lanjut ke WhatsApp");
    // Label artikel jurnal tidak boleh muncul di halaman buku.
    expect(html).not.toContain("Topik Asistensi Penulisan Artikel Jurnal Ilmiah");
  });

  it("mencetak tiga tier harga contoh berurutan, dengan fasilitas per-tier yang berbeda", async () => {
    const el = await Page();
    const html = renderToStaticMarkup(el);

    expect(html).toContain("Paket Eksklusif");
    expect(html).toContain("Rp7.500.000");
    expect(html).toContain("Paket Profesional");
    expect(html).toContain("Rp4.500.000");
    expect(html).toContain("Paket Dasar");
    expect(html).toContain("Rp2.500.000");
    expect(html).toContain("Penyuntingan naskah");
    expect(html).toContain("Tata letak isi buku");
    expect(html).toContain("bukan penawaran resmi");

    expect(PAKET_BUKU).toHaveLength(3);
    expect(new Set(PAKET_BUKU.map((paket) => paket.fasilitas.join("|"))).size).toBe(3);
  });

  it("dua preview masing-masing memuat PREVIEW_LIMIT buku statusnya sendiri", async () => {
    // Lima published dan lima upcoming: lebih banyak dari satu halaman
    // preview, jadi kalau salah satu blok tumpah ke blok lain, assertion
    // kebetulan hanya melulus ini menjadikannya terbaca.
    for (let i = 1; i <= 5; i += 1) await seed(`Terbit ${i}`, `terbit-${i}`, "published");
    for (let i = 1; i <= 5; i += 1) await seed(`Segera ${i}`, `segera-${i}`, "upcoming");

    const el = await Page();
    const html = renderToStaticMarkup(el);

    // Setiap blok dipisah dengan penanda sendiri supaya kebocoran status
    // benar-benar terbaca: assertion `toContain` pada seluruh dokumen tidak
    // bisa membedakan "tampil di bloknya sendiri" dari "tampil di blok lain",
    // karena kedua judul memang ada di halaman.
    const penandaTerbit = 'data-testid="preview-telah-terbit"';
    const penandaSegera = 'data-testid="preview-segera-terbit"';
    expect(html).toContain(penandaTerbit);
    expect(html).toContain(penandaSegera);

    const setelahPenandaTerbit = html.split(penandaTerbit)[1] ?? "";
    const isiTerbit = setelahPenandaTerbit.split(penandaSegera)[0] ?? "";
    const isiSegera = setelahPenandaTerbit.split(penandaSegera)[1] ?? "";

    // Blok published: tiga teratas berurutan A–Z dari lima, tanpa satu pun
    // judul upcoming.
    for (let i = 1; i <= PREVIEW_LIMIT; i += 1) {
      expect(isiTerbit).toContain(`Terbit ${i}`);
    }
    for (let i = PREVIEW_LIMIT + 1; i <= 5; i += 1) {
      expect(isiTerbit).not.toContain(`Terbit ${i}`);
    }
    expect(isiTerbit).not.toContain("Segera ");

    // Blok upcoming: kebalikannya.
    for (let i = 1; i <= PREVIEW_LIMIT; i += 1) {
      expect(isiSegera).toContain(`Segera ${i}`);
    }
    for (let i = PREVIEW_LIMIT + 1; i <= 5; i += 1) {
      expect(isiSegera).not.toContain(`Segera ${i}`);
    }
    expect(isiSegera).not.toContain("Terbit ");

    // Pembacaan kembali dari DB memastikan baris yang diuji nyata.
    expect(await slugsDibaca("published")).toHaveLength(5);
    expect(await slugsDibaca("upcoming")).toHaveLength(5);
  });

  it("Lihat Semua menunjuk katalog status yang tepat", async () => {
    const el = await Page();
    const html = renderToStaticMarkup(el);

    expect(html).toContain('href="/katalog/telah-terbit"');
    expect(html).toContain('href="/katalog/segera-terbit"');
  });

  it("saat database mati, blok galat tampil dan halaman tidak melempar", async () => {
    await execute("DELETE FROM books");

    // Baca env dari sudah-tuang config, lalu arahkan ke port mati dan paksa
    // pool baru diambil oleh readEnv.
    const asliHost = process.env.DB_HOST;
    const asliPort = process.env.DB_PORT;
    try {
      await closePool();
      process.env.DB_HOST = "127.0.0.1";
      process.env.DB_PORT = "1";

      const el = await Page();
      const html = renderToStaticMarkup(el);

      expect(html).toContain("Terbit Buku Sekali Klik.");
      expect(html).toContain("data-testid=\"db-error\"");
    } finally {
      process.env.DB_HOST = asliHost;
      process.env.DB_PORT = asliPort;
      await closePool();
    }
  });
});
