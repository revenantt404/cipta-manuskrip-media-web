import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import { resolveCoverUrl, coverMaxBytes, dirSampul, namaSampulSah } from "./path";

describe("resolveCoverUrl", () => {
  it("mengubah path relatif di database menjadi URL publik", () => {
    expect(resolveCoverUrl("covers/abc.webp")).toBe("/covers/abc.webp");
  });

  it("tidak menggandakan garis miring di depan", () => {
    expect(resolveCoverUrl("/covers/abc.webp")).toBe("/covers/abc.webp");
  });

  it("mempertahankan karakter aman pada nama berkas", () => {
    expect(resolveCoverUrl("covers/9f8e-7d6c_5b4a.webp")).toBe(
      "/covers/9f8e-7d6c_5b4a.webp"
    );
  });

  /**
   * URL publik tidak boleh bergantung pada susunan folder.
   *
   * Lokasi fisik folder sampul berbeda antar lingkungan — di hosting
   * `COVER_DIR` menunjuk ke luar folder aplikasi — sementara `cover_path`
   * di database menyimpan nama logis yang sama di mana pun. Yang menentukan
   * URL adalah nama berkasnya saja.
   */
  it("memakai nama berkas saja, tanpa memandang subfolder di database", () => {
    expect(resolveCoverUrl("sampul-buku/abc.webp")).toBe("/covers/abc.webp");
    expect(resolveCoverUrl("data/covers/abc.webp")).toBe("/covers/abc.webp");
  });

  /**
   * `cover_path` tidak pernah kosong — kolomnya `NOT NULL` dan dijaga
   * `CHECK` — tetapi resolver tetap tidak boleh menghasilkan URL yang keluar
   * dari awalan sampul bila nilainya rusak. URL yang tidak menunjuk berkas
   * sah akan dijawab 404 oleh penyajinya, dan itu perilaku yang benar.
   */
  it("tidak pernah menghasilkan URL di luar awalan sampul", () => {
    const rusak = ["", "   ", "covers/", "a/..", "..", ".", "../../etc/passwd"];

    for (const nilai of rusak) {
      const url = resolveCoverUrl(nilai);
      expect(url.startsWith("/covers"), `nilai ${JSON.stringify(nilai)} -> ${url}`).toBe(true);
      expect(url).not.toContain("..");
      expect(url).not.toContain("\\");
    }
  });
});

describe("namaSampulSah", () => {
  it("menerima bentuk yang ditulis processAndSaveCover", () => {
    expect(namaSampulSah("5e8ec672-d21c-4601-95a7-deb74cadbf46.webp")).toBe(true);
    expect(namaSampulSah("00000000-0000-0000-0000-000000000000.webp")).toBe(true);
  });

  it("menolak apa pun yang bukan UUID berekstensi webp", () => {
    const ditolak = [
      "",
      "abc.webp",
      "5e8ec672-d21c-4601-95a7-deb74cadbf46.jpg",
      "5e8ec672-d21c-4601-95a7-deb74cadbf46",
      "5E8EC672-D21C-4601-95A7-DEB74CADBF46.webp",
      "5e8ec672-d21c-4601-95a7-deb74cadbf46.webp.txt",
      "../package.json",
      "..%2Fpackage.json",
      "covers/5e8ec672-d21c-4601-95a7-deb74cadbf46.webp",
      "..\\5e8ec672-d21c-4601-95a7-deb74cadbf46.webp",
      " 5e8ec672-d21c-4601-95a7-deb74cadbf46.webp",
      "5e8ec672-d21c-4601-95a7-deb74cadbf46.webp ",
    ];

    for (const nama of ditolak) {
      expect(namaSampulSah(nama), `nama ${JSON.stringify(nama)} seharusnya ditolak`).toBe(false);
    }
  });
});

describe("coverMaxBytes", () => {
  it("memakai nilai dari environment bila masuk akal", () => {
    expect(coverMaxBytes({ COVER_MAX_BYTES: "1048576" })).toBe(1048576);
  });

  it("kembali ke 5 MiB ketika variabel kosong atau tidak masuk akal", () => {
    expect(coverMaxBytes({})).toBe(5 * 1024 * 1024);
    expect(coverMaxBytes({ COVER_MAX_BYTES: "" })).toBe(5 * 1024 * 1024);
    expect(coverMaxBytes({ COVER_MAX_BYTES: "abc" })).toBe(5 * 1024 * 1024);
    expect(coverMaxBytes({ COVER_MAX_BYTES: "-1" })).toBe(5 * 1024 * 1024);
  });
});

describe("dirSampul", () => {
  afterAll(() => {
    delete process.env.COVER_DIR;
  });

  /**
   * Bawaannya di luar `public/`, dan itu bagian dari perbaikan Task 8:
   * berkas di `public/` hanya tersaji bila sudah ada saat `next start`
   * menyala, sehingga sampul yang baru diunggah tidak pernah tampil.
   */
  it("menyimpan sampul di luar folder public secara bawaan", () => {
    delete process.env.COVER_DIR;

    const dir = dirSampul();

    expect(dir).toBe(path.join(process.cwd(), "storage", "covers"));
    expect(path.relative(path.join(process.cwd(), "public"), dir).startsWith("..")).toBe(true);
  });

  it("mengikuti COVER_DIR bila diatur, supaya sampul bisa diletakkan di luar aplikasi", () => {
    process.env.COVER_DIR = "D:/data/sampul";
    expect(dirSampul()).toBe(path.resolve("D:/data/sampul"));
  });
});

