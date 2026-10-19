import { describe, it, expect } from "vitest";
import { resolveCoverUrl, coverMaxBytes } from "./path";

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
