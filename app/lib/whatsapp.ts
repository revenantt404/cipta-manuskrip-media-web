const NOMOR_BUKU = "6289671894900";
export const NOMOR_JURNAL = "62895629203142";

export type JenisPesanan = "cetak" | "ebook";

/** Tier yang dipilih pengunjung di halaman Publish Buku. */
export type PaketTerpilih = { nama: string; harga: string };

/**
 * Nomor dan kalimat pesan dikunci brief bagian 10 — jangan "memperbaiki"
 * ejaan `ebook`, menambah salam, atau mengubah nomornya.
 *
 * Satu penyesuaian dari pemilik proyek (23 Oktober 2026): nilai yang
 * berubah-ubah (judul, topik) diapit tanda petik dua. Alasannya bukan
 * selera — judul buku kerap sudah memuat tanda petik tunggal, mis.
 * `Panduan Menulis 'Karya Ilmiah'`, sehingga tanpa pengapit batas judul
 * dan kalimat pengantarnya kabur saat dibaca admin di WhatsApp.
 */
export function buildBookOrderUrl(judul: string, jenis: JenisPesanan): string {
  const pesan =
    jenis === "cetak"
      ? `Mau pesan buku cetak judul "${judul}"`
      : `Mau sewa ebook judul "${judul}"`;

  return `https://wa.me/${NOMOR_BUKU}?text=${encodeURIComponent(pesan)}`;
}

/**
 * Kalimat pesan jurnal dikunci persis oleh brief: berbeda dengan pesan buku,
 * pesan jurnal BERAKHIR TITIK dan huruf awalnya sengaja kecil ("saya", bukan
 * "Saya") — jangan dirapikan. Topik asistensi hanya pernah masuk ke isi pesan
 * WhatsApp; ia tidak pernah dikirim ke server kita.
 */

/**
 * Pesan kirim naskah — persis: `ini naskah artikel saya, admin.`
 *
 * Sejak 24 Oktober 2026 kategori jurnal yang dipilih pengunjung ikut
 * dikirim. Permintaan pemilik proyek: tombol di kartu kategori dulu
 * mengirim kalimat yang sama untuk ketiga kategori, jadi admin tidak tahu
 * naskah itu ditujukan ke jurnal yang mana.
 *
 * Kalimat pertama dibiarkan utuh huruf demi huruf (huruf awal kecil,
 * berakhir titik) dan kategori masuk sebagai baris KEDUA — pola yang sama
 * dengan baris paket pada asistensi buku. Tanpa kategori, pesannya kembali
 * persis seperti sebelumnya.
 */
export function buildJournalSubmitUrl(kategori?: string | null): string {
  const tujuan = kategori?.trim() ?? "";
  const pesan =
    tujuan === ""
      ? "ini naskah artikel saya, admin."
      : `ini naskah artikel saya, admin.\nKategori jurnal: "${tujuan}"`;

  return `https://wa.me/${NOMOR_JURNAL}?text=${encodeURIComponent(pesan)}`;
}

/** Pesan asistensi artikel dengan topik — persis: `saya mau dibantu asistensi artikel topik "<topik>".` */
export function buildJournalAssistUrl(topik: string): string {
  return `https://wa.me/${NOMOR_JURNAL}?text=${encodeURIComponent(
    `saya mau dibantu asistensi artikel topik "${topik}".`
  )}`;
}

/**
 * Satu baris keterangan paket, mis. `Paket Profesional - Rp4.500.000`.
 *
 * Nama dan harga dipangkas terpisah; kalau salah satunya kosong, yang ada
 * saja yang dipakai, dan kalau keduanya kosong hasilnya `null` sehingga
 * baris paket tidak ikut dikirim sama sekali.
 */
function labelPaket(paket: PaketTerpilih | null | undefined): string | null {
  const nama = paket?.nama.trim() ?? "";
  const harga = paket?.harga.trim() ?? "";
  if (nama === "" && harga === "") return null;
  return [nama, harga].filter((bagian) => bagian !== "").join(" - ");
}

/**
 * Pesan asistensi **buku** dengan topik, dan — bila pengunjung memilih tier
 * di halaman Publish Buku — nama paket beserta harganya.
 *
 * Kalimat ini tidak berasal dari brief §10 — brief hanya mengunci pesan
 * pemesanan buku dan asistensi artikel. Bentuknya dipilih pemilik proyek
 * (20 Oktober 2026) dan sengaja berbeda dari versi artikel pada dua hal:
 * huruf awal `S` besar, dan kata `buku` menggantikan `artikel`. Jangan
 * "menyeragamkan" keduanya — perbedaan itu keputusan, bukan kelalaian.
 *
 * Sejak 23 Oktober 2026 topik diapit tanda petik dua, sama seperti judul
 * pada pesan pemesanan buku.
 *
 * Sejak 24 Oktober 2026 pilihan paket ikut dikirim (permintaan pemilik
 * proyek: "pas pemilihan paket, bisa gak sambil ikut ke pesan whatsapp").
 * Baris paket ditaruh di baris KEDUA dengan pemisah baris baru, bukan
 * disambung ke kalimat pertama: kalimat pertama tetap sama persis dengan
 * yang dikunci brief, dan admin bisa membaca paketnya tanpa menyortir
 * kalimat panjang. Tanpa pilihan paket, pesannya utuh seperti sebelumnya.
 */
export function buildBookAssistUrl(
  topik: string,
  paket?: PaketTerpilih | null
): string {
  const paketLabel = labelPaket(paket);
  const pesan =
    paketLabel === null
      ? `Saya mau dibantu asistensi buku topik "${topik}".`
      : `Saya mau dibantu asistensi buku topik "${topik}".\nPaket pilihan: "${paketLabel}"`;

  return `https://wa.me/${NOMOR_BUKU}?text=${encodeURIComponent(pesan)}`;
}

export type HasilPesanAsistensi = { ok: true; url: string } | { ok: false; error: string };

/**
 * Memangkas spasi tepi topik mentah lebih dulu; menolak bila kosong murni.
 * Trimming tidak ditaruh di pembentuk URL supaya formatter itu murni, dan
 * aturan ini hanya ditulis sekali untuk kedua jenis asistensi.
 */
function pesanAsistensiDari(
  topikMentah: string,
  bangunUrl: (topik: string) => string
): HasilPesanAsistensi {
  const topik = topikMentah.trim();
  if (topik === "") {
    return { ok: false, error: "Topik asistensi belum diisi." };
  }
  return { ok: true, url: bangunUrl(topik) };
}

/** Asistensi artikel jurnal. */
export function pesanAsistensiJurnal(topikMentah: string): HasilPesanAsistensi {
  return pesanAsistensiDari(topikMentah, buildJournalAssistUrl);
}

/**
 * Asistensi penulisan buku. `paket` opsional: hanya terisi kalau pengunjung
 * menekan "Pilih Paket" di halaman yang sama. Aturan topik (pangkas, tolak
 * kosong) tetap satu pintu lewat `pesanAsistensiDari`.
 */
export function pesanAsistensiBuku(
  topikMentah: string,
  paket?: PaketTerpilih | null
): HasilPesanAsistensi {
  return pesanAsistensiDari(topikMentah, (topik) =>
    buildBookAssistUrl(topik, paket)
  );
}
