import { describe, it, expect } from "vitest";
import { daftarRevalidasi } from "./revalidate";

/**
 * Daftar revalidasi buku — dibaca oleh `actions.ts` untuk memanggil
 * `revalidatePath`, dan diperiksa di sini supaya perubahan alamatnya
 * sengaja, bukan kelalaian.
 *
 * Yang paling dijaga:
 * - `/publish-buku` tidak pernah hilang dari daftar. Ketinggalan satu
 *   entri di sini tidak memunculkan galat apa pun — hanya preview yang
 *   menyajikan versi beku — jadi satu-satunya pertahanannya adalah tes.
 * - `sitemap.xml` tidak pernah *menambah* daftar: `app/sitemap.ts`
 *   memakai `force-dynamic`, jadi ia dibentuk ulang setiap permintaan
 *   dan `revalidatePath("/sitemap.xml")` hanya baris yang tidak berbuat
 *   apa-apa.
 */

describe("daftarRevalidasi", () => {
  it("memuat seluruh alamat bergantung-buku dengan urutan yang tetap", () => {
    expect(daftarRevalidasi("buku-saya")).toEqual([
      { path: "/admin/buku" },
      { path: "/katalog/[status]", type: "page" },
      { path: "/publish-buku", type: "page" },
      { path: "/", type: "page" },
      { path: "/buku/buku-saya", type: "page" },
    ]);
  });

  it("slug diberikan muncul hanya pada entri detail per-slug", () => {
    const daftar = daftarRevalidasi("buku-saya");

    const perSlug = daftar.filter((e) => e.path.includes("buku-saya"));
    expect(perSlug).toEqual([{ path: "/buku/buku-saya", type: "page" }]);
  });

  it("tidak mengubah entri konstan meskipun slug berbeda", () => {
    const konstan = (e: ReturnType<typeof daftarRevalidasi>[number]) =>
      !e.path.startsWith("/buku/");

    expect(daftarRevalidasi("a").filter(konstan)).toEqual(
      daftarRevalidasi("b").filter(konstan)
    );
  });

  it("sitemap.xml tidak ada di daftar — sitemap force-dynamic", () => {
    const path = daftarRevalidasi("x").map((e) => e.path);
    expect(path.join(" ")).not.toContain("sitemap");
  });

  it("slug disisipkan apa adanya; normalisasi bukan tugas daftar ini", () => {
    // Normalisasi slug adalah tugas validator (`validation/slug`), bukan
    // tugas daftar ini. Yang dijaga hanya bentuk panggilan yang benar:
    // satu interpolasi ke entri terakhir, tanpa penambahan di lain tempat.
    const daftar = daftarRevalidasi("Judul Aneh!");
    expect(daftar[daftar.length - 1]).toEqual({
      path: "/buku/Judul Aneh!",
      type: "page",
    });
  });

  it("kembali array baru setiap pemanggilan, tanpa referensi bersama", () => {
    // Kepuraian: pemanggil tidak bisa merusak pemanggil berikutnya lewat
    // objek hasil yang dimutasi.
    const a = daftarRevalidasi("x");
    const b = daftarRevalidasi("x");
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
  });
});
