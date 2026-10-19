import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("mengubah judul sederhana menjadi slug huruf kecil", () => {
    expect(slugify("Terbit Buku Sekali Klik")).toBe("terbit-buku-sekali-klik");
  });

  it("menghapus apostrof dan tanda kutip", () => {
    expect(slugify("Panduan Menulis 'Karya Ilmiah'")).toBe("panduan-menulis-karya-ilmiah");
  });

  it("menghilangkan diakritik", () => {
    expect(slugify("Kupas Tuntas Sastra Édisi Kédua")).toBe("kupas-tuntas-sastra-edisi-kedua");
  });

  it("merapikan spasi dan tanda hubung berlebih", () => {
    expect(slugify("  Buku   --  Hebat  ")).toBe("buku-hebat");
  });

  it("membuang tanda baca di ujung", () => {
    expect(slugify("Apa Itu Publikasi?")).toBe("apa-itu-publikasi");
  });

  it("mengembalikan string kosong untuk input yang tidak menghasilkan huruf atau angka", () => {
    expect(slugify("!!! ??? ...")).toBe("");
  });

  it("tidak menghasilkan tanda hubung di awal atau akhir", () => {
    const hasil = slugify("-Buku-");
    expect(hasil.startsWith("-")).toBe(false);
    expect(hasil.endsWith("-")).toBe(false);
  });
});
