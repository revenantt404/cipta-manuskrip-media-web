import { describe, expect, it, beforeEach, afterAll } from "vitest";
import { execute, closePool } from "../db/query";
import {
  listBooks,
  getBookBySlug,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  countBooksByStatus,
  listAllBooks,
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

function inputBuku(judul: string, slug?: string) {
  return {
    title: judul,
    // `slug` diabaikan `createBook` (diturunkan dari judul) dan wajib
    // `updateBook`. Memberikannya di sini membuat satu helper cukup untuk
    // kedua jalur.
    ...(slug === undefined ? {} : { slug }),
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

  it("menghitung buku per status, nol untuk status yang belum terisi", async () => {
    await seed("Terbit Satu", "terbit-satu", "published");
    await seed("Terbit Dua", "terbit-dua", "published");
    await seed("Segera Satu", "segera-satu", "upcoming");

    expect(await countBooksByStatus()).toEqual({ published: 2, upcoming: 1 });
  });

  it("menghitung nol pada kedua status ketika database kosong", async () => {
    expect(await countBooksByStatus()).toEqual({ published: 0, upcoming: 0 });
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

    const hasil = await updateBook(dibuat.book.id, inputBuku("Judul Baru", "judul-baru"));
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.book.title).toBe("Judul Baru");
    expect(hasil.book.updatedAt.getTime()).toBeGreaterThan(sebelum);
  });

  it("mengubah slug buku dan menolak slug milik buku lain", async () => {
    const a = await createBook(inputBuku("Buku Satu"));
    const b = await createBook(inputBuku("Buku Dua"));
    if (!a.ok || !b.ok) throw new Error("gagal menyiapkan data");

    const diubah = await updateBook(b.book.id, inputBuku("Buku Dua", "alamat-baru"));
    expect(diubah.ok).toBe(true);
    if (!diubah.ok) return;
    expect(diubah.book.slug).toBe("alamat-baru");
    // Alamat lama benar-benar ditinggalkan, bukan disimpan di kolom lain.
    expect(await getBookBySlug("buku-dua")).toBeNull();
    expect(await getBookBySlug("alamat-baru")).not.toBeNull();

    const bentrok = await updateBook(b.book.id, inputBuku("Buku Dua", a.book.slug));
    expect(bentrok.ok).toBe(false);
    if (!bentrok.ok) expect(bentrok.errors.slug).toBeDefined();
  });

  it("menolak slug berformat salah saat memperbarui", async () => {
    const dibuat = await createBook(inputBuku("Buku Format"));
    if (!dibuat.ok) throw new Error("gagal menyiapkan data");

    const hasil = await updateBook(dibuat.book.id, inputBuku("Buku Format", "Judul Baru!"));
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.slug).toBeDefined();
  });

  it("melaporkan gagal ketika memperbarui buku yang tidak ada", async () => {
    const hasil = await updateBook("00000000-0000-0000-0000-000000000000", inputBuku("Judul", "judul"));
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

/**
 * Daftar admin berbeda dari daftar publik dalam satu hal penting: ia tidak
 * menyaring per status. Kalau penyaringan itu terbawa ke sini, buku yang
 * baru disimpan sebagai `upcoming` akan hilang dari pandangan admin — dan
 * itu buku yang paling mungkin ingin ia periksa lagi.
 */
describe("listAllBooks", () => {
  beforeEach(bersihkan);

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("mengembalikan buku dari kedua status", async () => {
    await seed("Buku Terbit", "buku-terbit", "published");
    await seed("Buku Segera", "buku-segera", "upcoming");

    const halaman = await listAllBooks();

    expect(halaman.total).toBe(2);
    expect(halaman.items.map((b) => b.status).sort()).toEqual(["published", "upcoming"]);
  });

  it("menaruh buku yang paling baru disunting di atas", async () => {
    await seed("Lama", "lama", "published");
    await seed("Baru", "baru", "published");
    await execute("UPDATE books SET updated_at = '2020-01-01 00:00:00' WHERE slug = ?", ["lama"]);

    const halaman = await listAllBooks();

    expect(halaman.items.map((b) => b.title)).toEqual(["Baru", "Lama"]);
  });
});
