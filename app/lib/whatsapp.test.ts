import { describe, it, expect } from "vitest";
import {
  buildBookOrderUrl,
  buildBookAssistUrl,
  buildJournalSubmitUrl,
  buildJournalAssistUrl,
  pesanAsistensiBuku,
  pesanAsistensiJurnal,
} from "./whatsapp";

describe("buildBookOrderUrl", () => {
  it("membentuk tautan pemesanan buku cetak dengan format persis", () => {
    const url = buildBookOrderUrl("Filsafat Ilmu", "cetak");
    expect(url).toBe(
      "https://wa.me/6289671894900?text=Mau%20pesan%20buku%20cetak%20judul%20Filsafat%20Ilmu"
    );
  });

  it("membentuk tautan sewa ebook dengan penulisan ebook tetap persis", () => {
    const url = buildBookOrderUrl("Panduan Menulis 'Karya Ilmiah'", "ebook");
    expect(url).toBe(
      "https://wa.me/6289671894900?text=Mau%20sewa%20ebook%20judul%20Panduan%20Menulis%20'Karya%20Ilmiah'"
    );
  });

  it("judul dengan &, +, tanda kurung, dan huruf beraksen tetap utuh saat pesan didekode", () => {
    const judul = "Kiat Menulis Cepat & Efektif (Edisi 2+1) — Résumé";
    const url = buildBookOrderUrl(judul, "cetak");

    expect(decodeURIComponent(new URL(url).searchParams.get("text") ?? "")).toBe(
      `Mau pesan buku cetak judul ${judul}`
    );
  });
});

describe("whatsapp jurnal", () => {
  it("membentuk tautan kirim naskah dengan pesan persis", () => {
    expect(buildJournalSubmitUrl()).toBe(
      "https://wa.me/62895629203142?text=ini%20naskah%20artikel%20saya%2C%20admin."
    );
  });

  it("membentuk tautan asistensi dengan topik dan titik akhir", () => {
    const url = buildJournalAssistUrl("analisis wacana kritis");
    expect(url).toBe(
      "https://wa.me/62895629203142?text=saya%20mau%20dibantu%20asistensi%20artikel%20topik%20analisis%20wacana%20kritis."
    );
  });

  it("pesan asistensi memangkas spasi tepi sebelum dipakai", () => {
    const hasil = pesanAsistensiJurnal("  literasi digital  ");
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(decodeURIComponent(new URL(hasil.url).searchParams.get("text") ?? "")).toBe(
        "saya mau dibantu asistensi artikel topik literasi digital."
      );
    }
  });

  it("menolak topik kosong dan yang hanya berisi spasi", () => {
    for (const mentah of ["", "   ", "\t\n"]) {
      expect(pesanAsistensiJurnal(mentah).ok).toBe(false);
      expect(pesanAsistensiBuku(mentah).ok).toBe(false);
    }
  });

  it("mempertahankan karakter khusus topik setelah didekode", () => {
    const topik = "Pendidikan & Teknologi (Edisi 2+1) — Résumé";
    const hasil = pesanAsistensiJurnal(topik);
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(decodeURIComponent(new URL(hasil.url).searchParams.get("text") ?? "")).toBe(
        `saya mau dibantu asistensi artikel topik ${topik}.`
      );
    }
  });
});

/**
 * Asistensi buku memakai nomor admin buku dan kalimat yang berbeda dari
 * versi jurnal. Kalimat ini tidak ada di brief §10 — bentuknya dipilih
 * pemilik proyek, jadi tes ini yang menjaganya dari "penyeragaman".
 */
describe("whatsapp asistensi buku", () => {
  it("membentuk tautan asistensi buku dengan nomor admin buku", () => {
    expect(buildBookAssistUrl("Metodologi Penelitian")).toBe(
      "https://wa.me/6289671894900?text=Saya%20mau%20dibantu%20asistensi%20buku%20topik%20Metodologi%20Penelitian."
    );
  });

  it("huruf awal besar dan titik akhir dipertahankan, berbeda dari versi artikel", () => {
    const buku = buildBookAssistUrl("literasi");
    const jurnal = buildJournalAssistUrl("literasi");

    expect(new URL(buku).searchParams.get("text")).toBe(
      "Saya mau dibantu asistensi buku topik literasi."
    );
    expect(new URL(jurnal).searchParams.get("text")).toBe(
      "saya mau dibantu asistensi artikel topik literasi."
    );
  });

  it("memangkas spasi tepi topik sebelum dipakai", () => {
    const hasil = pesanAsistensiBuku("  Kurikulum Merdeka  ");
    expect(hasil.ok).toBe(true);
    if (hasil.ok) {
      expect(decodeURIComponent(new URL(hasil.url).searchParams.get("text") ?? "")).toBe(
        "Saya mau dibantu asistensi buku topik Kurikulum Merdeka."
      );
    }
  });
});
