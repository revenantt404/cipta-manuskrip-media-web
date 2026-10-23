"use client";

import { useEffect, useState } from "react";
import type { PaketTerpilih } from "@/lib/whatsapp";

/**
 * Nama peristiwa yang dilepas `PackagePicker` saat satu tier ditekan.
 * Diletakkan di satu tempat supaya pengirim dan pendengar tidak pernah
 * berbeda ejaan.
 */
export const PERISTIWA_PAKET = "cmm:paket-terpilih";

/**
 * Membaca tier yang sedang dipilih pengunjung.
 *
 * Pemilihan terjadi di komponen lain (kartu paket) tanpa induk bersama yang
 * menyimpan state, jadi jalurnya peristiwa `window` — pola yang sudah
 * dipakai `PackageSelectionStatus`. Dua komponen kini berbagi satu hook ini:
 * ringkasan pilihan di atas formulir dan pesan WhatsApp yang benar-benar
 * dikirim, sehingga keduanya tidak mungkin menampilkan paket berbeda.
 *
 * Pilihan tidak disimpan ke mana pun (tidak ke server, tidak ke
 * localStorage); ia hanya hidup selama halaman ini terbuka.
 */
export function usePaketTerpilih(aktif = true): PaketTerpilih | null {
  const [paket, setPaket] = useState<PaketTerpilih | null>(null);

  useEffect(() => {
    if (!aktif) return;

    function perbarui(event: Event) {
      const detail = (event as CustomEvent<PaketTerpilih>).detail;
      if (!detail?.nama) return;
      setPaket({ nama: detail.nama, harga: detail.harga ?? "" });
    }

    window.addEventListener(PERISTIWA_PAKET, perbarui);
    return () => window.removeEventListener(PERISTIWA_PAKET, perbarui);
  }, [aktif]);

  return paket;
}
