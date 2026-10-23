/**
 * Kerangka muat halaman Tentang Kami — banner bersudut bulat dengan pilar
 * teks di kiri dan panel kertas di kanan, lalu dua blok narasi.
 */
export default function Loading() {
  return (
    <div className="about-page" aria-busy="true" aria-live="polite">
      <p className="sr-only">Memuat halaman tentang kami…</p>

      <section className="about-hero" aria-hidden="true">
        <div className="about-hero-copy">
          <span className="skeleton-pill" style={{ width: 196, height: 32 }} />
          <span className="skeleton-line" style={{ width: 190, height: 9, marginTop: 28 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "92%", height: 46, marginTop: 18 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "64%", height: 46, marginTop: 12 }} />
          <span className="skeleton-line" style={{ width: "88%", height: 12, marginTop: 22 }} />
          <span className="skeleton-line" style={{ width: "72%", height: 12 }} />
          <div className="home-skeleton-actions" style={{ justifyContent: "flex-start" }}>
            <span className="skeleton-pill" style={{ width: 176, height: 46 }} />
            <span className="skeleton-pill" style={{ width: 132, height: 46, background: "transparent" }} />
          </div>
        </div>
        <div className="about-art">
          <span className="skeleton-cover" style={{ width: "min(300px, 76%)", aspectRatio: "1", height: "auto", borderRadius: "50%" }} />
        </div>
      </section>

      {["about-intro", "about-values"].map((kelas) => (
        <section key={kelas} className={kelas} aria-hidden="true">
          <div className="about-section-heading">
            <span className="skeleton-line" style={{ width: 140, height: 9 }} />
            <span className="skeleton-line skeleton-title" style={{ width: "min(380px, 62%)", height: 32, marginTop: 14 }} />
          </div>
          <div className="home-skeleton-grid">
            {[0, 1].map((kolom) => (
              <div key={kolom} className="journal-skeleton-card">
                <span className="skeleton-line" style={{ width: "88%", height: 12, marginTop: 0 }} />
                <span className="skeleton-line" style={{ width: "96%", height: 12 }} />
                <span className="skeleton-line" style={{ width: "74%", height: 12 }} />
                <span className="skeleton-line" style={{ width: "84%", height: 12 }} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
