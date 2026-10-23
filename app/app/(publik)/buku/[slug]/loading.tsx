/** Kerangka muat halaman detail buku — bentuk yang sama, isi ditunda. */
export default function Loading() {
  return (
    <div className="detail-page" aria-busy="true" aria-live="polite">
      <p className="sr-only">Memuat detail buku…</p>

      <div className="detail-crumbs detail-skeleton-crumbs" aria-hidden="true">
        <span className="skeleton-line" style={{ width: 60 }} />
        <span className="skeleton-line" style={{ width: 110 }} />
      </div>

      <div className="detail-shell" aria-hidden="true">
        <div className="detail-media">
          <div className="detail-cover-frame">
            <span className="skeleton-cover skeleton-cover--tall" />
          </div>
        </div>

        <div className="detail-content">
          <span className="skeleton-line" style={{ width: 140, height: 10 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "76%", height: 38 }} />
          <span className="skeleton-line" style={{ width: "34%", height: 13 }} />
          <div className="detail-facts">
            <span className="skeleton-line" style={{ width: "100%", height: 38 }} />
            <span className="skeleton-line" style={{ width: "100%", height: 38 }} />
            <span className="skeleton-line" style={{ width: "100%", height: 38 }} />
          </div>
          <span className="skeleton-line" style={{ width: "100%", height: 12 }} />
          <span className="skeleton-line" style={{ width: "92%", height: 12 }} />
          <span className="skeleton-line" style={{ width: "64%", height: 12 }} />
        </div>
      </div>
    </div>
  );
}
