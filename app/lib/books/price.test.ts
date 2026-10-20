import { describe, it, expect } from "vitest";
import { formatRupiah, parseHarga, nilaiFormHarga, HARGA_KOSONG } from "./price";

describe("formatRupiah", () => {
  it("memformat angka dengan pemisah ribuan Indonesia", () => {
    expect(formatRupiah(85000)).toBe("Rp85.000");
    expect(formatRupiah(1_234_567)).toBe("Rp1.234.567");
  });

  it("membuang pecahan sen", () => {
    expect(formatRupiah(85000.5)).toBe("Rp85.001");
    expect(formatRupiah(85000.4)).toBe("Rp85.000");
  });

  /**
   * Keputusan pemilik proyek: harga yang belum ditetapkan tampil sebagai
   * `-`, bukan Rp0 — nol berarti gratis, dan itu klaim yang salah.
   */
  it("menampilkan tanda hubung untuk harga yang belum ditetapkan", () => {
    expect(formatRupiah(null)).toBe(HARGA_KOSONG);
    expect(formatRupiah(undefined)).toBe(HARGA_KOSONG);
    expect(HARGA_KOSONG).toBe("-");
  });

  it("menerima string DECIMAL dari driver MySQL", () => {
    expect(formatRupiah("85000.00")).toBe("Rp85.000");
  });

  it("menampilkan tanda hubung untuk nilai yang bukan angka", () => {
    expect(formatRupiah("bukan angka")).toBe(HARGA_KOSONG);
    expect(formatRupiah(Number.NaN)).toBe(HARGA_KOSONG);
    expect(formatRupiah(Number.POSITIVE_INFINITY)).toBe(HARGA_KOSONG);
  });
});

describe("parseHarga", () => {
  it("menerima angka polos", () => {
    expect(parseHarga("85000")).toEqual({ ok: true, value: 85000 });
  });

  it("menerima titik ribuan, dengan atau tanpa Rp", () => {
    expect(parseHarga("85.000")).toEqual({ ok: true, value: 85000 });
    expect(parseHarga("Rp85.000")).toEqual({ ok: true, value: 85000 });
    expect(parseHarga("Rp 85.000")).toEqual({ ok: true, value: 85000 });
    expect(parseHarga("rp. 1.234.567")).toEqual({ ok: true, value: 1234567 });
  });

  it("memangkas spasi di ujung", () => {
    expect(parseHarga("  90000  ")).toEqual({ ok: true, value: 90000 });
  });

  /**
   * Kosong berarti "belum ditetapkan", bukan nol. Membedakan keduanya
   * adalah alasan kolom ini NULL-able.
   */
  it("mengembalikan null untuk isian kosong", () => {
    expect(parseHarga("")).toEqual({ ok: true, value: null });
    expect(parseHarga("   ")).toEqual({ ok: true, value: null });
  });

  /**
   * Pemanggil yang tidak mengenal kolom harga — skrip lama, tes lama,
   * pemanggilan repository langsung — tidak mengirim field ini sama sekali.
   * Tidak mengirim bukan salah ketik; artinya belum ditetapkan.
   */
  it("menganggap field yang tidak dikirim sebagai belum ditetapkan", () => {
    expect(parseHarga(undefined)).toEqual({ ok: true, value: null });
  });

  /**
   * Validator berjalan dua kali pada jalur simpan. Putaran kedua menerima
   * hasil putaran pertama — `null` atau angka — bukan string formulir.
   * Kalau yang kedua menolaknya, setiap penyimpanan buku dari panel admin
   * gagal dengan "Harga tidak dikenali" padahal isiannya kosong.
   */
  it("idempoten: menerima hasil normalisasinya sendiri", () => {
    expect(parseHarga(null)).toEqual({ ok: true, value: null });
    expect(parseHarga(85000)).toEqual({ ok: true, value: 85000 });

    const sekali = parseHarga("Rp85.000");
    expect(sekali.ok).toBe(true);
    if (sekali.ok) expect(parseHarga(sekali.value)).toEqual({ ok: true, value: 85000 });
  });

  it("tetap menolak angka negatif dan angka di luar batas kolom", () => {
    expect(parseHarga(-1).ok).toBe(false);
    expect(parseHarga(Number.NaN).ok).toBe(false);
    expect(parseHarga(Number.POSITIVE_INFINITY).ok).toBe(false);
    expect(parseHarga(10_000_000_000).ok).toBe(false);
  });

  it("menolak harga negatif", () => {
    expect(parseHarga("-5000").ok).toBe(false);
  });

  it("menolak koma desimal dan huruf", () => {
    expect(parseHarga("85.000,50").ok).toBe(false);
    expect(parseHarga("85rb").ok).toBe(false);
    expect(parseHarga("gratis").ok).toBe(false);
  });

  it("menolak angka yang melebihi batas kolom DECIMAL(12,2)", () => {
    expect(parseHarga("99999999999").ok).toBe(false);
    // Batas atas yang masih diterima.
    expect(parseHarga("9999999999")).toEqual({ ok: true, value: 9_999_999_999 });
  });

  it("menolak nilai yang bentuknya tidak mungkin jadi harga", () => {
    expect(parseHarga({}).ok).toBe(false);
    expect(parseHarga([]).ok).toBe(false);
    expect(parseHarga(true).ok).toBe(false);
  });
});

describe("nilaiFormHarga", () => {
  it("mengembalikan string kosong untuk harga yang belum ditetapkan", () => {
    expect(nilaiFormHarga(null)).toBe("");
    expect(nilaiFormHarga(undefined)).toBe("");
  });

  /**
   * Driver MySQL mengembalikan DECIMAL sebagai string "85000.00"; tanpa
   * normalisasi, admin melihat pecahan yang tidak pernah ia ketik.
   */
  it("menormalkan string DECIMAL dari driver", () => {
    expect(nilaiFormHarga("85000.00")).toBe("85000");
    expect(nilaiFormHarga(85000)).toBe("85000");
  });

  it("mempertahankan pecahan yang benar-benar bernilai", () => {
    expect(nilaiFormHarga("85000.50")).toBe("85000.5");
  });

  it("mengembalikan string kosong untuk nilai rusak", () => {
    expect(nilaiFormHarga("bukan angka")).toBe("");
  });
});
