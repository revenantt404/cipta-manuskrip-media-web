import type { BookStatus } from "./types";

export type CatalogueKind = {
  status: BookStatus;
  heading: string;
  emptyMessage: string;
};

/**
 * Segmen alamat URL → maksud katalognya.
 *
 * `emptyMessage` adalah teks persis dari brief bagian 9, sudah disetujui
 * klien. Diperiksa di `status.test.ts` supaya tidak berubah tanpa sengaja
 * saat tampilan dirombak.
 */
const KINDS: Record<string, CatalogueKind> = {
  "telah-terbit": {
    status: "published",
    heading: "Buku yang Telah Terbit",
    emptyMessage: "Belum ada buku yang diterbitkan.",
  },
  "segera-terbit": {
    status: "upcoming",
    heading: "Buku Segera Terbit",
    emptyMessage: "Belum ada buku yang segera terbit.",
  },
};

export function catalogueKind(segment: string): CatalogueKind | null {
  return KINDS[segment] ?? null;
}
