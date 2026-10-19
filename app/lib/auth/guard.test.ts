import { describe, it, expect } from "vitest";
import { NAMA_COOKIE, opsiCookieSesi, opsiHapusCookie } from "./guard";

describe("opsi cookie sesi", () => {
  it("memakai nama cookie yang tetap", () => {
    expect(NAMA_COOKIE).toBe("cmm_session");
  });

  it("tidak dapat dibaca JavaScript di browser", () => {
    expect(opsiCookieSesi(false).httpOnly).toBe(true);
  });

  it("dibatasi ke jalur situs sendiri", () => {
    expect(opsiCookieSesi(false).path).toBe("/");
  });

  it("memakai SameSite=Lax agar tidak ikut pada permintaan lintas situs", () => {
    expect(opsiCookieSesi(false).sameSite).toBe("lax");
  });

  it("hanya dikirim lewat HTTPS di produksi", () => {
    expect(opsiCookieSesi(true).secure).toBe(true);
    expect(opsiCookieSesi(false).secure).toBe(false);
  });

  it("kedaluwarsa bersama sesinya, bukan cookie sesi abadi", () => {
    const opsi = opsiCookieSesi(false);
    expect(opsi.maxAge).toBeGreaterThan(0);
    expect(opsi.maxAge).toBeLessThanOrEqual(7 * 24 * 60 * 60);
  });

  it("menghapus cookie dengan opsi yang sama agar cocok", () => {
    const hapus = opsiHapusCookie(false);
    expect(hapus.path).toBe("/");
    expect(hapus.maxAge).toBe(0);
    expect(hapus.httpOnly).toBe(true);
    expect(hapus.sameSite).toBe("lax");
  });
});
