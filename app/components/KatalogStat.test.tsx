import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { KatalogStat } from "./KatalogStat";

/**
 * Panel ringkasan katalog.
 *
 * Yang dijaga: angkanya adalah angka yang diberikan (tanpa pembulatan atau
 * karangan), status terbit dibedakan, dan hiasan tidak pernah ikut dibacakan
 * pembaca layar. Meter kemajuan hanya muncul saat halamannya memang lebih
 * dari satu — kalau selalu muncul, ia jadi janji palsu bahwa ada halaman
 * lain.
 */
const dasar = {
  total: 1,
  page: 1,
  totalPages: 1,
  pageSize: 12,
  sudahTerbit: true,
};

describe("KatalogStat", () => {
  it("menampilkan jumlah buku apa adanya, terpisah dari satuannya", () => {
    const html = renderToStaticMarkup(<KatalogStat {...dasar} total={1} />);
    expect(html).toContain("<strong>1</strong>");
    expect(html).toContain("buku");
  });

  it("memakai pemisah ribuan untuk jumlah besar", () => {
    const html = renderToStaticMarkup(<KatalogStat {...dasar} total={1250} totalPages={105} />);
    expect(html).toContain("<strong>1.250</strong>");
  });

  it("menuliskan ukuran halaman dan posisi halaman", () => {
    const html = renderToStaticMarkup(
      <KatalogStat {...dasar} total={37} page={2} totalPages={4} />
    );
    expect(html).toContain("12 per halaman");
    expect(html).toContain("Halaman 2 dari 4");
  });

  it("mempertahankan keterangan urutan yang sudah ada", () => {
    const html = renderToStaticMarkup(<KatalogStat {...dasar} />);
    expect(html).toContain("Urutan judul A–Z, tanpa filter, agar mudah dirujuk.");
  });

  it("membedakan katalog terbit dan yang masih disiapkan", () => {
    const terbit = renderToStaticMarkup(<KatalogStat {...dasar} />);
    const siap = renderToStaticMarkup(<KatalogStat {...dasar} sudahTerbit={false} />);

    expect(terbit).toContain("Sudah terbit dan bisa dipesan");
    expect(siap).toContain("Sedang disiapkan menuju terbit");
    expect(siap).toContain("katalog-stat-dot is-soon");
    expect(terbit).not.toContain("is-soon");
  });

  it("hanya menampilkan meter kemajuan bila halaman lebih dari satu", () => {
    const satuHalaman = renderToStaticMarkup(<KatalogStat {...dasar} />);
    const banyak = renderToStaticMarkup(
      <KatalogStat {...dasar} total={37} page={2} totalPages={4} />
    );

    expect(satuHalaman).not.toContain("katalog-stat-meter");
    expect(banyak).toContain("katalog-stat-meter");
    expect(banyak).toContain("width:50%");
  });

  it("menandai seluruh hiasan sebagai aria-hidden", () => {
    const html = renderToStaticMarkup(<KatalogStat {...dasar} />);
    expect(html).toContain('class="katalog-stat-glow" aria-hidden="true"');
    expect(html).toContain('class="katalog-stat-shelf" aria-hidden="true"');
    expect(html).toContain('aria-label="Ringkasan katalog"');
  });
});
