"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpen, FileText, MessageCircle } from "lucide-react";
import { pesanAsistensiBuku, pesanAsistensiJurnal } from "@/lib/whatsapp";
import { usePaketTerpilih } from "./use-paket-terpilih";

export type JenisAsistensi = "buku" | "jurnal";

/**
 * Label dan pembentuk pesan per jenis asistensi.
 *
 * Label buku dan label artikel sengaja tidak seragam — pemilik proyek
 * menyebutnya persis seperti ini, dan keduanya bicara tentang hal berbeda:
 * penulisan buku vs penulisan artikel jurnal ilmiah.
 */
const VARIAN: Record<
  JenisAsistensi,
  { label: string; id: string; pesan: (topik: string) => ReturnType<typeof pesanAsistensiBuku> }
> = {
  buku: {
    label: "Topik Asistensi Penulisan Buku",
    id: "topik-buku",
    pesan: pesanAsistensiBuku,
  },
  jurnal: {
    label: "Topik Asistensi Penulisan Artikel Jurnal Ilmiah",
    id: "topik-jurnal",
    pesan: pesanAsistensiJurnal,
  },
};

/**
 * Formulir asistensi — komponen klien, satu-satunya tempat topik
 * diketik. Topik tidak pernah dikirim ke server kita (tidak ada fetch,
 * server action, maupun localStorage); ia hanya pernah masuk isi pesan
 * WhatsApp dengan memanggil pembentuk pesan yang sesuai jenisnya.
 *
 * Validasi (trim, kosong murni, teks galatnya) seluruhnya milik
 * `lib/whatsapp.ts` — komponen hanya merender hasilnya, jadi aturannya
 * tidak pernah dobel di sini.
 *
 * Paket yang dipilih pengunjung di kartu tier ikut masuk ke pesan asistensi
 * buku (permintaan pemilik proyek, 24 Oktober 2026). Formulir jurnal tidak
 * memakai paket — halaman jurnal memang tidak punya tier harga.
 */
export function FormAsistensi({ jenis }: { jenis: JenisAsistensi }) {
  const varian = VARIAN[jenis];
  const [topik, setTopik] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  // Pendengar paket hanya dipasang di formulir buku.
  const paket = usePaketTerpilih(jenis === "buku");

  function saatDisubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hasil =
      jenis === "buku" ? pesanAsistensiBuku(topik, paket) : varian.pesan(topik);
    if (hasil.ok) {
      setGalat(null);
      window.open(hasil.url, "_blank", "noopener,noreferrer");
    } else {
      setGalat(hasil.error);
    }
  }

  const Ikon = jenis === "buku" ? BookOpen : FileText;

  return (
    <form onSubmit={saatDisubmit} noValidate className="asistensi-form">
      <div className="asistensi-field">
        <label htmlFor={varian.id} className="asistensi-label">
          <span className="asistensi-label-mark" aria-hidden="true">
            <Ikon size={14} strokeWidth={1.8} />
          </span>
          {varian.label}
        </label>

        <div className={`assist-input-shell${galat ? " has-error" : ""}`}>
          <Ikon aria-hidden="true" size={18} className="assist-input-icon" />
          <input
            id={varian.id}
            name="topik"
            type="text"
            value={topik}
            onChange={(e) => setTopik(e.target.value)}
            placeholder={
              jenis === "buku"
                ? "Tuliskan topik atau gagasan buku Anda"
                : "Tuliskan topik artikel yang ingin Anda konsultasikan"
            }
            aria-describedby={`assist-hint-${varian.id}`}
            aria-invalid={galat ? true : undefined}
            enterKeyHint="send"
            className="assist-topic-input"
          />
        </div>

        <p id={`assist-hint-${varian.id}`} className="assist-input-hint">
          Topik ini hanya digunakan untuk menyusun pesan WhatsApp kepada admin.
        </p>
      </div>

      {/* Area galat dirender selalu (kosong saat tidak ada galat) agar
          elemen `role="alert"` sudah ada di markup sejak awal — ditanam
          belakangan, region live bisa terlewat pembaca layar. */}
      <p role="alert" className="asistensi-error">
        {galat === null ? "" : galat}
      </p>

      <div className="asistensi-actions">
        <button type="submit" className="asistensi-submit">
          Lanjut ke WhatsApp <ArrowUpRight aria-hidden="true" size={16} />
        </button>
        <p className="asistensi-note">
          <MessageCircle aria-hidden="true" size={14} />
          Tidak ada unggahan berkas maupun pembayaran di situs ini.
        </p>
      </div>
    </form>
  );
}
