/**
 * Penentuan tautan navigasi admin yang sedang aktif.
 *
 * Dipisah dari komponennya supaya bisa diuji tanpa merender React: masalah
 * aslinya murni logika pencocokan alamat, bukan tampilan.
 *
 * Aturan: satu halaman hanya boleh punya **satu** tautan aktif, dan yang
 * menang adalah alamat yang paling spesifik. Contoh nyata yang pernah salah:
 * `/admin/buku/tambah` cocok dengan `/admin/buku` (awalan) sekaligus dengan
 * `/admin/buku/tambah` (persis), sehingga "Kelola Buku" dan "Tambah Buku"
 * sama-sama menyala. Dengan aturan "paling panjang menang", hanya
 * "Tambah Buku" yang menyala, sementara `/admin/buku/12/edit` tetap
 * menyalakan "Kelola Buku".
 */

/** Cocok persis, atau cocok sebagai awalan pada batas segmen (`/buku/12`). */
function cocok(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function tautanAktif(
  pathname: string,
  hrefs: readonly string[]
): string | undefined {
  return hrefs
    .filter((href) => cocok(pathname, href))
    .sort((a, b) => b.length - a.length)[0];
}
