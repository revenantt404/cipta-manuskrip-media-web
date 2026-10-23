import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import BerandaLoading from "@/app/(publik)/loading";
import PublishBukuLoading from "@/app/(publik)/publish-buku/loading";
import PublishJurnalLoading from "@/app/(publik)/publish-jurnal/loading";
import AsistensiLoading from "@/app/(publik)/publish-jurnal/asistensi/loading";
import KirimArtikelLoading from "@/app/(publik)/publish-jurnal/kirim-artikel/loading";
import TentangKamiLoading from "@/app/(publik)/tentang-kami/loading";
import KatalogLoading from "@/app/(publik)/katalog/[status]/loading";
import BukuLoading from "@/app/(publik)/buku/[slug]/loading";
import AdminLoading from "@/app/admin/(terlindungi)/loading";
import AdminPreviewLoading from "@/app/admin/preview/loading";

/**
 * Kerangka muat tiap segmen rute.
 *
 * Yang dijaga di sini bukan bentuk visualnya, melainkan tiga janji yang
 * gampang rusak tanpa terlihat:
 *
 * 1. setiap segmen yang bisa tertunda punya kerangka — kalau satu berkas
 *    `loading.tsx` terhapus, pengunjung kembali melihat area kosong;
 * 2. kerangka ditandai `aria-busy` dan punya teks untuk pembaca layar,
 *    sehingga status "sedang memuat" tidak hanya disampaikan lewat warna;
 * 3. isi kerangka ditandai `aria-hidden`, jadi pembaca layar tidak
 *    membacakan deretan kotak hiasan.
 */
const KERANGKA = [
  ["beranda", BerandaLoading],
  ["publish-buku", PublishBukuLoading],
  ["publish-jurnal", PublishJurnalLoading],
  ["publish-jurnal/asistensi", AsistensiLoading],
  ["publish-jurnal/kirim-artikel", KirimArtikelLoading],
  ["tentang-kami", TentangKamiLoading],
  ["katalog/[status]", KatalogLoading],
  ["buku/[slug]", BukuLoading],
  ["admin", AdminLoading],
  ["admin/preview", AdminPreviewLoading],
] as const;

describe("kerangka muat tiap segmen rute", () => {
  it.each(KERANGKA)("%s punya kerangka bertanda aria-busy", (_nama, Komponen) => {
    const html = renderToStaticMarkup(<Komponen />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-live="polite"');
  });

  it.each(KERANGKA)("%s memakai kelas skeleton, bukan kotak kosong", (_nama, Komponen) => {
    const html = renderToStaticMarkup(<Komponen />);
    expect(html).toContain("skeleton-");
    expect(html).toMatch(/aria-hidden="true"/);
  });

  it.each(KERANGKA)("%s memberi teks status untuk pembaca layar", (_nama, Komponen) => {
    const html = renderToStaticMarkup(<Komponen />);
    expect(html).toMatch(/<p class="sr-only">Memuat [^<]+<\/p>/);
  });

  it.each(KERANGKA)("%s tidak menambah landmark main kedua", (_nama, Komponen) => {
    const html = renderToStaticMarkup(<Komponen />);
    expect(html).not.toContain("<main");
  });
});
