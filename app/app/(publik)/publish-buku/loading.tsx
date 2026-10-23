/**
 * Kerangka muat halaman Penerbitan Buku.
 *
 * Susunannya meniru halaman aslinya — banner bersudut bulat, tiga kartu
 * paket sejajar, lalu blok asistensi dua kolom — sehingga saat konten
 * datang tidak ada lompatan tata letak yang membuat mata kehilangan
 * tempat. Halaman ini membaca database untuk pratinjau katalog, jadi pada
 * sambungan lambat kerangka inilah yang terlihat.
 */
export default function Loading() {
  return (
    <div className="publish-page" aria-busy="true" aria-live="polite">
      <p className="sr-only">Memuat layanan penerbitan buku…</p>

      <section className="publish-hero" aria-hidden="true">
        <div className="publish-hero-content">
          <span className="skeleton-pill" style={{ width: 168 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "88%", height: 44, marginTop: 22 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "62%", height: 44, marginTop: 12 }} />
          <span className="skeleton-line" style={{ width: "92%", height: 12, marginTop: 22 }} />
          <span className="skeleton-line" style={{ width: "78%", height: 12 }} />
          <div className="home-skeleton-actions" style={{ justifyContent: "flex-start" }}>
            <span className="skeleton-pill" style={{ width: 132, height: 47 }} />
            <span className="skeleton-pill" style={{ width: 158, height: 47 }} />
          </div>
        </div>
        <div className="publish-hero-art">
          <span className="skeleton-cover" style={{ width: 190, height: 250, borderRadius: 12 }} />
        </div>
      </section>

      <section className="package-section" aria-hidden="true">
        <div className="package-heading">
          <div>
            <span className="skeleton-line" style={{ width: 150, height: 9 }} />
            <span className="skeleton-line skeleton-title" style={{ width: 300, height: 34, marginTop: 14 }} />
          </div>
          <span className="skeleton-line" style={{ width: 260, height: 12 }} />
        </div>
        <div className="package-grid">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="package-card">
              <div className="home-skeleton-between">
                <span className="skeleton-line" style={{ width: 74, height: 9, marginTop: 0 }} />
                <span className="skeleton-pill" style={{ width: 33, height: 33, borderRadius: 10 }} />
              </div>
              <span className="skeleton-line skeleton-title" style={{ width: "70%", height: 20, marginTop: 24 }} />
              <span className="skeleton-line" style={{ width: 110, height: 9, marginTop: 20 }} />
              <span className="skeleton-line skeleton-title" style={{ width: "58%", height: 26, marginTop: 10 }} />
              <span className="skeleton-line" style={{ width: "100%", height: 1, marginTop: 20 }} />
              {Array.from({ length: 4 }, (_, j) => (
                <span key={j} className="skeleton-line" style={{ width: j === 3 ? "56%" : "86%", height: 11, marginTop: 16 }} />
              ))}
              <span className="skeleton-pill skeleton-wide" style={{ marginTop: "auto" }} />
            </div>
          ))}
        </div>
      </section>

      <section className="assist-section" aria-hidden="true">
        <div>
          <span className="skeleton-line" style={{ width: 140, height: 9 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "90%", height: 34, marginTop: 18 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "62%", height: 34, marginTop: 12 }} />
          <span className="skeleton-line" style={{ width: "84%", height: 12, marginTop: 22 }} />
          <span className="skeleton-line" style={{ width: "64%", height: 12 }} />
        </div>
        <div className="assist-form-card">
          <span className="skeleton-line" style={{ width: 190, height: 10 }} />
          <span className="skeleton-line" style={{ width: "100%", height: 46, marginTop: 18, borderRadius: 12 }} />
          <span className="skeleton-line" style={{ width: "70%", height: 9 }} />
          <span className="skeleton-line" style={{ width: "100%", height: 48, marginTop: 20, borderRadius: 12 }} />
        </div>
      </section>
    </div>
  );
}
