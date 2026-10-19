// app/content/site.test.ts
import { describe, it, expect } from "vitest";
import {
  NAV_UTAMA, TAUTAN_LAYANAN, KONTAK, PAKET_BUKU,
  FASILITAS_JURNAL, KATEGORI_JURNAL, PREVIEW_LIMIT,
} from "./site";

describe("content/site", () => {
  it("header hanya memuat Beranda dan Tentang Kami", () => {
    expect(NAV_UTAMA).toEqual([
      { label: "Beranda", href: "/" },
      { label: "Tentang Kami", href: "/tentang-kami" },
    ]);
  });

  it("footer mengulang tautan dua layanan", () => {
    expect(TAUTAN_LAYANAN.map((t) => t.href)).toEqual([
      "/publish-buku",
      "/publish-jurnal",
    ]);
  });

  it("nomor kontak memakai format tampil yang ditetapkan brief", () => {
    expect(KONTAK.adminBuku).toBe("0896-7189-4900");
    expect(KONTAK.adminJurnal).toBe("0895-6292-03142");
  });

  it("tepat tiga paket dan semuanya placeholder, bukan data karangan", () => {
    expect(PAKET_BUKU).toHaveLength(3);
    for (const paket of PAKET_BUKU) {
      expect(paket.nama).toBe("[Nama paket dari klien]");
      expect(paket.harga).toBe("[Harga dari klien]");
      expect(paket.fasilitas).toBe("[Fasilitas paket dari klien]");
    }
  });

  it("daftar fasilitas jurnal 13 item persis seperti brief", () => {
    expect(FASILITAS_JURNAL).toEqual([
      "LOA cepat",
      "DOI aktif",
      "dokumentasi korespondensi lengkap",
      "review transparan",
      "jurnal bukan predator",
      "revisi minor–mayor",
      "Turnitin",
      "konversi skripsi/tesis/disertasi",
      "penerjemahan artikel",
      "proofreading",
      "layout",
      "template artikel",
      "garansi terbit",
    ]);
  });

  it("tepat tiga kategori jurnal dengan en dash pada SINTA", () => {
    expect(KATEGORI_JURNAL).toEqual([
      "Jurnal Nasional Terakreditasi SINTA 1–4",
      "Jurnal Internasional Index Copernicus",
      "Jurnal Internasional Scopus dan SCImago",
    ]);
  });

  it("batas preview kecil, tetap, dan dipakai kedua preview", () => {
    expect(PREVIEW_LIMIT).toBe(3);
  });
});
