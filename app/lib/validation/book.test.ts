import { describe, expect, it } from "vitest";
import { validateBookInput } from "./book";

const valid = {
  title: "Buku Bagus",
  author: "Penulis Bagus",
  coverPath: "covers/abc.webp",
  status: "published",
  synopsis: "Sinopsis yang cukup panjang.",
  publisherInfo: "CV Cipta Manuskrip Media",
  bookInfo: "",
  estimatedRelease: "",
};

describe("validateBookInput", () => {
  it("menerima input published yang lengkap", () => {
    const hasil = validateBookInput(valid);
    expect(hasil.ok).toBe(true);
  });

  it("menolak judul yang hanya berisi spasi", () => {
    const hasil = validateBookInput({ ...valid, title: "   " });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.title).toBeDefined();
  });

  it("menolak published tanpa sinopsis", () => {
    const hasil = validateBookInput({ ...valid, synopsis: "  " });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.synopsis).toBeDefined();
  });

  it("menolak published yang masih punya estimasi terbit", () => {
    const hasil = validateBookInput({ ...valid, estimatedRelease: "Januari 2027" });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.estimatedRelease).toBeDefined();
  });

  it("menolak upcoming tanpa estimasi terbit", () => {
    const hasil = validateBookInput({
      ...valid,
      status: "upcoming",
      synopsis: "",
      estimatedRelease: "",
    });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.estimatedRelease).toBeDefined();
  });

  it("menerima upcoming dengan estimasi dan tanpa sinopsis", () => {
    const hasil = validateBookInput({
      ...valid,
      status: "upcoming",
      synopsis: "",
      estimatedRelease: "Maret 2027",
    });
    expect(hasil.ok).toBe(true);
  });

  it("menolak status selain published dan upcoming", () => {
    const hasil = validateBookInput({ ...valid, status: "draft" });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.status).toBeDefined();
  });

  it("menolak coverPath kosong", () => {
    const hasil = validateBookInput({ ...valid, coverPath: "  " });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.coverPath).toBeDefined();
  });

  it("melaporkan semua kesalahan sekaligus, bukan hanya yang pertama", () => {
    const hasil = validateBookInput({ ...valid, title: "  ", author: "  ", coverPath: "  " });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) {
      expect(hasil.errors.title).toBeDefined();
      expect(hasil.errors.author).toBeDefined();
      expect(hasil.errors.coverPath).toBeDefined();
    }
  });

  it("menerima judul dengan apostrof apa adanya", () => {
    const hasil = validateBookInput({ ...valid, title: "Panduan Menulis 'Karya Ilmiah'" });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.value.title).toBe("Panduan Menulis 'Karya Ilmiah'");
  });

  it("memangkas spasi di ujung judul dan penulis", () => {
    const hasil = validateBookInput({ ...valid, title: "  Buku  ", author: "  Penulis  " });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(hasil.value.title).toBe("Buku");
      expect(hasil.value.author).toBe("Penulis");
    }
  });

  it("mengisi publisherInfo dengan nilai bawaan bila kosong", () => {
    const hasil = validateBookInput({ ...valid, publisherInfo: "" });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.value.publisherInfo).toBe("CV Cipta Manuskrip Media");
  });

  it("mengubah string kosong menjadi null untuk field opsional", () => {
    const hasil = validateBookInput({ ...valid, bookInfo: "   " });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.value.bookInfo).toBeNull();
  });

  it("mengembalikan error untuk objek yang bukan bentuk yang diharapkan", () => {
    expect(validateBookInput(null).ok).toBe(false);
    expect(validateBookInput("teks").ok).toBe(false);
    expect(validateBookInput({}).ok).toBe(false);
    expect(validateBookInput([]).ok).toBe(false);
  });
});

/**
 * ISBN dan harga hanya berlaku untuk buku yang sudah terbit. Aturan ini
 * adalah cermin constraint `chk_books_upcoming_no_price` di migration 002,
 * ditegakkan di sini supaya admin mendapat pesan yang bisa dibaca, bukan
 * galat MySQL.
 */
describe("validateBookInput — ISBN dan harga", () => {
  it("menerima published dengan ISBN dan dua harga", () => {
    const hasil = validateBookInput({
      ...valid,
      isbn: "978-602-1234-56-7",
      pricePrint: "85000",
      priceEbook: "Rp45.000",
    });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(hasil.value.isbn).toBe("978-602-1234-56-7");
      expect(hasil.value.pricePrint).toBe(85000);
      expect(hasil.value.priceEbook).toBe(45000);
    }
  });

  it("menerima published tanpa ISBN dan tanpa harga", () => {
    const hasil = validateBookInput({ ...valid, isbn: "", pricePrint: "", priceEbook: "" });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(hasil.value.isbn).toBeNull();
      expect(hasil.value.pricePrint).toBeNull();
      expect(hasil.value.priceEbook).toBeNull();
    }
  });

  it("memangkas spasi ISBN", () => {
    const hasil = validateBookInput({ ...valid, isbn: "  978-602-1234-56-7  " });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.value.isbn).toBe("978-602-1234-56-7");
  });

  it("menolak ISBN yang memuat huruf selain X", () => {
    const hasil = validateBookInput({ ...valid, isbn: "ABCDEFGHIJ" });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.isbn).toBeDefined();
  });

  it("menolak ISBN yang terlalu pendek", () => {
    const hasil = validateBookInput({ ...valid, isbn: "123" });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.isbn).toBeDefined();
  });

  it("menolak harga negatif dan harga berisi huruf", () => {
    const negatif = validateBookInput({ ...valid, pricePrint: "-5000" });
    expect(negatif.ok).toBe(false);
    if (!negatif.ok) expect(negatif.errors.pricePrint).toBeDefined();

    const huruf = validateBookInput({ ...valid, priceEbook: "45rb" });
    expect(huruf.ok).toBe(false);
    if (!huruf.ok) expect(huruf.errors.priceEbook).toBeDefined();
  });

  it("menolak harga pada buku yang segera terbit", () => {
    const hasil = validateBookInput({
      ...valid,
      status: "upcoming",
      synopsis: "",
      estimatedRelease: "Januari 2027",
      pricePrint: "85000",
      priceEbook: "45000",
    });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) {
      expect(hasil.errors.pricePrint).toBeDefined();
      expect(hasil.errors.priceEbook).toBeDefined();
    }
  });

  it("menolak ISBN pada buku yang segera terbit", () => {
    const hasil = validateBookInput({
      ...valid,
      status: "upcoming",
      synopsis: "",
      estimatedRelease: "Januari 2027",
      isbn: "978-602-1234-56-7",
    });
    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.errors.isbn).toBeDefined();
  });

  it("menerima buku segera terbit tanpa ISBN dan tanpa harga", () => {
    const hasil = validateBookInput({
      ...valid,
      status: "upcoming",
      synopsis: "",
      estimatedRelease: "Januari 2027",
      isbn: "",
      pricePrint: "",
      priceEbook: "",
    });
    expect(hasil.ok).toBe(true);
  });
});
