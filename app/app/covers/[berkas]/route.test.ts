import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GET } from "./route";

/**
 * Sampul disajikan route handler, bukan dari `public/`.
 *
 * Alasannya ditemukan saat verifikasi HTTP Task 8: `next start` menyusun
 * daftar berkas `public/` sekali saat boot, sehingga sampul yang ditulis
 * setelah server menyala selalu 404 sampai server dijalankan ulang. Folder
 * sampul di luar folder aplikasi — yang disyaratkan `DESIGN-STACK.md`
 * bagian 5 supaya sampul bertahan saat deploy ulang — tidak akan tersaji
 * dari `public/` sama sekali.
 */

const DIR_UJI = path.join(process.cwd(), "storage", "covers-uji-rute");

const NAMA = "5e8ec672-d21c-4601-95a7-deb74cadbf46.webp";

function konteks(berkas: string) {
  return { params: Promise.resolve({ berkas }) };
}

function tulis(nama: string, isi: string): void {
  writeFileSync(path.join(DIR_UJI, nama), isi);
}

describe("route sampul", () => {
  beforeEach(() => {
    process.env.COVER_DIR = "storage/covers-uji-rute";
    rmSync(DIR_UJI, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    mkdirSync(DIR_UJI, { recursive: true });
  });

  afterAll(() => {
    rmSync(DIR_UJI, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    delete process.env.COVER_DIR;
  });

  it("menyajikan berkas yang ada dengan tipe dan isi yang benar", async () => {
    tulis(NAMA, "isi-sampul");

    const respons = await GET(new Request(`http://localhost/covers/${NAMA}`), konteks(NAMA));

    expect(respons.status).toBe(200);
    expect(respons.headers.get("content-type")).toBe("image/webp");
    expect(Buffer.from(await respons.arrayBuffer()).toString()).toBe("isi-sampul");
  });

  /**
   * Regresi yang memicu perbaikan ini.
   *
   * Berkas ditulis SETELAH modul dimuat, persis seperti unggahan sungguhan
   * lewat panel admin. Kalau handler membaca disk sekali saja saat boot —
   * atau menyerahkan tugasnya ke `public/` — bagian kedua tes ini gagal.
   */
  it("membaca disk saat permintaan datang, bukan saat modul dimuat", async () => {
    const baru = "11111111-2222-3333-4444-555555555555.webp";

    const sebelum = await GET(new Request("http://localhost/covers"), konteks(baru));
    expect(sebelum.status).toBe(404);

    tulis(baru, "ditulis-saat-runtime");

    const sesudah = await GET(new Request("http://localhost/covers"), konteks(baru));
    expect(sesudah.status).toBe(200);
    expect(Buffer.from(await sesudah.arrayBuffer()).toString()).toBe("ditulis-saat-runtime");
  });

  it("menyajikan sampul meski foldernya berada di luar folder aplikasi", async () => {
    const luar = path.join(process.cwd(), "..", "covers-uji-luar");
    rmSync(luar, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    mkdirSync(luar, { recursive: true });
    writeFileSync(path.join(luar, NAMA), "di-luar-aplikasi");

    process.env.COVER_DIR = luar;
    try {
      const respons = await GET(new Request("http://localhost/covers"), konteks(NAMA));

      expect(respons.status).toBe(200);
      expect(Buffer.from(await respons.arrayBuffer()).toString()).toBe("di-luar-aplikasi");
    } finally {
      delete process.env.COVER_DIR;
      rmSync(luar, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    }
  });

  it("menolak nama yang mencoba keluar dari folder sampul", async () => {
    // Sasaran yang benar-benar ada, supaya penolakan terbukti bukan karena
    // berkasnya kebetulan tidak ditemukan.
    expect(existsSync(path.join(process.cwd(), "package.json"))).toBe(true);

    const jahat = [
      "../package.json",
      "../../package.json",
      "..%2Fpackage.json",
      "%2e%2e%2fpackage.json",
      "....//package.json",
      "..\\package.json",
      "C:\\Windows\\win.ini",
      "/etc/passwd",
      "storage/covers-uji-rute/" + NAMA,
    ];

    for (const nama of jahat) {
      const respons = await GET(new Request("http://localhost/covers"), konteks(nama));
      expect(respons.status, `nama ${nama} seharusnya ditolak`).toBe(404);
    }
  });

  it("tidak menyajikan berkas lain meski berada di folder yang sama", async () => {
    // Folder sampul bisa saja berisi berkas lain di masa depan; route ini
    // hanya boleh menyajikan bentuk yang benar-benar ditulis aplikasi.
    tulis("catatan.txt", "jangan disajikan");
    tulis("sampul.webp", "bukan nama yang kita tulis");
    tulis(NAMA.replace(/\.webp$/, ".jpg"), "ekstensi lain");

    for (const nama of ["catatan.txt", "sampul.webp", NAMA.replace(/\.webp$/, ".jpg")]) {
      const respons = await GET(new Request("http://localhost/covers"), konteks(nama));
      expect(respons.status, `nama ${nama} seharusnya ditolak`).toBe(404);
    }
  });

  it("mengembalikan 404 tanpa melempar ketika folder sampul belum ada", async () => {
    rmSync(DIR_UJI, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });

    const respons = await GET(new Request("http://localhost/covers"), konteks(NAMA));

    expect(respons.status).toBe(404);
  });

  it("memberi tahu peramban bahwa isi satu URL tidak pernah berubah", async () => {
    tulis(NAMA, "isi-sampul");

    const respons = await GET(new Request("http://localhost/covers"), konteks(NAMA));

    // Nama berkas berisi UUID baru setiap kali sampul diganti, jadi URL yang
    // sama selalu berisi gambar yang sama.
    expect(respons.headers.get("cache-control")).toContain("immutable");
  });
});
