import { Sparkles } from "lucide-react";

/**
 * Ringkasan katalog di kepala halaman `/katalog/[status]`.
 *
 * Isinya sengaja hanya fakta yang benar-benar diketahui halaman ini:
 * jumlah buku pada status tersebut, aturan urutannya, ukuran halaman, dan
 * posisi halaman. Tidak ada angka karangan (mis. "dibaca 1.200 kali") dan
 * tidak ada janji yang tidak bisa dibuktikan dari data.
 *
 * Angka jumlah ditulis terpisah dari kata "buku" supaya bisa diberi ukuran
 * dan warna berbeda — bentuk yang jauh lebih mudah dipindai daripada satu
 * kalimat "1 buku" berukuran seragam.
 */
export function KatalogStat({
  total,
  page,
  totalPages,
  pageSize,
  sudahTerbit,
}: {
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  sudahTerbit: boolean;
}) {
  const jumlah = total.toLocaleString("id-ID");
  const persenHalaman = Math.round((page / Math.max(totalPages, 1)) * 100);

  return (
    <aside className="katalog-stat" aria-label="Ringkasan katalog">
      <span className="katalog-stat-glow" aria-hidden="true" />

      <div className="katalog-stat-top">
        <p className="katalog-stat-kicker">Ringkasan katalog</p>
        <span className="katalog-stat-icon" aria-hidden="true">
          <Sparkles size={15} strokeWidth={1.7} />
        </span>
      </div>

      <p className="katalog-stat-count">
        <strong>{jumlah}</strong>
        <span>buku</span>
      </p>

      <p className="katalog-stat-state">
        <span className={`katalog-stat-dot${sudahTerbit ? "" : " is-soon"}`} aria-hidden="true" />
        {sudahTerbit ? "Sudah terbit dan bisa dipesan" : "Sedang disiapkan menuju terbit"}
      </p>

      <p className="katalog-stat-note">
        Urutan judul A–Z, tanpa filter, agar mudah dirujuk.
      </p>

      <div className="katalog-stat-meta">
        <span className="katalog-stat-chip">{pageSize} per halaman</span>
        <span className="katalog-stat-chip">
          Halaman {page} dari {totalPages}
        </span>
      </div>

      {totalPages > 1 ? (
        <span className="katalog-stat-meter" aria-hidden="true">
          <i style={{ width: `${persenHalaman}%` }} />
        </span>
      ) : null}

      {/* Deretan punggung buku: hiasan yang mengingatkan isi halaman ini
          adalah rak, bukan sekadar angka. */}
      <span className="katalog-stat-shelf" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </aside>
  );
}
