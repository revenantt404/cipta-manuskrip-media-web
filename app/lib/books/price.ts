/**
 * Harga buku — pembacaan dari formulir dan penulisan ke layar.
 *
 * Dipisahkan dari komponen supaya aturan "apa yang dianggap harga sah"
 * bisa diuji tanpa merender halaman, dan supaya kartu katalog serta
 * halaman detail tidak punya dua salinan aturan yang bisa menyimpang.
 *
 * Harga disimpan di database sebagai `DECIMAL(12,2)`, NULL bila admin
 * belum menetapkannya. Layar menampilkan `-` untuk NULL — keputusan
 * pemilik proyek: field yang belum diisi tidak boleh tampak seperti
 * angka nol atau gratis.
 */

/** Nilai yang ditampilkan saat harga belum ditetapkan. */
export const HARGA_KOSONG = "-";

/**
 * Angka rupiah menjadi teks tampilan: `85000` → `Rp85.000`.
 *
 * `Intl.NumberFormat` dipakai, bukan penggabungan string manual, karena
 * pemisah ribuan Indonesia (titik) dan perilaku pembulatan sudah benar di
 * dalamnya. `maximumFractionDigits: 0` disengaja: rupiah tidak ditulis
 * dengan sen, dan DECIMAL(12,2) memang menyimpan dua angka di belakang
 * koma yang tidak perlu ditampilkan.
 *
 * Nilai `null`/`undefined` menjadi `-`. Nilai yang bukan angka berhingga
 * juga `-`, bukan "RpNaN": data rusak tidak boleh berubah menjadi teks
 * yang terlihat seperti harga.
 *
 * Spasi setelah `Rp` dibuang. `Intl` mengeluarkan U+00A0 (non-breaking
 * space) di sana; bentuk yang lazim ditulis di Indonesia adalah
 * `Rp85.000`, tanpa spasi, dan spasi tak-terlihat itu juga membuat setiap
 * perbandingan string di tes gagal tanpa sebab yang terlihat.
 */
export function formatRupiah(nilai: number | string | null | undefined): string {
  if (nilai === null || nilai === undefined) return HARGA_KOSONG;

  const angka = typeof nilai === "number" ? nilai : Number(nilai);
  if (!Number.isFinite(angka)) return HARGA_KOSONG;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(angka)
    .replace(/^Rp\s+/, "Rp");
}

export type HasilHarga =
  | { ok: true; value: number | null }
  | { ok: false; error: string };

/**
 * Membaca isian harga dari formulir admin.
 *
 * Menerima yang wajar diketik orang: `85000`, `85.000`, `Rp85.000`,
 * `Rp 85.000`, dan string kosong (berarti belum ditetapkan → NULL).
 *
 * `undefined` juga berarti belum ditetapkan. Formulir selalu mengirim
 * string — `bacaTeks` mengubah field yang tidak ada menjadi `""` — tetapi
 * pemanggil lain (skrip, tes, pemanggilan langsung repository) yang tidak
 * mengenal kolom ini tidak boleh gagal hanya karena tidak mengirimkannya.
 *
 * `null` dan angka diterima karena fungsi ini **idempoten**: validator
 * berjalan dua kali pada jalur simpan (lihat `validateBookText` lalu
 * `validateBookInput`), dan pada putaran kedua nilainya sudah dinormalisasi.
 *
 * Ditolak: nilai negatif, huruf selain `Rp` di depan, koma desimal
 * (rupiah tidak ditulis dengan sen), dan angka yang melebihi batas
 * `DECIMAL(12,2)` — menolaknya di sini memberi pesan yang bisa dibaca,
 * bukan galat MySQL sesudahnya.
 *
 * Titik dibuang sebagai pemisah ribuan. Konsekuensinya `85.000` dan
 * `85000` sama-sama berarti delapan puluh lima ribu, yang memang
 * maksud penulisnya dalam format Indonesia.
 */
export function parseHarga(nilai: unknown): HasilHarga {
  // `undefined` dan `null` sama-sama berarti belum ditetapkan. `null` bukan
  // kemungkinan di formulir (FormData selalu memberi string), tetapi
  // validator dipanggil **dua kali** untuk jalur simpan: `validateBookText`
  // membaca string mentah, lalu repository memvalidasi ulang nilai yang
  // sudah dinormalisasi — di sana harga kosong sudah menjadi `null`. Tanpa
  // cabang ini validasi kedua menolak hasil validasi pertama.
  if (nilai === undefined || nilai === null) return { ok: true, value: null };

  // Nilai angka hanya datang dari validasi ulang seperti di atas, bukan dari
  // formulir. Menerimanya membuat `parseHarga` idempoten: hasilnya selalu
  // bisa dimasukkan kembali ke dirinya sendiri.
  if (typeof nilai === "number") {
    if (!Number.isFinite(nilai) || nilai < 0) {
      return { ok: false, error: "Harga tidak dikenali." };
    }
    if (nilai > 9_999_999_999) return { ok: false, error: "Harga terlalu besar." };
    return { ok: true, value: nilai };
  }

  if (typeof nilai !== "string") {
    return { ok: false, error: "Harga tidak dikenali." };
  }

  const mentah = nilai.trim();
  if (mentah === "") return { ok: true, value: null };

  const tanpaRp = mentah.replace(/^Rp\.?\s*/i, "");
  if (!/^\d[\d.\s]*$/.test(tanpaRp)) {
    return {
      ok: false,
      error: "Harga hanya boleh berisi angka, tanpa koma atau tanda minus.",
    };
  }

  const angka = Number(tanpaRp.replace(/[.\s]/g, ""));
  if (!Number.isFinite(angka)) {
    return { ok: false, error: "Harga tidak dikenali." };
  }

  // Batas kolom DECIMAL(12,2): sepuluh digit di depan koma.
  if (angka > 9_999_999_999) {
    return { ok: false, error: "Harga terlalu besar." };
  }

  return { ok: true, value: angka };
}

/**
 * Angka tersimpan menjadi isian formulir: `85000` → `"85000"`.
 *
 * Tanpa pemisah ribuan: kolomnya sudah menerima `85.000`, dan menampilkan
 * titik di dalam kolom hanya menambah peluang salah ketik.
 *
 * Menerima string juga karena driver MySQL mengembalikan `DECIMAL` sebagai
 * string (`"85000.00"`). Pecahan `.00` dibuang supaya admin melihat angka
 * yang sama dengan yang ia ketik; pecahan yang benar-benar bernilai
 * (mis. `.50`) tetap dipertahankan.
 *
 * NULL menjadi string kosong — bukan `-`, karena `-` akan terkirim balik
 * ke server sebagai isi harga.
 */
export function nilaiFormHarga(nilai: number | string | null | undefined): string {
  if (nilai === null || nilai === undefined) return "";

  const angka = typeof nilai === "number" ? nilai : Number(nilai);
  if (!Number.isFinite(angka)) return "";

  // `String()` pada `Number` sudah membuang `.00`, jadi "85000.00" dan
  // 85000 sama-sama menjadi "85000".
  return String(angka);
}
