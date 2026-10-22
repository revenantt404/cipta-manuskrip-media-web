"use client";

import { useState } from "react";
import { ArrowDown, BookOpen, Check, Sparkles } from "lucide-react";

type Tier = { nama: string; harga: string; fasilitas: readonly string[] };

export function PackagePicker({ tiers }: { tiers: readonly Tier[] }) {
  const [pilihan, setPilihan] = useState<string | null>(null);

  function pilih(tier: Tier) {
    setPilihan(tier.nama);
    window.dispatchEvent(new CustomEvent("cmm:paket-terpilih", { detail: { nama: tier.nama, harga: tier.harga } }));
    document.getElementById("asistensi")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="paket" className="package-section scroll-mt-24">
      <div className="package-heading">
        <div>
          <p className="publish-section-kicker">PILIHAN PENERBITAN</p>
          <h2>Paket Terbit Buku</h2>
        </div>
        <p className="package-intro">Tiga pilihan dengan cakupan berbeda, dari layanan paling lengkap hingga kebutuhan inti.</p>
      </div>
      {pilihan ? (
        <p className="package-selection-note" role="status">
          <span>{pilihan} dipilih</span><ArrowDown size={14} /> Lanjutkan dengan topik asistensi buku di bawah.
        </p>
      ) : null}
      <div className="package-grid">
        {tiers.map((tier, i) => {
          const terpilih = pilihan === tier.nama;
          return (
            <article key={tier.nama} className={`package-card package-card-${i + 1}${terpilih ? " is-selected" : ""}`}>
              <div className="package-card-top">
                <span className="package-index">PAKET <b>0{i + 1}</b>{i === 0 ? <span className="tier-mark"> PALING LENGKAP</span> : null}</span>
                <span className="package-symbol" aria-hidden="true"><Sparkles size={16} /></span>
              </div>
              <h3>{tier.nama}</h3>
              <p className="package-price-label">Investasi penerbitan</p>
              <p className="package-price">{tier.harga}</p>
              <div className="package-divider" />
              <ul className="package-includes">
                {tier.fasilitas.map((fasilitas) => (
                  <li key={fasilitas}><span className="package-check"><Check size={13} /></span>{fasilitas}</li>
                ))}
              </ul>
              <button type="button" className="package-action" aria-pressed={terpilih} onClick={() => pilih(tier)}>
                {terpilih ? "Paket Dipilih" : "Pilih Paket"}
              </button>
              <div className="package-bottom"><span>CV Cipta Manuskrip Media</span><BookOpen size={17} /></div>
            </article>
          );
        })}
      </div>
      <p className="package-footnote">Simulasi tier untuk eksplorasi UI — nama, harga, dan fasilitas ini belum merupakan penawaran resmi.</p>
    </section>
  );
}
