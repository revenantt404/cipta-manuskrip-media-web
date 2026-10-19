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
