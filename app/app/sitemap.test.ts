import { describe, it, expect, beforeEach, afterAll } from "vitest";
import sitemap, { ROUTE_STATIS } from "./sitemap";
import { execute, query, closePool } from "@/lib/db/query";
import { listBooksForSitemap } from "@/lib/books/repository";
import { siteUrl } from "@/lib/env";

const dasar = siteUrl();

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

beforeEach(async () => {
  await execute("DELETE FROM books");
});

afterAll(async () => {
  await execute("DELETE FROM books");
  await closePool();
});

describe("sitemap", () => {
  it("memuat keenam route publik dan kedua katalog", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    expect(ROUTE_STATIS).toEqual([
      "/",
      "/tentang-kami",
      "/publish-buku",
      "/publish-jurnal",
      "/publish-jurnal/kirim-artikel",
      "/publish-jurnal/asistensi",
      "/katalog/telah-terbit",
      "/katalog/segera-terbit",
    ]);
    for (const jalur of ROUTE_STATIS) {
      expect(urls).toContain(`${dasar}${jalur}`);
    }
  });

  it("memuat /buku/[slug] untuk setiap buku kedua status", async () => {
    await seed("Buku Terbit", "buku-terbit", "published");
    await seed("Buku Segera", "buku-segera", "upcoming");

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain(`${dasar}/buku/buku-terbit`);
    expect(urls).toContain(`${dasar}/buku/buku-segera`);
  });

  it("memuat seluruh buku, bukan terpotong pagination bawaan", async () => {
    // 15 buku melebihi PAGE_SIZE_BAWAAN (12) — bila implementasi salah
    // memakai daftar berhalaman, assertion ini gagal.
    for (let i = 1; i <= 15; i += 1) await seed(`Buku ${i}`, `buku-${i}`, "published");

    const urls = (await sitemap()).filter((e) => e.url.includes("/buku/")).map((e) => e.url);

    expect(urls).toHaveLength(15);
  });

  it("entri buku memakai lastModified dari updatedAt", async () => {
    await seed("Buku Waktu", "buku-waktu", "published");

    const entri = (await sitemap()).find((e) => e.url === `${dasar}/buku/buku-waktu`);
    expect(entri).toBeDefined();

    // updatedAt dibaca kembali dari database untuk memastikan bahwa
    // lastModified benar-benar berasal dari kolom itu, bukan `new Date()`
    // yang kebetulan mirip.
    const baris = await query<{ updated_at: unknown }>(
      "SELECT updated_at FROM books WHERE slug = ?",
      ["buku-waktu"]
    );
    const updatedAt = new Date(String(baris[0].updated_at));

    expect(entri!.lastModified instanceof Date).toBe(true);
    expect((entri!.lastModified as Date).getTime()).toBe(updatedAt.getTime());
  });

  it("tidak memuat /admin atau /admin/login", async () => {
    await seed("Buku Biasa", "buku-biasa", "published");

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
  });

  it("setiap URL absolut terhadap siteUrl()", async () => {
    for (const entri of await sitemap()) {
      expect(entri.url.startsWith(`${dasar}/`)).toBe(true);
      // Bentuk absolut sesungguhnya, bukan hanya prefiks yang kebetulan cocok.
      const url = new URL(entri.url);
      expect(url.origin).toBe(new URL(dasar).origin);
    }
  });

  it("listBooksForSitemap mengurutkan per judul tanpa melihat status", async () => {
    await seed("Zebra", "zebra", "upcoming");
    await seed("Apel", "apel", "published");

    const buku = await listBooksForSitemap();

    expect(buku.map((b) => b.slug)).toEqual(["apel", "zebra"]);
  });

  it("saat database mati, tetap mengembalikan route statis tanpa melempar", async () => {
    const asliHost = process.env.DB_HOST;
    const asliPort = process.env.DB_PORT;
    try {
      await closePool();
      process.env.DB_HOST = "127.0.0.1";
      process.env.DB_PORT = "1";

      const hasil = await sitemap();
      const urls = hasil.map((e) => e.url);

      for (const jalur of ROUTE_STATIS) {
        expect(urls).toContain(`${dasar}${jalur}`);
      }
      expect(urls.filter((u) => u.includes("/buku/"))).toHaveLength(0);
    } finally {
      process.env.DB_HOST = asliHost;
      process.env.DB_PORT = asliPort;
      await closePool();
    }
  });
});
