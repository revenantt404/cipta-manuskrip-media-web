/**
 * Kerangka muat halaman Kirim Artikel — banner ringkas ditambah tiga kartu
 * kategori, sesuai jumlah kategori jurnal yang tetap tiga.
 */
export default function Loading() {
  return (
    <div className="journal-page journal-flow-page" aria-busy="true" aria-live="polite">
      <p className="sr-only">Memuat halaman kirim artikel…</p>

      <section className="journal-flow-hero" aria-hidden="true">
        <span className="skeleton-line" style={{ width: 170, height: 9, background: "rgba(255,255,255,.22)" }} />
        <span className="skeleton-line skeleton-title" style={{ width: "min(480px, 76%)", height: 44, marginTop: 22, background: "rgba(255,255,255,.18)" }} />
        <span className="skeleton-line" style={{ width: "min(420px, 70%)", height: 12, marginTop: 20, background: "rgba(255,255,255,.14)" }} />
        <span className="skeleton-line" style={{ width: "min(300px, 52%)", height: 12, background: "rgba(255,255,255,.14)" }} />
      </section>

      <section className="journal-category-section" aria-hidden="true">
        <div className="journal-section-heading">
          <div>
            <span className="skeleton-line" style={{ width: 130, height: 9 }} />
            <span className="skeleton-line skeleton-title" style={{ width: 280, height: 32, marginTop: 14 }} />
          </div>
          <span className="skeleton-line" style={{ width: 250, height: 12 }} />
        </div>

        <div className="journal-category-grid">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="journal-skeleton-card">
              <div className="home-skeleton-between">
                <span className="skeleton-line" style={{ width: 52, height: 9, marginTop: 0 }} />
                <span className="skeleton-pill" style={{ width: 30, height: 30, borderRadius: 9 }} />
              </div>
              <span className="skeleton-line skeleton-title" style={{ width: "82%", height: 20, marginTop: 20 }} />
              <span className="skeleton-line skeleton-title" style={{ width: "54%", height: 20, marginTop: 8 }} />
              <span className="skeleton-cover" style={{ height: 96, marginTop: 18 }} />
              <span className="skeleton-pill skeleton-wide" style={{ marginTop: "auto" }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
