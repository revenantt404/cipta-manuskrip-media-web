import { describe, expect, it, afterAll } from "vitest";
import { query, execute, closePool } from "./query";

describe("koneksi database", () => {
  afterAll(async () => {
    await closePool();
  });

  it("menjalankan SELECT 1 dan mengembalikan satu baris", async () => {
    const rows = await query<{ hasil: number }>("SELECT 1 AS hasil");
    expect(rows).toHaveLength(1);
    expect(rows[0].hasil).toBe(1);
  });

  it("mengembalikan tipe kolom yang benar untuk data nyata", async () => {
    const rows = await query<{ judul: string; nomor: number }>(
      "SELECT ? AS judul, ? AS nomor",
      ["Buku Uji", 42]
    );
    expect(rows[0].judul).toBe("Buku Uji");
    expect(rows[0].nomor).toBe(42);
  });

  it("menolak query dengan SQL tidak valid", async () => {
    await expect(query("SELECT * FROM tabel_yang_tidak_ada")).rejects.toThrow();
  });

  it("memperlakukan parameter sebagai nilai, bukan SQL", async () => {
    const jahat = "'; DROP TABLE books; --";
    const rows = await query<{ hasil: string }>("SELECT ? AS hasil", [jahat]);
    expect(rows[0].hasil).toBe(jahat);

    const [masihAda] = await query<{ n: number }>(
      "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'books'"
    );
    expect(masihAda.n).toBe(1);
  });

  it("execute menyisipkan dan menghapus baris sungguhan", async () => {
    const disisipkan = await execute(
      `INSERT INTO books (title, slug, author, cover_path, status, synopsis)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["Buku Uji Koneksi", "buku-uji-koneksi", "Penulis", "covers/uji.webp", "published", "Sinopsis."]
    );
    expect(disisipkan.affectedRows).toBe(1);

    const dihapus = await execute("DELETE FROM books WHERE slug = ?", ["buku-uji-koneksi"]);
    expect(dihapus.affectedRows).toBe(1);
  });
});
