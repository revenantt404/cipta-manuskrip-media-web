"use client";

import { Check, Tag } from "lucide-react";
import { usePaketTerpilih } from "./use-paket-terpilih";

/**
 * Ringkasan tier yang dipilih, tampil tepat di atas formulir asistensi.
 *
 * Komponen ini dan formulir membaca pilihan yang sama lewat
 * `usePaketTerpilih`, jadi yang tertulis di sini dijamin sama dengan yang
 * ikut terkirim ke WhatsApp — tidak ada dua sumber kebenaran.
 */
export function PackageSelectionStatus() {
  const pilihan = usePaketTerpilih();

  if (!pilihan) return null;

  return (
    <div className="assist-selected-package" role="status">
      <span className="assist-selected-icon"><Check size={14} /></span>
      <span>
        <small>Paket yang Anda pilih</small>
        <strong><Tag size={12} /> {pilihan.nama}{pilihan.harga ? ` · ${pilihan.harga}` : ""}</strong>
        <em>Paket ini ikut disertakan pada pesan WhatsApp asistensi Anda.</em>
      </span>
    </div>
  );
}
