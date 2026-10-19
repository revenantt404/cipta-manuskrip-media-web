import { describe, expect, it, beforeEach, afterAll } from "vitest";
import { execute, closePool } from "../db/query";
import {
  listBooks,
  getBookBySlug,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "./repository";

async function bersihkan() {
  await execute("DELETE FROM books");
}

async function seed(
  judul: string,
  slug: string,
  status: "published" | "upcoming",
  penulis = "Penulis"
) {
  await execute(
    `INSERT INTO books (title, slug, author, cover_path, status, synopsis, estimated_release)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      judul,
      slug,
      penulis,
      `covers/${slug}.webp`,
      status,
      status === "published" ? "Sinopsis." : null,
      status === "upcoming" ? "Januari 2027" : null,
    ]
  );
}

function inputBuku(judul: string) {
  return {
    title: judul,
    author: "Penulis",
    coverPath: "covers/a.webp",
    status: "published" as const,
    synopsis: "Sinopsis.",
  };
}

describe("repository buku", () => {
  beforeEach(bersihkan);

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("mengembalikan halaman kosong ketika database kosong", async () => {
    const halaman = await listBooks({ status: "published" });
    expect(halaman.items).toHaveLength(0);
    expect(halaman.total).toBe(0);
    expect(halaman.page).toBe(1);
    expect(halaman.pageSize).toBe(12);
    expect(halaman.totalPages).toBe(1);
  });

  it("hanya mengembalikan buku dengan status yang diminta", async () => {
    await seed("Buku Terbit", "buku-terbit", "published");
    await seed("Buku Segera", "buku-segera", "upcoming");

    const terbit = await listBooks({ status: "published" });
    const segera = await listBooks({ status: "upcoming" });

    expect(terbit.items.map((b) => b.title)).toEqual(["Buku Terbit"]);
    expect(segera.items.map((b) => b.title)).toEqual(["Buku Segera"]);
  });

  it("mengurutkan A-Z tanpa membedakan huruf besar-kecil", async () => {
    await seed("zebra", "zebra", "published");
    await seed("Apel", "apel", "published");
    await seed("apel manis", "apel-manis", "published");
    await seed("Bandung", "bandung", "published");
    await seed("bandung laut", "bandung-laut", "published");

    const halaman = await listBooks({ status: "published" });
    expect(halaman.items.map((b) => b.title)).toEqual([
      "Apel",
      "apel manis",
      "Bandung",
      "bandung laut",
      "zebra",
    ]);
  });

  it("membagi hasil menjadi halaman dan melaporkan total dengan benar", async () => {
    for (let i = 1; i <= 14; i += 1) {
      await seed(`Buku ${String(i).padStart(2, "0")}`, `buku-${i}`, "published");
    }

    const halaman1 = await listBooks({ status: "published", page: 1 });
    const halaman2 = await listBooks({ status: "published", page: 2 });

    expect(halaman1.items).toHaveLength(12);
    expect(halaman2.items).toHaveLength(2);
    expect(halaman1.total).toBe(14);
    expect(halaman1.totalPages).toBe(2);
    expect(halaman1.items[0].title).toBe("Buku 01");
    expect(halaman2.items[0].title).toBe("Buku 13");
  });

  it("menormalkan nomor halaman di luar rentang", async () => {
    await seed("Buku Satu", "buku-satu", "published");
    const halaman = await listBooks({ status: "published", page: 99 });
    expect(halaman.page).toBe(1);
    expect(halaman.items).toHaveLength(1);
  });

  it("menerima pageSize dari pemanggil", async () => {
    for (let i = 1; i <= 5; i += 1) {
      await seed(`Buku ${String(i).padStart(2, "0")}`, `buku-${i}`, "published");
    }
    const halaman = await listBooks({ status: "published", pageSize: 2 });
    expect(halaman.items).toHaveLength(2);
    expect(halaman.pageSize).toBe(2);
    expect(halaman.totalPages).toBe(3);
  });

  it("menemukan buku berdasarkan slug dan mengembalikan null bila tidak ada", async () => {
    await seed("Buku Bagus", "buku-bagus", "published");
    const ditemukan = await getBookBySlug("buku-bagus");
    expect(ditemukan?.title).toBe("Buku Bagus");
    expect(await getBookBySlug("tidak-ada")).toBeNull();
  });

  it("menemukan buku berdasarkan id dan mengembalikan null bila tidak ada", async () => {
    await seed("Buku Bagus", "buku-bagus", "published");
    const lewatSlug = await getBookBySlug("buku-bagus");
    const lewatId = await getBookById(lewatSlug!.id);
    expect(lewatId?.title).toBe("Buku Bagus");
    expect(await getBookById("00000000-0000-0000-0000-000000000000")).toBeNull();
  });

  it("menyimpan judul dengan apostrof apa adanya", async () => {
    const hasil = await createBook(inputBuku("Panduan Menulis 'Karya Ilmiah'"));
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(hasil.book.title).toBe("Panduan Menulis 'Karya Ilmiah'");
    const dibaca = await getBookBySlug(hasil.book.slug);
    expect(dibaca?.title).toBe("Panduan Menulis 'Karya Ilmiah'");
  });

  it("membentuk slug otomatis dari judul", async () => {
    const hasil = await createBook(inputBuku("Terbit Buku Sekali Klik"));
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.book.slug).toBe("terbit-buku-sekali-klik");
  });

  it("menolak create dengan input tidak valid tanpa menyentuh database", async () => {
    const hasil = await createBook({ title: "   " });
    expect(hasil.ok).toBe(false);
    const halaman = await listBooks({ status: "published" });
    expect(halaman.total).toBe(0);
  });

  it("menolak slug duplikat dengan pesan yang bisa dibaca", async () => {
    const pertama = await createBook(inputBuku("Buku Sama"));
    expect(pertama.ok).toBe(true);

    const kedua = await createBook(inputBuku("Buku Sama"));
    expect(kedua.ok).toBe(false);
    if (!kedua.ok) expect(kedua.errors.slug).toBeDefined();
  });

  it("memperbarui buku dan mengubah updatedAt", async () => {
    const dibuat = await createBook(inputBuku("Judul Awal"));
    if (!dibuat.ok) throw new Error("gagal menyiapkan data");

    const sebelum = dibuat.book.updatedAt.getTime();
    await new Promise((selesai) => setTimeout(selesai, 1100));

    const hasil = await updateBook(dibuat.book.id, inputBuku("Judul Baru"));
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.book.title).toBe("Judul Baru");
    expect(hasil.book.updatedAt.getTime()).toBeGreaterThan(sebelum);
  });

  it("melaporkan gagal ketika memperbarui buku yang tidak ada", async () => {
    const hasil = await updateBook("00000000-0000-0000-0000-000000000000", inputBuku("Judul"));
    expect(hasil.ok).toBe(false);
  });

  it("menghapus buku yang ada dan melaporkan buku yang tidak ada", async () => {
    const dibuat = await createBook(inputBuku("Buku Hapus"));
    if (!dibuat.ok) throw new Error("gagal menyiapkan data");

    const hasil = await deleteBook(dibuat.book.id);
    expect(hasil.ok).toBe(true);
    expect(await getBookById(dibuat.book.id)).toBeNull();

    const lagi = await deleteBook("00000000-0000-0000-0000-000000000000");
    expect(lagi.ok).toBe(false);
  });
});
