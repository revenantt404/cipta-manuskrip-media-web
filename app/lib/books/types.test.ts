import { describe, expect, it } from "vitest";
import { mapRow } from "./types";

/**
 * `mapRow` menerjemahkan nama kolom snake_case dari MySQL menjadi bentuk
 * camelCase yang dipakai aplikasi. Salah memetakan satu kolom berarti
 * halaman publik menampilkan nilai kosong tanpa error apa pun — karena
 * itu setiap kolom diperiksa satu per satu.
 */
describe("mapRow", () => {
  function barisMysql() {
    return {
      id: "11111111-1111-1111-1111-111111111111",
      title: "Buku Bagus",
      slug: "buku-bagus",
      author: "Penulis Bagus",
      synopsis: "Sinopsis.",
      publisher_info: "CV Cipta Manuskrip Media",
      book_info: "Cetakan pertama",
      cover_path: "covers/abc.webp",
      status: "published",
      estimated_release: null,
      created_at: new Date("2026-01-02T03:04:05Z"),
      updated_at: new Date("2026-02-03T04:05:06Z"),
    };
  }

  it("memetakan setiap kolom snake_case ke nama camelCase-nya", () => {
    const buku = mapRow(barisMysql());

    expect(buku.publisherInfo).toBe("CV Cipta Manuskrip Media");
    expect(buku.bookInfo).toBe("Cetakan pertama");
    expect(buku.coverPath).toBe("covers/abc.webp");
    expect(buku.estimatedRelease).toBeNull();
  });

  it("mempertahankan nilai yang tidak berubah nama", () => {
    const buku = mapRow(barisMysql());

    expect(buku.id).toBe("11111111-1111-1111-1111-111111111111");
    expect(buku.title).toBe("Buku Bagus");
    expect(buku.slug).toBe("buku-bagus");
    expect(buku.author).toBe("Penulis Bagus");
    expect(buku.synopsis).toBe("Sinopsis.");
    expect(buku.status).toBe("published");
  });

  it("mengembalikan created_at dan updated_at sebagai Date", () => {
    const buku = mapRow(barisMysql());

    expect(buku.createdAt).toBeInstanceOf(Date);
    expect(buku.updatedAt).toBeInstanceOf(Date);
    expect(buku.createdAt.toISOString()).toBe("2026-01-02T03:04:05.000Z");
  });

  it("menerima waktu yang datang sebagai string, bukan hanya Date", () => {
    const baris = { ...barisMysql(), created_at: "2026-01-02T03:04:05Z" };

    expect(mapRow(baris).createdAt.toISOString()).toBe("2026-01-02T03:04:05.000Z");
  });

  it("menerima synopsis dan bookInfo null", () => {
    const buku = mapRow({ ...barisMysql(), synopsis: null, book_info: null });

    expect(buku.synopsis).toBeNull();
    expect(buku.bookInfo).toBeNull();
  });
});
