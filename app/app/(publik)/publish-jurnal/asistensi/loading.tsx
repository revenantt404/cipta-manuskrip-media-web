/**
 * Kerangka muat halaman asistensi artikel jurnal — bentuk banner ringkas
 * ditambah satu kartu formulir, sama seperti halaman aslinya.
 */
export default function Loading() {
  return (
    <div className="journal-page journal-flow-page" aria-busy="true" aria-live="polite">
      <p className="sr-only">Memuat asistensi penulisan artikel…</p>

      <section className="journal-flow-hero" aria-hidden="true">
        <span className="skeleton-line" style={{ width: 190, height: 9, background: "rgba(255,255,255,.22)" }} />
        <span className="skeleton-line skeleton-title" style={{ width: "min(520px, 80%)", height: 44, marginTop: 22, background: "rgba(255,255,255,.18)" }} />
        <span className="skeleton-line" style={{ width: "min(430px, 72%)", height: 12, marginTop: 20, background: "rgba(255,255,255,.14)" }} />
        <span className="skeleton-line" style={{ width: "min(330px, 56%)", height: 12, background: "rgba(255,255,255,.14)" }} />
      </section>

      <section className="assist-section" aria-hidden="true">
        <div>
          <span className="skeleton-line" style={{ width: 150, height: 9 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "88%", height: 34, marginTop: 18 }} />
          <span className="skeleton-line skeleton-title" style={{ width: "58%", height: 34, marginTop: 12 }} />
          <span className="skeleton-line" style={{ width: "86%", height: 12, marginTop: 22 }} />
          <span className="skeleton-line" style={{ width: "66%", height: 12 }} />
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
