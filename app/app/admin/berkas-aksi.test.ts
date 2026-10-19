import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Berkas ber-`"use server"` hanya boleh mengekspor fungsi async.
 *
 * Aturan ini tidak terlihat oleh type-check maupun tes unit: pelanggarannya
 * baru muncul sebagai kegagalan `next build` ("A 'use server' file can only
 * export async functions, found object"). Karena itu aturannya diperiksa
 * langsung dari berkasnya — sekali salah, seluruh build mati.
 *
 * Cara memeriksanya sengaja sederhana dan konservatif: tidak setiap ekspor
 * perlu benar-benar fungsi async, tetapi setiap ekspor HARUS berupa
 * deklarasi fungsi async. Ekspor `const` apa pun dianggap pelanggaran.
 */
function berkasAksi(direktori: string): string[] {
  const hasil: string[] = [];

  for (const nama of readdirSync(direktori)) {
    const jalur = path.join(direktori, nama);
    if (statSync(jalur).isDirectory()) {
      hasil.push(...berkasAksi(jalur));
      continue;
    }
    if (!nama.endsWith(".ts") && !nama.endsWith(".tsx")) continue;
    if (nama.endsWith(".test.ts") || nama.endsWith(".test.tsx")) continue;

    const isi = readFileSync(jalur, "utf8");
    if (/^\s*["']use server["']\s*;?/m.test(isi)) hasil.push(jalur);
  }

  return hasil;
}

describe("berkas use server", () => {
  const berkas = berkasAksi(path.join(process.cwd(), "app"));

  it("menemukan berkas aksi yang perlu diperiksa", () => {
    // Kalau pemindaian ini diam-diam tidak menemukan apa pun, tes di bawah
    // akan lulus tanpa memeriksa sesuatu.
    expect(berkas.length).toBeGreaterThan(0);
  });

  it("hanya mengekspor deklarasi fungsi async", () => {
    for (const jalur of berkas) {
      const isi = readFileSync(jalur, "utf8");

      const eksporBukanFungsi = isi
        .split("\n")
        .map((baris, i) => ({ baris, nomor: i + 1 }))
        .filter(({ baris }) => /^export\s/.test(baris))
        // `export async function`, `export type`, dan `export interface`
        // aman: keduanya tidak menghasilkan nilai yang perlu diserialisasi.
        .filter(
          ({ baris }) =>
            !/^export\s+(async\s+function|type|interface|declare)\b/.test(baris)
        );

      expect(
        eksporBukanFungsi.map((e) => `${path.relative(process.cwd(), jalur)}:${e.nomor} ${e.baris}`),
        `Ekspor non-fungsi di berkas "use server" membuat next build gagal`
      ).toEqual([]);
    }
  });
});
