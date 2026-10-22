"use client";

import { useEffect, useState } from "react";
import { Check, Tag } from "lucide-react";

type Pilihan = { nama: string; harga: string };

export function PackageSelectionStatus() {
  const [pilihan, setPilihan] = useState<Pilihan | null>(null);

  useEffect(() => {
    function perbarui(event: Event) {
      setPilihan((event as CustomEvent<Pilihan>).detail);
    }
    window.addEventListener("cmm:paket-terpilih", perbarui);
    return () => window.removeEventListener("cmm:paket-terpilih", perbarui);
  }, []);

  if (!pilihan) return null;

  return (
    <div className="assist-selected-package" role="status">
      <span className="assist-selected-icon"><Check size={14} /></span>
      <span><small>Pilihan tier untuk referensi</small><strong><Tag size={12} /> {pilihan.nama} · {pilihan.harga}</strong><em>Pilihan ini tidak ikut terkirim; pesan WhatsApp berisi topik asistensi.</em></span>
    </div>
  );
}
