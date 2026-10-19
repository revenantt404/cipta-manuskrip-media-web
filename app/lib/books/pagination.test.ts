import { describe, expect, it } from "vitest";
import { normalizePage } from "./pagination";

describe("normalizePage", () => {
  it("menjepit halaman di atas jumlah halaman yang ada", () => {
    expect(normalizePage("99", 3)).toBe(3);
  });

  it("mengembalikan 1 untuk halaman nol atau negatif", () => {
    expect(normalizePage("0", 3)).toBe(1);
    expect(normalizePage("-5", 3)).toBe(1);
  });

  it("mengembalikan 1 untuk input yang bukan angka", () => {
    expect(normalizePage("abc", 3)).toBe(1);
    expect(normalizePage("", 3)).toBe(1);
    expect(normalizePage(undefined, 3)).toBe(1);
    expect(normalizePage("1.5", 3)).toBe(1);
    expect(normalizePage(Number.NaN, 3)).toBe(1);
  });

  it("membiarkan halaman yang sah apa adanya", () => {
    expect(normalizePage("2", 3)).toBe(2);
    expect(normalizePage(3, 3)).toBe(3);
  });

  it("mengembalikan 1 ketika hanya ada satu halaman", () => {
    expect(normalizePage("5", 1)).toBe(1);
  });
});
