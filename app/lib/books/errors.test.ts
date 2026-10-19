import { describe, it, expect } from "vitest";
import { pesanKegagalan } from "./errors";

describe("pesanKegagalan", () => {
  it("menyebut judul sebagai penyebab saat slug bentrok", () => {
    // Bentrok slug adalah satu-satunya kegagalan database yang bisa
    // diperbaiki admin sendiri — dengan mengubah judul.
    const pesan = pesanKegagalan({ code: "ER_DUP_ENTRY" }, "Buku");

    expect(pesan).toMatch(/judul/i);
    expect(pesan).not.toMatch(/duplicate|ER_|SQL|uq_books/i);
  });

  it("tidak menyebut detail teknis untuk kegagalan lain", () => {
    const pesan = pesanKegagalan({ code: "ECONNREFUSED" }, "Buku");

    expect(pesan).toContain("Buku");
    expect(pesan).not.toMatch(/ECONN|connect|mysql/i);
    expect(pesan).toMatch(/coba lagi/i);
  });

  it("tetap menghasilkan pesan untuk nilai yang bukan error sama sekali", () => {
    // `throw "sesuatu"` sah di JavaScript; pemanggil tetap butuh kalimat
    // yang bisa ditampilkan, bukan galat kedua saat menyusun pesan.
    expect(pesanKegagalan("apa saja", "Sampul")).toContain("Sampul");
    expect(pesanKegagalan(null, "Sampul")).toContain("Sampul");
    expect(pesanKegagalan(undefined, "Sampul")).toContain("Sampul");
  });
});
