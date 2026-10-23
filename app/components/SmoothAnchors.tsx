"use client";

import { useEffect } from "react";

/**
 * Menggulir halus untuk tautan jangkar dalam satu halaman.
 *
 * Halaman publik memakai jangkar (`#pilih-layanan`, `#paket`, `#asistensi`)
 * supaya pengunjung tidak perlu menggulir jauh. Tanpa ini, lompatannya
 * mendadak dan posisi baru sulit diikuti mata.
 *
 * Yang diubah hanya gulirannya:
 * - `scrollIntoView` menghormati `scroll-margin-top` pada bagian tujuan,
 *   jadi judulnya tetap berhenti di bawah navbar yang menempel;
 * - `prefers-reduced-motion` tetap mendapat lompatan biasa, bukan animasi;
 * - fokus dipindahkan ke bagian tujuan (dengan `tabindex="-1"` sementara)
 *   supaya pengguna pembaca layar dan keyboard ikut berpindah, bukan hanya
 *   mata. Tanpa ini, Tab berikutnya akan kembali ke awal dokumen.
 *
 * Alamat ikut diperbarui (`replaceState`, bukan entri riwayat baru) supaya
 * tautan ke bagian tertentu tetap bisa disalin dan dibagikan. Karena
 * `replaceState` tidak memicu lompatan gulir maupun `popstate`, tombol
 * Kembali tetap kembali ke halaman sebelumnya — bukan menelusuri tiap
 * jangkar yang pernah ditekan.
 */
export function SmoothAnchors() {
  useEffect(() => {
    const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)");

    function saatKlik(event: MouseEvent) {
      // Biarkan peramban menangani klik dengan pengubah (tab baru, unduh),
      // klik tengah, dan tautan yang sudah dicegah komponen lain.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const sasaran = event.target as Element | null;
      const tautan = sasaran?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!tautan) return;

      const id = tautan.getAttribute("href")?.slice(1);
      if (!id) return;

      const tujuan = document.getElementById(id);
      if (!tujuan) return;

      event.preventDefault();
      tujuan.scrollIntoView({
        behavior: kurangiGerak.matches ? "auto" : "smooth",
        block: "start",
      });

      // Sinkronkan alamat tanpa memicu lompatan kedua.
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}#${id}`
      );

      if (!tujuan.hasAttribute("tabindex")) {
        tujuan.setAttribute("tabindex", "-1");
      }
      tujuan.focus({ preventScroll: true });
    }

    document.addEventListener("click", saatKlik);
    return () => document.removeEventListener("click", saatKlik);
  }, []);

  return null;
}
