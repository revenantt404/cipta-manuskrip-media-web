import { ArrowDown, ArrowUpRight, BookOpen, Feather, PenLine, ServerCrash } from "lucide-react";
import { listBooks } from "@/lib/books/repository";
import { catalogueKind } from "@/lib/books/status";
import { CataloguePreview } from "@/components/CataloguePreview";
import { FormAsistensi } from "@/components/FormAsistensi";
import { PackagePicker } from "@/components/PackagePicker";
import { PackageSelectionStatus } from "@/components/PackageSelectionStatus";
import { PAKET_BUKU, PREVIEW_LIMIT } from "@/content/site";

// Wajib: halaman membaca database. Tanpa ini Next.js membekukan hasil query
// saat build dan previewnya tidak melihat buku yang baru ditambahkan admin —
// kelas bug yang sama dengan katalog.
export const dynamic = "force-dynamic";

/**
 * Halaman layanan publish buku. Data dan aturan bisnis tetap bersumber dari
 * content/site.ts dan komponen yang sudah ada; perubahan di file ini khusus UI.
 * Layout publik memiliki satu-satunya <main>, jadi pembungkusnya <div>.
 */
export default async function Page() {
  const sudahTerbit = catalogueKind("telah-terbit");
  const segeraTerbit = catalogueKind("segera-terbit");

  let hasil: Awaited<ReturnType<typeof duaPreview>> | null;
  try {
    hasil = sudahTerbit === null || segeraTerbit === null ? null : await duaPreview();
  } catch {
    hasil = null;
  }

  return (
    <div className="publish-page">
      <section className="publish-hero">
        <div aria-hidden="true" className="publish-orb publish-orb-one" />
        <div aria-hidden="true" className="publish-orb publish-orb-two" />
        <div className="publish-hero-content">
          <p className="publish-eyebrow"><BookOpen size={14} /> PENERBITAN BUKU</p>
          <h1>Terbit Buku Sekali Klik.</h1>
          <p className="publish-lede">Layanan penerbitan buku dan pendampingan penulisan untuk membantu naskah Anda melangkah menuju publikasi.</p>
          <div className="publish-hero-actions">
            <a href="#paket" className="publish-button publish-button-primary">Kirim Naskah <ArrowUpRight size={16} /></a>
            <a href="#asistensi" className="publish-button publish-button-secondary">Asistensi Penulisan <ArrowUpRight size={16} /></a>
          </div>
          <a href="#paket" className="publish-scroll"><span>Lihat pilihan paket</span><ArrowDown size={14} /></a>
        </div>
        <div className="publish-hero-art" aria-hidden="true">
          <div className="publish-art-glow" />
          <div className="publish-sheet sheet-back"><i /><i /><i /></div>
          <div className="publish-sheet sheet-front"><span className="sheet-emblem"><Feather size={22} /></span><i /><i /><i /><small>CIPTA MANUSKRIP MEDIA</small></div>
          <span className="art-spark art-spark-one">✳</span><span className="art-spark art-spark-two">✳</span>
          <span className="art-label">DARI NASKAH MENJADI BUKU</span>
        </div>
      </section>

      <PackagePicker tiers={PAKET_BUKU} />

      <section id="asistensi" className="assist-section scroll-mt-24">
        <div className="assist-copy">
          <p className="publish-section-kicker">PENDAMPINGAN NASKAH</p>
          <h2>Setiap ide layak mendapat ruang untuk tumbuh.</h2>
          <p>Pendampingan penulisan untuk artikel dan naskah buku. Hubungi admin untuk menanyakan ruang lingkup dan jadwalnya.</p>
          <div className="assist-note"><PenLine size={17} /><span>Mulai dengan menceritakan topik atau gagasan buku Anda.</span></div>
        </div>
        <div className="assist-form-card"><PackageSelectionStatus /><FormAsistensi jenis="buku" /></div>
      </section>

      <section className="book-preview-section">
        <div className="preview-intro">
          <p className="publish-section-kicker">KATALOG</p>
          <h2>Sebagian buku kami</h2>
          <p>
            Pratinjau singkat dari katalog. Seluruh judul tersedia di halaman katalog,
            terurut A–Z.
          </p>
        </div>

        {sudahTerbit === null || hasil === null ? (
          <div data-testid="db-error" className="preview-error" role="status">
            <span className="preview-error-icon" aria-hidden="true">
              <ServerCrash size={19} strokeWidth={1.6} />
            </span>
            <div>
              <strong>Preview katalog sedang tidak dapat dimuat</strong>
              <p>Silakan coba beberapa saat lagi. Bagian lain halaman ini tetap dapat digunakan.</p>
            </div>
          </div>
        ) : (
          <>
            <div data-testid="preview-telah-terbit">
              <CataloguePreview heading={sudahTerbit.heading} emptyMessage={sudahTerbit.emptyMessage} items={hasil.terbit.items} lihatSemuaHref="/katalog/telah-terbit" />
            </div>
            {segeraTerbit === null ? null : (
              <div data-testid="preview-segera-terbit">
                <CataloguePreview heading={segeraTerbit.heading} emptyMessage={segeraTerbit.emptyMessage} items={hasil.segera.items} lihatSemuaHref="/katalog/segera-terbit" />
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

async function duaPreview() {
  const sudah = await listBooks({ status: "published", page: 1, pageSize: PREVIEW_LIMIT });
  const akan = await listBooks({ status: "upcoming", page: 1, pageSize: PREVIEW_LIMIT });
  return { terbit: sudah, segera: akan };
}
