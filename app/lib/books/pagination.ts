/**
 * Menormalkan nomor halaman yang datang dari alamat URL.
 *
 * Nilai dari URL selalu berupa teks dan bisa apa saja — `?page=99`,
 * `?page=abc`, `?page=`, atau parameter yang tidak ada sama sekali.
 * Fungsinya mengembalikan halaman yang benar-benar ada, sehingga
 * `?page=99` pada katalog berisi satu halaman menampilkan halaman 1
 * dan bukan halaman kosong.
 *
 * Tidak pernah melempar galat dan tidak pernah mengembalikan nilai di
 * luar `1..max(1, totalPages)`.
 */
export function normalizePage(raw: unknown, totalPages: number): number {
  const batasAtas = Math.max(1, Math.trunc(totalPages));

  const angka =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
        ? Number(raw)
        : Number.NaN;

  // Number("1.5") menghasilkan 1.5 — bukan integer, jadi ditolak,
  // bukan dibulatkan. Halaman adalah hitungan utuh.
  if (!Number.isInteger(angka) || angka < 1) {
    return 1;
  }

  return Math.min(angka, batasAtas);
}
