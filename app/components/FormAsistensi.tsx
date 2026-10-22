"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpen, FileText } from "lucide-react";
import { pesanAsistensiBuku, pesanAsistensiJurnal } from "@/lib/whatsapp";

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
 */
export function FormAsistensi({ jenis }: { jenis: JenisAsistensi }) {
  const varian = VARIAN[jenis];
  const [topik, setTopik] = useState("");
  const [galat, setGalat] = useState<string | null>(null);

  function saatDisubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hasil = varian.pesan(topik);
    if (hasil.ok) {
      setGalat(null);
      window.open(hasil.url, "_blank", "noopener,noreferrer");
    } else {
      setGalat(hasil.error);
    }
  }

  return (
    <form onSubmit={saatDisubmit} noValidate className="mt-8 grid gap-3">
      <label htmlFor={varian.id} className="font-medium text-teks">
        {varian.label}
      </label>
      <div className="assist-input-shell">
        {jenis === "buku" ? <BookOpen aria-hidden="true" size={18} /> : <FileText aria-hidden="true" size={18} />}
        <input
          id={varian.id}
          name="topik"
          type="text"
          value={topik}
          onChange={(e) => setTopik(e.target.value)}
          placeholder={jenis === "buku" ? "Tuliskan topik atau gagasan buku Anda" : "Tuliskan topik artikel yang ingin Anda konsultasikan"}
          aria-describedby={`assist-hint-${varian.id}`}
          className="assist-topic-input"
        />
      </div>
      <p id={`assist-hint-${varian.id}`} className="assist-input-hint">
        Topik ini hanya digunakan untuk menyusun pesan WhatsApp kepada admin.
      </p>
      {/* Area galat dirender selalu (kosong saat tidak ada galat) agar
          elemen `role="alert"` sudah ada di markup sejak awal — ditanam
          belakangan, region live bisa terlewat pembaca layar. */}
      <p role="alert" className="text-red-700">
        {galat === null ? "" : galat}
      </p>
      <button
        type="submit"
        className="assist-submit justify-self-start rounded-md bg-teal px-5 py-2.5 font-medium text-white hover:bg-teal-hover"
      >
        Lanjut ke WhatsApp <ArrowUpRight aria-hidden="true" size={16} />
      </button>
    </form>
  );
}
