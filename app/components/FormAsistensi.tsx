"use client";

import { useState } from "react";
import { pesanAsistensi } from "@/lib/whatsapp";

/**
 * Formulir asistensi — komponen klien, satu-satunya tempat topik
 * diketik. Topik tidak pernah dikirim ke server kita (tidak ada fetch,
 * server action, maupun localStorage); ia hanya pernah masuk isi pesan
 * WhatsApp dengan memanggil `pesanAsistensi`.
 *
 * Validasi (trim, kosong murni, teks galatnya) seluruhnya milik
 * `pesanAsistensi` — komponen hanya merender hasilnya, jadi aturannya
 * tidak pernah dobel di sini.
 */
export function FormAsistensi() {
  const [topik, setTopik] = useState("");
  const [galat, setGalat] = useState<string | null>(null);

  function saatDisubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hasil = pesanAsistensi(topik);
    if (hasil.ok) {
      setGalat(null);
      window.open(hasil.url, "_blank", "noopener,noreferrer");
    } else {
      setGalat(hasil.error);
    }
  }

  return (
    <form onSubmit={saatDisubmit} noValidate className="mt-8 grid gap-3">
      <label htmlFor="topik" className="font-medium text-teks">
        Topik asistensi
      </label>
      <input
        id="topik"
        name="topik"
        type="text"
        value={topik}
        onChange={(e) => setTopik(e.target.value)}
        className="rounded-md border border-garis bg-white px-4 py-2.5 text-teks"
      />
      {/* Area galat dirender selalu (kosong saat tidak ada galat) agar
          elemen `role="alert"` sudah ada di markup sejak awal — ditanam
          belakangan, region live bisa terlewat pembaca layar. */}
      <p role="alert" className="text-red-700">
        {galat === null ? "" : galat}
      </p>
      <button
        type="submit"
        className="justify-self-start rounded-md bg-teal px-5 py-2.5 font-medium text-white hover:bg-teal-hover"
      >
        Lanjut ke WhatsApp
      </button>
    </form>
  );
}
