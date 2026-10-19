import { readFile } from "node:fs/promises";
import path from "node:path";
import { dirSampul, namaSampulSah } from "@/lib/storage/path";

/**
 * Penyaji berkas sampul.
 *
 * Sampul TIDAK disajikan dari `public/`, dan itu disengaja. `next start`
 * menyusun daftar berkas `public/` sekali saat boot, jadi sampul yang
 * ditulis setelah server menyala selalu 404 sampai server dijalankan ulang
 * — terbukti lewat pengukuran pada verifikasi HTTP Fase 2: berkas ada di
 * disk dan barisnya benar di database, tetapi `GET /covers/<nama>` menjawab
 * 404, dan berkas yang sama menjawab 200 setelah server di-restart. Lebih
 * dari itu, `COVER_DIR` boleh menunjuk ke luar folder aplikasi
 * (`DESIGN-STACK.md` bagian 5), dan folder seperti itu tidak akan pernah
 * tersaji dari `public/` sama sekali.
 *
 * Handler ini membaca disk pada setiap permintaan, sehingga sampul yang baru
 * diunggah langsung dapat dibuka tanpa menunggu restart.
 */

// Sampul adalah data yang berubah saat aplikasi berjalan; tidak ada versi
// yang boleh disiapkan saat build.
export const dynamic = "force-dynamic";

const TIPE_ISI = "image/webp";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ berkas: string }> }
): Promise<Response> {
  const { berkas } = await params;

  // Nama berkas harus berbentuk persis seperti yang ditulis
  // `processAndSaveCover`. Daftar izin ini yang menutup path traversal —
  // nama apa pun yang memuat garis miring, titik-titik, atau backslash tidak
  // pernah sampai ke `path.join`.
  if (!namaSampulSah(berkas)) {
    return new Response(null, { status: 404 });
  }

  let isi: Buffer;
  try {
    isi = await readFile(path.join(dirSampul(), berkas));
  } catch {
    // Termasuk folder sampul yang belum ada: lingkungan baru sebelum
    // unggahan pertama. Yang penting jangan melempar — respons 500 dengan
    // jejak tumpukan tidak berguna bagi peramban.
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(isi), {
    status: 200,
    headers: {
      "content-type": TIPE_ISI,
      "content-length": String(isi.length),
      // Nama berkas memuat UUID baru setiap kali sampul diganti, jadi satu
      // URL selalu berisi gambar yang sama. Tanpa ini `max-age=0` bawaan
      // Next.js membuat peramban meminta ulang semua sampul setiap kali
      // halaman katalog dibuka.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
