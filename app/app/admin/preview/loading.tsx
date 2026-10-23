/**
 * Kerangka muat panel pratinjau admin (`/admin/preview/*`).
 *
 * Bentuknya sama dengan panel asli: judul halaman, tiga kartu ringkasan,
 * lalu satu panel daftar. Panel pratinjau tidak membaca database, tetapi
 * tetap memakai kerangka ini supaya perpindahan dari panel asli ke pratinjau
 * tidak berkedip ke area kosong.
 */
export default function Loading() {
  return (
    <div className="admin-page" aria-busy="true" aria-live="polite">
      <p className="sr-only">Memuat panel pratinjau…</p>

      <div className="admin-page-heading" aria-hidden="true">
        <div>
          <span className="skeleton-line" style={{ width: 132, height: 9 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "min(300px, 70%)", height: 30, marginTop: 12 }} />
          <span className="skeleton-line" style={{ width: "min(340px, 80%)", height: 11 }} />
        </div>
        <span className="skeleton-pill" style={{ width: 128, height: 42, borderRadius: 9 }} />
      </div>

      <section className="admin-stats-grid" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="admin-stat-card">
            <span className="skeleton-line" style={{ width: 96, height: 10, marginTop: 0 }} />
            <span className="skeleton-line skeleton-title" style={{ width: 70, height: 27, marginTop: 16 }} />
            <span className="skeleton-line" style={{ width: 120, height: 8 }} />
          </div>
        ))}
      </section>

      <section className="admin-panel" aria-hidden="true">
        <div className="admin-panel-heading">
          <div>
            <span className="skeleton-line" style={{ width: 150, height: 15 }} />
            <span className="skeleton-line" style={{ width: 220, height: 9 }} />
          </div>
        </div>
        <ul className="admin-skeleton-rows">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="admin-skeleton-row">
              <span className="skeleton-cover admin-skeleton-thumb" />
              <span className="admin-skeleton-text">
                <span className="skeleton-line" style={{ width: "72%", height: 11, marginTop: 0 }} />
                <span className="skeleton-line" style={{ width: "42%", height: 9 }} />
              </span>
              <span className="skeleton-pill" style={{ width: 86, height: 24 }} />
              <span className="skeleton-line" style={{ width: 74, height: 9, marginTop: 0 }} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
