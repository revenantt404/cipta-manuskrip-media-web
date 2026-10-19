/**
 * Mengubah judul menjadi slug untuk alamat halaman.
 *
 * Urutannya penting: diakritik dibuang **sebelum** huruf kecil, karena
 * `normalize("NFD")` memisahkan tanda diakritik dari huruf induknya.
 * Tanda hubung yang sudah ada diperlakukan sebagai pemisah, sehingga
 * "Buku - Hebat" dan "Buku -- Hebat" menghasilkan slug yang sama.
 *
 * Hasilnya hanya berisi `a-z`, angka, dan tanda hubung tunggal, tanpa
 * tanda hubung di awal atau akhir. Judul yang tidak menyisakan huruf
 * maupun angka menghasilkan string kosong — pemanggil yang memutuskan
 * apa artinya itu.
 */
export function slugify(judul: string): string {
  return judul
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}
