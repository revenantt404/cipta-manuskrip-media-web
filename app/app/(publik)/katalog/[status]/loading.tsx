/**
 * Kerangka muat katalog.
 *
 * Query katalog berjalan di server; pada sambungan lambat halaman sebelumnya
 * kosong tanpa penanda apa pun. Kerangka ini menjaga susunannya tetap
 * terlihat dan memberi tahu bahwa isinya sedang diambil — bukan rusak.
 */
export default function Loading() {
  return (
    <div className="katalog-page" aria-busy="true" aria-live="polite">
      <p className="sr-only">Memuat katalog…</p>

      <div className="katalog-crumbs katalog-skeleton-crumbs" aria-hidden="true">
        <span className="skeleton-line" style={{ width: 64 }} />
        <span className="skeleton-line" style={{ width: 120 }} />
      </div>

      <header className="katalog-hero" aria-hidden="true">
        <div className="katalog-hero-copy">
          <span className="skeleton-line" style={{ width: 130, height: 10 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "62%", height: 40 }} />
          <span className="skeleton-line" style={{ width: "84%", height: 12 }} />
          <span className="skeleton-line" style={{ width: "70%", height: 12 }} />
          <div className="katalog-tabs">
            <span className="skeleton-pill" />
            <span className="skeleton-pill" />
          </div>
        </div>
      </header>

      <ul className="kat-grid" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i}>
            <div className="kat-card katalog-skeleton-card">
              <span className="skeleton-cover" />
              <div className="kat-card-body">
                <span className="skeleton-line" style={{ width: "80%", height: 15 }} />
                <span className="skeleton-line" style={{ width: "45%", height: 10 }} />
                <span className="skeleton-line" style={{ width: "100%", height: 1 }} />
                <span className="skeleton-line" style={{ width: "100%", height: 1 }} />
                <span className="skeleton-pill skeleton-wide" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
