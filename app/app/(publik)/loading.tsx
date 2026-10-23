/**
 * Kerangka muat beranda — dipakai route group `(publik)` sebagai cadangan
 * untuk halaman yang belum punya kerangka sendiri.
 *
 * Bentuknya mengikuti beranda (banner bersudut bulat, dua kartu layanan,
 * satu blok lebar) supaya perpindahan ke halaman ini tidak terasa seperti
 * lompatan tata letak: ruang yang dipakai kerangka sama dengan ruang yang
 * nanti diisi konten.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Memuat beranda…</p>

      <div className="home-hero home-hero-skeleton" aria-hidden="true">
        <div className="home-skeleton-center">
          <span className="skeleton-pill" style={{ width: 210 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "min(560px, 82%)", height: 46, marginTop: 22 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "min(360px, 58%)", height: 46, marginTop: 12 }} />
          <span className="skeleton-line" style={{ width: "min(420px, 70%)", height: 13, marginTop: 24 }} />
          <div className="home-skeleton-actions">
            <span className="skeleton-pill" style={{ width: 150, height: 48 }} />
            <span className="skeleton-pill" style={{ width: 150, height: 48 }} />
          </div>
          <span className="skeleton-cover" style={{ width: "min(420px, 74%)", height: 180, marginTop: 40 }} />
        </div>
      </div>

      <div className="services-section home-skeleton-section" aria-hidden="true">
        <span className="skeleton-line" style={{ width: 130, height: 9 }} />
        <span className="skeleton-line skeleton-title" style={{ width: "min(430px, 62%)", height: 32, marginTop: 16 }} />
        <div className="home-skeleton-grid">
          <span className="skeleton-cover" style={{ height: 250 }} />
          <span className="skeleton-cover" style={{ height: 250 }} />
        </div>
      </div>
    </div>
  );
}
