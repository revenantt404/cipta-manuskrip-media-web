import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { hash } from "@node-rs/argon2";
import sharp from "sharp";
import { execute, query, closePool } from "@/lib/db/query";
import { attemptLogin, BATAS_PERCOBAAN } from "@/lib/auth/login";
import { createSession, verifySessionToken, deleteSession } from "@/lib/auth/session";
import { listBooks, getBookBySlug } from "@/lib/books/repository";
import { simpanBukuBaru, perbaruiBuku, hapusBuku } from "@/lib/books/manage";
import { createBookAction } from "@/app/admin/(terlindungi)/buku/actions";
import { updateBookAction, deleteBookAction } from "@/app/admin/(terlindungi)/buku/actions";
import { STATE_BUKU_AWAL, STATE_HAPUS_AWAL } from "@/app/admin/(terlindungi)/buku/form-state";
import { BookDetail } from "@/components/BookDetail";

/**
 * Acceptance test Fase 2 — brief §13.
 *
 * Yang diuji di sini adalah **alur nyata**: database sungguhan, berkas
 * sungguhan, dan komponen halaman dirender dari data yang baru saja ditulis.
 * Tidak ada mock, fixture, atau data contoh yang disajikan sebagai hasil
 * kerja.
 *
 * Batas yang jujur, sama seperti yang dicatat di Task 5–7:
 *
 * - Peralihan HTTP (307 ke halaman login, `Set-Cookie`, sesi bertahan setelah
 *   refresh) tidak dapat dijalankan dari Vitest karena `cookies()` dan
 *   `redirect()` hidup di dalam permintaan. Bagian itu diverifikasi dengan
 *   `curl` terhadap `next start` produksi dan hasilnya dicatat di
 *   `docs/PROGRESS.md`.
 * - Yang diuji di sini adalah lapisan di bawahnya: token palsu/kedaluwarsa
 *   ditolak, sesi yang dibuat login sah dan dapat dicabut, dan setiap aksi
 *   mutasi berhenti sebelum menyentuh database bila tidak ada sesi.
 */

const DIR_UJI = path.join(process.cwd(), "storage", "covers-uji-acceptance");

const EMAIL = "acceptance@uji.local";
const SANDI = "sandi-acceptance-panjang";

const TEKS_TERBIT = {
  title: "Buku Acceptance",
  author: "Penulis Acceptance",
  synopsis: "Sinopsis buku acceptance yang telah terbit.",
  publisherInfo: "CV Cipta Manuskrip Media",
  bookInfo: "",
  status: "published",
  estimatedRelease: "",
};

const TEKS_SEGERA = {
  title: "Buku Segera Acceptance",
  author: "Penulis Acceptance",
  synopsis: "",
  publisherInfo: "CV Cipta Manuskrip Media",
  bookInfo: "Sedang dalam proses penyuntingan.",
  status: "upcoming",
  estimatedRelease: "Maret 2027",
};

async function gambar(warna: { r: number; g: number; b: number }): Promise<Buffer> {
  return sharp({
    create: { width: 240, height: 360, channels: 3, background: warna },
  })
    .jpeg()
    .toBuffer();
}

function formBuku(teks: Record<string, string>, sampul?: Buffer, slug?: string): FormData {
  const data = new FormData();
  for (const [kunci, nilai] of Object.entries(teks)) data.set(kunci, nilai);
  if (slug !== undefined) data.set("slug", slug);

  if (sampul === undefined) {
    data.set("cover", new File([], "", { type: "application/octet-stream" }));
  } else {
    data.set("cover", new File([new Uint8Array(sampul).buffer], "s.jpg", { type: "image/jpeg" }));
  }
  return data;
}

async function bersihkan() {
  await execute("DELETE FROM sessions");
  await execute("DELETE FROM admin_users");
  await execute("DELETE FROM books");
  // `maxRetries` bukan hiasan: di Windows, antivirus atau pengindeks berkas
  // sesekali masih memegang direktori sesaat setelah tes lain selesai, dan
  // `rmSync` gagal EPERM. Tanpa retry, kegagalan itu muncul sebagai tes yang
  // lulus sendiri saat dijalankan ulang — persis jenis kegagalan yang paling
  // membuang waktu untuk ditelusuri.
  rmSync(DIR_UJI, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
  mkdirSync(DIR_UJI, { recursive: true });
}

async function berkasTersimpan(): Promise<string[]> {
  return existsSync(DIR_UJI) ? readdirSync(DIR_UJI) : [];
}

function berkasAda(coverPath: string): boolean {
  return existsSync(path.join(DIR_UJI, path.basename(coverPath)));
}

async function buatAdmin(): Promise<string> {
  const passwordHash = await hash(SANDI);
  await execute("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)", [
    EMAIL,
    passwordHash,
  ]);
  const baris = await query<{ id: string }>("SELECT id FROM admin_users WHERE email = ?", [EMAIL]);
  return baris[0].id;
}

beforeEach(async () => {
  process.env.COVER_DIR = "storage/covers-uji-acceptance";
  await bersihkan();
});

afterAll(async () => {
  await bersihkan();
  rmSync(DIR_UJI, { recursive: true, force: true });
  delete process.env.COVER_DIR;
  await closePool();
});

/* ------------------------------------------------------------------ */
/* §13.2 — Anon tidak dapat membuka data admin atau melakukan mutasi    */
/* ------------------------------------------------------------------ */

describe("§13.2 anon tidak dapat melakukan mutasi", () => {
  it("setiap action mutasi berhenti sebelum menulis apa pun", async () => {
    const sebelum = await query<{ jumlah: number }>("SELECT COUNT(*) AS jumlah FROM books");

    // `requireAdmin` melempar di luar permintaan HTTP karena `cookies()`
    // tidak punya konteks request. Yang dibuktikan: panggilan berhenti di
    // situ, bukan melanjutkan ke penulisan.
    await expect(
      createBookAction(STATE_BUKU_AWAL, formBuku(TEKS_TERBIT, await gambar({ r: 1, g: 1, b: 1 })))
    ).rejects.toThrow();

    await expect(
      updateBookAction(
        "00000000-0000-0000-0000-000000000000",
        STATE_BUKU_AWAL,
        formBuku(TEKS_TERBIT, undefined, "apa-saja")
      )
    ).rejects.toThrow();

    await expect(
      deleteBookAction("00000000-0000-0000-0000-000000000000", STATE_HAPUS_AWAL, new FormData())
    ).rejects.toThrow();

    const sesudah = await query<{ jumlah: number }>("SELECT COUNT(*) AS jumlah FROM books");
    expect(Number(sesudah[0].jumlah)).toBe(Number(sebelum[0].jumlah));
    expect(await berkasTersimpan()).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* §13.3 / §13.4 — sesi palsu ditolak, sesi nyata bertahan dan dicabut  */
/* ------------------------------------------------------------------ */

describe("§13.4 sesi nyata", () => {
  it("menolak token yang tidak pernah diterbitkan", async () => {
    await buatAdmin();

    expect(await verifySessionToken("token-karangan")).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
    // 64 karakter heksadesimal tapi tidak ada di database — bentuk yang
    // benar bukan bukti keabsahan.
    expect(await verifySessionToken("a".repeat(64))).toBeNull();
  });

  it("menolak sesi yang sudah kedaluwarsa dan membersihkan barisnya", async () => {
    const adminId = await buatAdmin();
    const token = await createSession(adminId);

    // Memundurkan masa berlaku, bukan menunggu 7 hari.
    await execute("UPDATE sessions SET expires_at = DATE_SUB(NOW(), INTERVAL 1 MINUTE)");

    expect(await verifySessionToken(token)).toBeNull();
    const sisa = await query<{ jumlah: number }>("SELECT COUNT(*) AS jumlah FROM sessions");
    expect(Number(sisa[0].jumlah)).toBe(0);
  });

  it("sesi yang dibuat login tetap sah saat diperiksa ulang, lalu mati setelah logout", async () => {
    await buatAdmin();

    // Login sungguhan lewat jalur yang dipakai `loginAction`.
    const masuk = await attemptLogin(EMAIL, SANDI);
    expect(masuk.ok).toBe(true);
    if (!masuk.ok) return;

    const token = await createSession(masuk.admin.id);

    // "Refresh halaman" = verifikasi ulang token yang sama dari cookie.
    const pertama = await verifySessionToken(token);
    const kedua = await verifySessionToken(token);
    expect(pertama?.email).toBe(EMAIL);
    expect(kedua?.email).toBe(EMAIL);

    await deleteSession(token);
    expect(await verifySessionToken(token)).toBeNull();
  });

  it(`mengunci akun setelah ${BATAS_PERCOBAAN} percobaan salah, termasuk untuk sandi benar`, async () => {
    await buatAdmin();

    for (let i = 0; i < BATAS_PERCOBAAN; i += 1) {
      const gagal = await attemptLogin(EMAIL, `salah-${i}`);
      expect(gagal.ok).toBe(false);
    }

    const terkunci = await attemptLogin(EMAIL, SANDI);
    expect(terkunci.ok).toBe(false);
    if (!terkunci.ok) expect(terkunci.error).toMatch(/terkunci/i);
  });
});

/* ------------------------------------------------------------------ */
/* §13.5 / §13.6 — tambah published dan upcoming                        */
/* ------------------------------------------------------------------ */

describe("§13.5 tambah buku published dengan sampul nyata", () => {
  it("muncul di daftar publik, katalog published, dan detail", async () => {
    const simpan = await simpanBukuBaru(
      formBuku(TEKS_TERBIT, await gambar({ r: 30, g: 90, b: 150 }))
    );
    expect(simpan.ok).toBe(true);
    if (!simpan.ok) return;

    expect(berkasAda(simpan.book.coverPath)).toBe(true);

    const katalog = await listBooks({ status: "published" });
    expect(katalog.items.map((b) => b.slug)).toContain(simpan.book.slug);

    const segera = await listBooks({ status: "upcoming" });
    expect(segera.items.map((b) => b.slug)).not.toContain(simpan.book.slug);

    const detail = await getBookBySlug(simpan.book.slug);
    expect(detail).not.toBeNull();
    if (detail === null) return;

    // Yang dilihat pengunjung, bukan hanya yang tersimpan.
    const html = renderToStaticMarkup(<BookDetail book={detail} />);
    expect(html).toContain(TEKS_TERBIT.title);
    expect(html).toContain(TEKS_TERBIT.author);
    expect(html).toContain(TEKS_TERBIT.synopsis);

    // Reload tetap ada: pembacaan ulang tidak bergantung pada keadaan proses.
    expect(await getBookBySlug(simpan.book.slug)).not.toBeNull();
  });
});

describe("§13.6 buku upcoming", () => {
  it("mewajibkan estimasi terbit", async () => {
    const tanpaEstimasi = await simpanBukuBaru(
      formBuku({ ...TEKS_SEGERA, estimatedRelease: "" }, await gambar({ r: 1, g: 2, b: 3 }))
    );

    expect(tanpaEstimasi.ok).toBe(false);
    if (!tanpaEstimasi.ok) expect(tanpaEstimasi.errors.estimatedRelease).toBeDefined();
    expect(await berkasTersimpan()).toHaveLength(0);
  });

  it("muncul hanya di katalog upcoming dan detailnya tidak menawarkan pesanan", async () => {
    const simpan = await simpanBukuBaru(
      formBuku(TEKS_SEGERA, await gambar({ r: 200, g: 120, b: 10 }))
    );
    expect(simpan.ok).toBe(true);
    if (!simpan.ok) return;

    const segera = await listBooks({ status: "upcoming" });
    expect(segera.items.map((b) => b.slug)).toContain(simpan.book.slug);
    expect((await listBooks({ status: "published" })).items).toHaveLength(0);

    const detail = await getBookBySlug(simpan.book.slug);
    if (detail === null) throw new Error("detail tidak ditemukan");

    const html = renderToStaticMarkup(<BookDetail book={detail} />);
    expect(html).toContain("Maret 2027");
    expect(html).not.toContain("wa.me");
  });
});

/* ------------------------------------------------------------------ */
/* §13.7 / §13.8 — sunting, ganti slug, ganti sampul                     */
/* ------------------------------------------------------------------ */

describe("§13.7 sunting buku dan slug", () => {
  it("perubahan terlihat di detail, dan slug lama tidak menyajikan buku itu lagi", async () => {
    const simpan = await simpanBukuBaru(
      formBuku(TEKS_TERBIT, await gambar({ r: 10, g: 20, b: 30 }))
    );
    if (!simpan.ok) throw new Error("gagal menyiapkan buku");
    const slugLama = simpan.book.slug;

    const ubah = await perbaruiBuku(
      simpan.book.id,
      formBuku(
        {
          ...TEKS_TERBIT,
          title: "Judul Setelah Disunting",
          author: "Penulis Setelah Disunting",
          synopsis: "Sinopsis setelah disunting.",
        },
        undefined,
        "alamat-baru"
      )
    );

    expect(ubah.ok).toBe(true);
    if (!ubah.ok) return;
    expect(ubah.slugLama).toBe(slugLama);
    expect(ubah.book.slug).toBe("alamat-baru");

    const detail = await getBookBySlug("alamat-baru");
    expect(detail?.title).toBe("Judul Setelah Disunting");
    expect(detail?.author).toBe("Penulis Setelah Disunting");

    // Alamat lama tidak lagi menyajikan buku ini dalam bentuk apa pun.
    expect(await getBookBySlug(slugLama)).toBeNull();
    expect(detail?.title).not.toBe(TEKS_TERBIT.title);
  });
});

describe("§13.8 ganti sampul", () => {
  it("gambar baru tampil dan berkas lama dibersihkan setelah update berhasil", async () => {
    const simpan = await simpanBukuBaru(
      formBuku(TEKS_TERBIT, await gambar({ r: 255, g: 0, b: 0 }))
    );
    if (!simpan.ok) throw new Error("gagal menyiapkan buku");
    const sampulLama = simpan.book.coverPath;

    const ubah = await perbaruiBuku(
      simpan.book.id,
      formBuku(TEKS_TERBIT, await gambar({ r: 0, g: 255, b: 0 }), simpan.book.slug)
    );

    expect(ubah.ok).toBe(true);
    if (!ubah.ok) return;

    expect(ubah.book.coverPath).not.toBe(sampulLama);
    expect(berkasAda(ubah.book.coverPath)).toBe(true);
    expect(berkasAda(sampulLama)).toBe(false);
    expect(await berkasTersimpan()).toHaveLength(1);

    const detail = await getBookBySlug(simpan.book.slug);
    const html = renderToStaticMarkup(<BookDetail book={detail!} />);
    expect(html).toContain(ubah.book.coverPath);
    expect(html).not.toContain(sampulLama);
  });
});

/* ------------------------------------------------------------------ */
/* §13.9 — hapus buku                                                   */
/* ------------------------------------------------------------------ */

describe("§13.9 hapus buku", () => {
  it("hilang dari katalog dan detail, berkas sampul dibersihkan", async () => {
    const simpan = await simpanBukuBaru(
      formBuku(TEKS_TERBIT, await gambar({ r: 50, g: 50, b: 50 }))
    );
    if (!simpan.ok) throw new Error("gagal menyiapkan buku");

    const hapus = await hapusBuku(simpan.book.id);
    expect(hapus.ok).toBe(true);

    expect(await getBookBySlug(simpan.book.slug)).toBeNull();
    expect((await listBooks({ status: "published" })).items).toHaveLength(0);
    expect(berkasAda(simpan.book.coverPath)).toBe(false);
    expect(await berkasTersimpan()).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/* §13.10 — input ditolak oleh server                                   */
/* ------------------------------------------------------------------ */

describe("§13.10 input tidak sah ditolak server", () => {
  it("menolak isian kosong, status tidak dikenal, berkas kebesaran, dan bukan gambar", async () => {
    const kosong = await simpanBukuBaru(formBuku({ ...TEKS_TERBIT, title: "", author: "" }));
    expect(kosong.ok).toBe(false);

    const statusSalah = await simpanBukuBaru(
      formBuku({ ...TEKS_TERBIT, status: "draft" }, await gambar({ r: 1, g: 1, b: 1 }))
    );
    expect(statusSalah.ok).toBe(false);

    // Berkas besar dibuat sebagai buffer mentah: isinya tidak perlu gambar
    // sah karena yang menolak adalah pemeriksaan ukuran, sebelum dekode.
    const kebesaran = Buffer.alloc(5 * 1024 * 1024 + 1);
    const terlaluBesar = await simpanBukuBaru(formBuku(TEKS_TERBIT, kebesaran));
    expect(terlaluBesar.ok).toBe(false);
    if (!terlaluBesar.ok) expect(terlaluBesar.errors.coverPath).toMatch(/melebihi batas/i);

    const bukanGambar = await simpanBukuBaru(formBuku(TEKS_TERBIT, Buffer.from("<svg/>")));
    expect(bukanGambar.ok).toBe(false);

    expect(await berkasTersimpan()).toHaveLength(0);
    expect((await listBooks({ status: "published" })).items).toHaveLength(0);
  });

  it("menolak slug duplikat dengan pesan yang bisa ditindaklanjuti", async () => {
    const pertama = await simpanBukuBaru(
      formBuku(TEKS_TERBIT, await gambar({ r: 1, g: 2, b: 3 }))
    );
    expect(pertama.ok).toBe(true);

    const kedua = await simpanBukuBaru(
      formBuku(TEKS_TERBIT, await gambar({ r: 3, g: 2, b: 1 }))
    );

    expect(kedua.ok).toBe(false);
    if (kedua.ok) return;
    expect(kedua.errors.slug).toBeDefined();
    // Sampul percobaan kedua tidak boleh tertinggal sebagai berkas yatim.
    expect(await berkasTersimpan()).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ */
/* §13.11 — kegagalan database setelah upload                           */
/* ------------------------------------------------------------------ */

describe("§13.11 kompensasi kegagalan penyimpanan", () => {
  it("tidak meninggalkan berkas baru saat insert gagal, dan update gagal menyimpan sampul lama", async () => {
    const a = await simpanBukuBaru(formBuku({ ...TEKS_TERBIT, title: "Buku A" }, await gambar({ r: 90, g: 0, b: 0 })));
    const b = await simpanBukuBaru(formBuku({ ...TEKS_TERBIT, title: "Buku B" }, await gambar({ r: 0, g: 90, b: 0 })));
    if (!a.ok || !b.ok) throw new Error("gagal menyiapkan data");

    // Insert gagal: judul A menghasilkan slug yang sudah dipakai.
    const duplikat = await simpanBukuBaru(
      formBuku({ ...TEKS_TERBIT, title: "Buku A" }, await gambar({ r: 0, g: 0, b: 255 }))
    );
    expect(duplikat.ok).toBe(false);
    expect(await berkasTersimpan()).toHaveLength(2);

    // Update gagal: slug B diarahkan ke milik A, dengan sampul baru.
    const gagalUbah = await perbaruiBuku(
      b.book.id,
      formBuku({ ...TEKS_TERBIT, title: "Buku B" }, await gambar({ r: 9, g: 9, b: 9 }), a.book.slug)
    );
    expect(gagalUbah.ok).toBe(false);
    expect(await berkasTersimpan()).toHaveLength(2);
    expect(berkasAda(b.book.coverPath)).toBe(true);
    expect(berkasAda(a.book.coverPath)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* §13.13 — tautan WhatsApp                                             */
/* ------------------------------------------------------------------ */

describe("§13.13 tautan WhatsApp", () => {
  it("URL yang dirender dapat didekode kembali menjadi pesan yang persis dimaksud", async () => {
    const simpan = await simpanBukuBaru(
      formBuku({ ...TEKS_TERBIT, title: "Kiat Menulis Cepat & Efektif" }, await gambar({ r: 4, g: 5, b: 6 }))
    );
    if (!simpan.ok) throw new Error("gagal menyiapkan buku");

    const detail = await getBookBySlug(simpan.book.slug);
    if (detail === null) throw new Error("detail tidak ditemukan");

    const html = renderToStaticMarkup(<BookDetail book={detail} />);
    const tautan = html.match(/https:\/\/wa\.me\/[^"]+/g) ?? [];
    expect(tautan).toHaveLength(2);

    const pesan = tautan.map((raw) =>
      decodeURIComponent(new URL(raw.replace(/&amp;/g, "&")).searchParams.get("text") ?? "")
    );

    expect(pesan).toContain("Mau pesan buku cetak judul Kiat Menulis Cepat & Efektif");
    expect(pesan).toContain("Mau sewa ebook judul Kiat Menulis Cepat & Efektif");
  });
});
