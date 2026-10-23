import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  LibraryBig,
  RefreshCw,
  ServerCrash,
} from "lucide-react";
import { notFound } from "next/navigation";
import { listBooks } from "@/lib/books/repository";
import { catalogueKind } from "@/lib/books/status";
import { BookCard } from "@/components/BookCard";
import { KatalogStat } from "@/components/KatalogStat";

// Wajib: tanpa ini Next.js membekukan hasil query saat build dan katalog
// berhenti menampilkan buku yang baru ditambahkan. `/admin` juga bergantung
// padanya agar tidak di-cache.
export const dynamic = "force-dynamic";

const TAB = [
  { label: "Telah terbit", href: "/katalog/telah-terbit", status: "telah-terbit" },
  { label: "Segera terbit", href: "/katalog/segera-terbit", status: "segera-terbit" },
] as const;

/**
 * Judul tab per katalog. Tanpa ini kedua halaman katalog berbagi judul
 * bawaan situs, dan pengunjung yang membuka keduanya tidak bisa membedakan
 * tabnya — termasuk saat menyimpan tautan atau membagikannya.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ status: string }>;
}): Promise<Metadata> {
  const { status } = await params;
  const kind = catalogueKind(status);
  if (kind === null) return {};

  return {
    title: kind.heading,
    description:
      kind.status === "published"
        ? "Katalog buku CV Cipta Manuskrip Media yang telah terbit, lengkap dengan ISBN, harga cetak, dan sewa ebook."
        : "Daftar buku CV Cipta Manuskrip Media yang sedang disiapkan menuju terbit beserta estimasi waktunya.",
  };
}

const PENGANTAR: Record<string, string> = {
  "telah-terbit":
    "Buku yang sudah terbit dan tercatat lengkap dengan ISBN serta harganya. Pesanan diteruskan langsung ke admin lewat WhatsApp.",
  "segera-terbit":
    "Naskah yang sedang disiapkan menuju terbit. Status ISBN ditampilkan apa adanya, tanpa harga, karena bukunya belum dapat dipesan.",
};

/** Nomor halaman yang ditampilkan: selalu 1 dan halaman terakhir, plus tetangga halaman aktif. */
function nomorHalaman(aktif: number, total: number): Array<number | "jeda"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const dipilih = new Set<number>([1, total, aktif - 1, aktif, aktif + 1]);
  const urut = [...dipilih].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const keluaran: Array<number | "jeda"> = [];
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) keluaran.push("jeda");
    keluaran.push(n);
  });
  return keluaran;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ status: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { status } = await params;
  const kind = catalogueKind(status);
  if (kind === null) notFound();

  const { page } = await searchParams;

  let hasil;
  try {
    hasil = await listBooks({ status: kind.status, page: Number(page ?? 1) });
  } catch {
    return (
      <div className="katalog-page">
        <nav className="katalog-crumbs" aria-label="Navigasi remah roti">
          <Link href="/">Beranda</Link>
          <ChevronRight aria-hidden="true" size={13} />
          <span aria-current="page">Katalog</span>
        </nav>

        <header className="katalog-hero katalog-hero--plain">
          <div className="katalog-hero-copy">
            <p className="katalog-kicker">Katalog penerbitan</p>
            <h1>{kind.heading}</h1>
            <p className="katalog-lede">{PENGANTAR[status]}</p>

            <nav className="katalog-tabs" aria-label="Pilih katalog">
              {TAB.map((tab) => (
                <Link
                  key={tab.status}
                  href={tab.href}
                  className={`katalog-tab${tab.status === status ? " is-active" : ""}`}
                  aria-current={tab.status === status ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div data-testid="db-error" className="katalog-error" role="status">
          <span className="katalog-error-icon" aria-hidden="true">
            <ServerCrash size={20} strokeWidth={1.6} />
          </span>
          <div>
            <strong>Katalog sedang tidak dapat dimuat</strong>
            <p>
              Sambungan ke database belum tersedia. Silakan coba beberapa saat lagi —
              halaman lain di situs ini tetap dapat dibuka.
            </p>
            <Link href={kind.status === "published" ? "/katalog/telah-terbit" : "/katalog/segera-terbit"} className="katalog-error-retry">
              <RefreshCw aria-hidden="true" size={14} /> Muat ulang katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sudahTerbit = kind.status === "published";
  const halaman = nomorHalaman(hasil.page, hasil.totalPages);

  return (
    <div className="katalog-page">
      <nav className="katalog-crumbs" aria-label="Navigasi remah roti">
        <Link href="/">Beranda</Link>
        <ChevronRight aria-hidden="true" size={13} />
        <Link href="/publish-buku">Penerbitan Buku</Link>
        <ChevronRight aria-hidden="true" size={13} />
        <span aria-current="page">{kind.heading}</span>
      </nav>

      <header className="katalog-hero">
        <div className="katalog-hero-copy">
          <p className="katalog-kicker">
            {sudahTerbit ? <LibraryBig aria-hidden="true" size={13} /> : <Clock3 aria-hidden="true" size={13} />}
            Katalog penerbitan
          </p>
          <h1>{kind.heading}</h1>
          <p className="katalog-lede">{PENGANTAR[status]}</p>

          <nav className="katalog-tabs" aria-label="Pilih katalog">
            {TAB.map((tab) => (
              <Link
                key={tab.status}
                href={tab.href}
                className={`katalog-tab${tab.status === status ? " is-active" : ""}`}
                aria-current={tab.status === status ? "page" : undefined}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        <KatalogStat
          total={hasil.total}
          page={hasil.page}
          totalPages={hasil.totalPages}
          pageSize={hasil.pageSize}
          sudahTerbit={sudahTerbit}
        />
      </header>

      {hasil.items.length === 0 ? (
        <div data-testid="empty" className="katalog-empty">
          <span className="katalog-empty-icon" aria-hidden="true">
            <LibraryBig size={24} strokeWidth={1.5} />
          </span>
          <h2>{kind.emptyMessage}</h2>
          <p>
            Katalog diisi langsung oleh admin. Sementara menunggu, Anda dapat melihat
            layanan penerbitan atau menghubungi admin untuk menanyakan rencana terbit.
          </p>
          <div className="katalog-empty-actions">
            <Link href="/publish-buku" className="katalog-button katalog-button--primary">
              Lihat layanan penerbitan <ChevronRight aria-hidden="true" size={15} />
            </Link>
            <Link href="/tentang-kami" className="katalog-button">
              Hubungi admin
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="kat-grid">
            {hasil.items.map((buku) => (
              <li key={buku.id}>
                <BookCard book={buku} />
              </li>
            ))}
          </ul>

          {hasil.totalPages > 1 ? (
            <nav className="katalog-pagination" aria-label="Navigasi halaman">
              {hasil.page > 1 ? (
                <Link href={`?page=${hasil.page - 1}`} rel="prev" className="katalog-page-step">
                  <ChevronLeft aria-hidden="true" size={15} /> Sebelumnya
                </Link>
              ) : (
                <span className="katalog-page-step is-disabled" aria-disabled="true">
                  <ChevronLeft aria-hidden="true" size={15} /> Sebelumnya
                </span>
              )}

              <ol className="katalog-page-list">
                {halaman.map((n, i) =>
                  n === "jeda" ? (
                    <li key={`jeda-${i}`} className="katalog-page-gap" aria-hidden="true">
                      …
                    </li>
                  ) : (
                    <li key={n}>
                      <Link
                        href={`?page=${n}`}
                        aria-current={n === hasil.page ? "page" : undefined}
                        className={`katalog-page-number${n === hasil.page ? " is-active" : ""}`}
                      >
                        {n}
                      </Link>
                    </li>
                  )
                )}
              </ol>

              {hasil.page < hasil.totalPages ? (
                <Link href={`?page=${hasil.page + 1}`} rel="next" className="katalog-page-step">
                  Berikutnya <ChevronRight aria-hidden="true" size={15} />
                </Link>
              ) : (
                <span className="katalog-page-step is-disabled" aria-disabled="true">
                  Berikutnya <ChevronRight aria-hidden="true" size={15} />
                </span>
              )}
            </nav>
          ) : null}
        </>
      )}

      <aside className="katalog-help">
        <div>
          <p className="katalog-kicker">Butuh buku tertentu?</p>
          <h2>Tanyakan langsung ke admin.</h2>
          <p>
            Sampaikan judul yang Anda cari lewat WhatsApp. Admin akan membantu memastikan
            ketersediaan cetak maupun sewa ebook.
          </p>
        </div>
        <Link href="/tentang-kami" className="katalog-button katalog-button--primary">
          Lihat kontak admin <ChevronRight aria-hidden="true" size={15} />
        </Link>
      </aside>
    </div>
  );
}
