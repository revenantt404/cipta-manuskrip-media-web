/**
 * Daftar alamat yang perlu diinvalidasi berkat perubahan satu buku.
 *
 * Fungsi ini murni: tidak menyentuh `next/cache`, database, atau disk —
 * ia hanya menjawab "alamat mana yang berbeda isinya karena buku
 * berjudul/slug ini?" Daftarnya dipakai `actions.ts` untuk memanggil
 * `revalidatePath` satu per satu.
 *
 * Alasan dipisahkan dari `actions.ts`: berkas `"use server"` hanya boleh
 * mengekspor fungsi async, jadi daftar yang bisa diimpor dan diuji tidak
 * tinggal di sana. Dengan daftar di satu tempat, semua mutasi
 * (simpan, ubah, hapus) selalu menginvalidasi halaman yang sama —
 * kesalahan "ada halaman yang lupa diinvalidasi" tidak pernah terjadi
 * karena daftarnya tidak ditulis ulang di tiga tempat.
 *
 * `sitemap.xml` sengaja TIDAK ada di daftar: `app/sitemap.ts` memakai
 * `force-dynamic`, jadi ia dibentuk ulang setiap permintaan dan tidak
 * pernah menyajikan hasil beku. Menambah `revalidatePath("/sitemap.xml")`
 * hanya menambah baris yang tidak berbuat apa-apa.
 */

/** Bentuk satu entri, persis argumen `revalidatePath(path, type?)`. */
export type Revalidasi = {
  path: string;
  type?: "page" | "layout";
};

/**
 * Seluruh alamat yang bergantung pada satu buku, terurut konsisten.
 *
 * Alamat dinamis (`/buku/${slug}`, `/katalog/[status]`, `/publish-buku`)
 * memakai `"page"`: tanpa itu `revalidatePath` menganggapnya path halaman
 * statis dan tidak melakukan apa-apa. `/admin/buku` tidak memakai tipe —
 * persis perilaku fungsi aslinya sebelum daftar ini ada.
 */
export function daftarRevalidasi(slug: string): Revalidasi[] {
  return [
    { path: "/admin/buku" },
    { path: "/katalog/[status]", type: "page" },
    { path: "/publish-buku", type: "page" },
    { path: "/", type: "page" },
    { path: `/buku/${slug}`, type: "page" },
  ];
}
