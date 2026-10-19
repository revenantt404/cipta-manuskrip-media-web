import { randomUUID } from "node:crypto";
import { mkdir, writeFile, rm, access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { coverMaxBytes, dirSampul, COVER_DIR } from "./path";

/**
 * Batas jumlah piksel, terpisah dari batas ukuran berkas.
 *
 * Berkas JPEG padat warna berukuran 10000×6000 hanya beberapa ratus KB —
 * lolos batas 5 MB — tetapi setelah didekode menjadi 720 MB di memori.
 * Batas ukuran berkas tidak menangkapnya; batas piksel yang menangkap.
 */
export const BATAS_PIKSEL = 50_000_000;

const SISI_MAKS = 1600;

/** Format keluaran. WebP dipilih karena mengecilkan berkas tanpa terlihat pecah. */
const EKSTENSI_KELUARAN = "webp";

/**
 * Format yang benar-benar dilaporkan decoder, bukan yang diklaim MIME.
 *
 * Daftar ini sengaja "izinkan", bukan "larang": SVG, TIFF, GIF, dan HEIC
 * semuanya didekode `sharp`, dan daftar larangan akan selalu ketinggalan
 * satu format setiap kali librvips menambah dukungan baru.
 */
const FORMAT_DIIZINKAN = new Set(["jpeg", "png", "webp"]);

const MIME_DIIZINKAN = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export type HasilSimpanSampul =
  | { ok: true; coverPath: string }
  | { ok: false; error: string };

/**
 * Nama subfolder yang dipakai di `cover_path`.
 *
 * Yang disimpan ke database adalah path relatif (`covers/<uuid>.webp`),
 * bukan URL dan bukan path absolut: pindah domain tidak memerlukan
 * perubahan data, dan folder penyimpanan boleh berbeda antar lingkungan.
 *
 * Nilainya sengaja TIDAK diturunkan dari `dirSampul()`: lokasi fisik folder
 * berbeda antar lingkungan (di hosting `COVER_DIR` menunjuk ke luar folder
 * aplikasi), sementara nama logis di database harus sama di mana pun. URL
 * publik dibentuk `resolveCoverUrl` dari nama berkasnya saja, jadi
 * perbedaan lokasi tidak pernah terlihat pengunjung.
 */
function subfolderSampul(): string {
  return COVER_DIR;
}

function menolak(error: string): HasilSimpanSampul {
  return { ok: false, error };
}

/**
 * Memvalidasi, memproses, dan menyimpan berkas sampul.
 *
 * Urutannya disengaja: ukuran berkas diperiksa lebih dahulu (paling murah),
 * lalu MIME, lalu gambar benar-benar didekode. Berkas yang isinya bukan
 * gambar ditolak meski namanya berakhiran `.jpg` — memercayai MIME dari
 * browser saja tidak cukup.
 */
export async function processAndSaveCover(
  fileBuffer: Buffer,
  mimeType: string
): Promise<HasilSimpanSampul> {
  const batas = coverMaxBytes();
  if (fileBuffer.length === 0) {
    return menolak("Berkas sampul kosong.");
  }
  if (fileBuffer.length > batas) {
    return menolak(`Ukuran sampul melebihi batas ${Math.round(batas / 1024 / 1024)} MB.`);
  }

  const mime = mimeType.trim().toLowerCase();
  if (!MIME_DIIZINKAN.has(mime)) {
    return menolak("Format sampul harus JPEG, PNG, atau WebP.");
  }

  const dir = dirSampul();
  const namaBerkas = `${randomUUID()}.${EKSTENSI_KELUARAN}`;
  const tujuan = path.join(dir, namaBerkas);

  // Dimensi dibaca tanpa `limitInputPixels`: pada batas itu `sharp`
  // melempar "Input image exceeds pixel limit" dari `metadata()` sendiri,
  // sehingga pemeriksaan di bawah tidak akan pernah tercapai dan pesannya
  // tidak bisa menyebut penyebab. `metadata()` hanya membaca header —
  // tidak ada piksel yang didekode — jadi aman dipanggil lebih dulu.
  let info;
  try {
    info = await sharp(fileBuffer).metadata();
  } catch {
    return menolak("Berkas sampul tidak dapat dibaca sebagai gambar.");
  }

  if (info.width === undefined || info.height === undefined || info.format === undefined) {
    return menolak("Berkas sampul tidak dapat dibaca sebagai gambar.");
  }

  // Format diperiksa dari yang dilaporkan decoder, bukan dari MIME yang
  // dikirim browser. Dua berkas berbeda membuat MIME tidak dapat dipercaya:
  // SVG yang diklaim `image/png` tetap didekode `sharp` lewat librsvg, dan
  // SVG boleh memuat skrip — brief bagian 6 melarangnya.
  if (!FORMAT_DIIZINKAN.has(info.format)) {
    return menolak("Format sampul harus JPEG, PNG, atau WebP.");
  }

  // Batas piksel diperiksa dari metadata supaya pesannya menyebut penyebab
  // yang sebenarnya; tanpa ini gambar padat warna 60 juta piksel ditolak
  // dengan pesan "tidak dapat dibaca" yang menyesatkan.
  if (info.width * info.height > BATAS_PIKSEL) {
    return menolak(
      `Sampul terlalu besar: ${info.width}×${info.height} piksel melebihi batas ${BATAS_PIKSEL.toLocaleString("id-ID")} piksel.`
    );
  }

  let keluaran: Buffer;
  try {
    keluaran = await sharp(fileBuffer, { limitInputPixels: BATAS_PIKSEL })
      .rotate()
      .resize({
        width: SISI_MAKS,
        height: SISI_MAKS,
        fit: "inside",
        // Tanpa ini, sampul mungil ikut diperbesar dan tampak pecah.
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return menolak("Berkas sampul tidak dapat diproses. Coba berkas lain.");
  }

  try {
    // Folder boleh belum ada di lingkungan baru; tanpa ini unggahan
    // pertama gagal dengan ENOENT.
    await mkdir(dir, { recursive: true });
    await writeFile(tujuan, keluaran);
  } catch {
    return menolak("Sampul gagal disimpan. Coba lagi beberapa saat lagi.");
  }

  return { ok: true, coverPath: `${subfolderSampul()}/${namaBerkas}` };
}

/**
 * Menghapus berkas sampul.
 *
 * Mengembalikan `false` bila berkas tidak ada atau path ditolak, tanpa
 * melempar: pemanggilnya adalah jalur kompensasi setelah kegagalan lain,
 * dan kegagalan pembersihan tidak boleh menutupi kegagalan aslinya.
 *
 * Path di luar folder sampul selalu ditolak — `cover_path` bisa saja
 * berasal dari data lama atau dari input yang mencoba keluar folder.
 */
export async function deleteCoverFile(coverPath: string): Promise<boolean> {
  const dicari = coverPath.trim();
  if (dicari === "") return false;

  const dir = dirSampul();
  const tujuan = path.resolve(dir, path.basename(dicari));

  // `path.basename` sudah membuang komponen folder, dan pemeriksaan ini
  // menutup sisa kemungkinan path keluar dari folder sampul.
  const relatif = path.relative(dir, tujuan);
  if (relatif === "" || relatif.startsWith("..") || path.isAbsolute(relatif)) {
    return false;
  }

  try {
    await access(tujuan);
  } catch {
    return false;
  }

  try {
    await rm(tujuan, { force: true });
    return true;
  } catch {
    return false;
  }
}
