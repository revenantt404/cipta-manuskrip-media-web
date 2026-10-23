import { describe, expect, it } from "vitest";
import { tautanAktif } from "./admin-nav-state";

/**
 * Regresi yang dilaporkan pemilik proyek: di `/admin/buku/tambah`, menu
 * "Kelola Buku" dan "Tambah Buku" sama-sama menyala. Penyebabnya pencocokan
 * awalan `/admin/buku/` yang tidak pernah kalah oleh alamat yang lebih
 * spesifik. Tes ini mengunci aturan "satu halaman, satu tautan aktif".
 */

const REAL = ["/admin", "/admin/buku", "/admin/buku/tambah"] as const;
const DEMO = ["/admin/preview", "/admin/preview/buku", "/admin/preview/buku/tambah"] as const;

describe("tautanAktif — panel admin", () => {
  it("menyalakan hanya Tambah Buku di /admin/buku/tambah", () => {
    expect(tautanAktif("/admin/buku/tambah", REAL)).toBe("/admin/buku/tambah");
  });

  it("menyalakan hanya Kelola Buku di daftar dan halaman edit", () => {
    expect(tautanAktif("/admin/buku", REAL)).toBe("/admin/buku");
    expect(tautanAktif("/admin/buku/12/edit", REAL)).toBe("/admin/buku");
  });

  it("menyalakan hanya Ringkasan di /admin", () => {
    expect(tautanAktif("/admin", REAL)).toBe("/admin");
  });

  it("berlaku sama untuk jalur pratinjau (demo)", () => {
    expect(tautanAktif("/admin/preview", DEMO)).toBe("/admin/preview");
    expect(tautanAktif("/admin/preview/buku", DEMO)).toBe("/admin/preview/buku");
    expect(tautanAktif("/admin/preview/buku/tambah", DEMO)).toBe(
      "/admin/preview/buku/tambah"
    );
    expect(tautanAktif("/admin/preview/buku/7/edit", DEMO)).toBe("/admin/preview/buku");
  });

  it("tidak mencocokkan awalan yang bukan batas segmen", () => {
    // `/admin/buku-lain` bukan turunan `/admin/buku`, jadi hanya induknya
    // (`/admin`) yang menyala — bukan "Kelola Buku".
    expect(tautanAktif("/admin/buku-lain", REAL)).toBe("/admin");
  });

  it("tidak menyalakan apa pun di halaman di luar panel", () => {
    expect(tautanAktif("/", REAL)).toBeUndefined();
    expect(tautanAktif("", REAL)).toBeUndefined();
  });
});
