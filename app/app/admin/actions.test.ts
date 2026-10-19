import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { hash } from "@node-rs/argon2";
import { execute, query, closePool } from "@/lib/db/query";
import { loginAction } from "./actions";
import { createSession, verifySessionToken, deleteSession } from "@/lib/auth/session";

const EMAIL = "admin@uji.local";
const SANDI = "sandi-yang-cukup-panjang";

async function bersihkan() {
  await execute("DELETE FROM sessions");
  await execute("DELETE FROM admin_users");
}

async function buatAdmin() {
  const passwordHash = await hash(SANDI);
  await execute("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)", [
    EMAIL,
    passwordHash,
  ]);
}

function formData(isi: Record<string, string>): FormData {
  const data = new FormData();
  for (const [kunci, nilai] of Object.entries(isi)) data.set(kunci, nilai);
  return data;
}

const AWAL = { error: null, email: "", percobaan: 0 };

describe("loginAction", () => {
  beforeEach(bersihkan);

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("menolak email kosong dengan pesan isian, bukan pesan kredensial salah", async () => {
    const hasil = await loginAction(AWAL, formData({ email: "  ", password: SANDI }));

    // Brief bagian 7 meminta umpan balik yang jelas. "Kata sandi salah" untuk
    // isian yang belum diisi itu menyesatkan: pengguna akan mengulang mengetik
    // kata sandi, padahal yang kurang adalah emailnya.
    expect(hasil.error).toMatch(/wajib diisi/i);
  });

  it("menolak kata sandi kosong dengan pesan isian", async () => {
    const hasil = await loginAction(AWAL, formData({ email: EMAIL, password: "" }));

    expect(hasil.error).toMatch(/wajib diisi/i);
  });

  it("menolak isian yang kepanjangan sebelum memverifikasi kata sandi", async () => {
    await buatAdmin();

    // argon2 lambat dengan sengaja; kata sandi sepanjang ini akan memakan
    // CPU yang tidak perlu kalau sampai diverifikasi.
    const hasil = await loginAction(
      AWAL,
      formData({ email: EMAIL, password: "x".repeat(1025) })
    );

    expect(hasil.error).not.toBeNull();
    const baris = await query<{ gagal: number }>(
      "SELECT failed_attempts AS gagal FROM admin_users WHERE email = ?",
      [EMAIL]
    );
    // Ditolak sebelum menyentuh database, jadi penghitung gagal tidak naik.
    expect(Number(baris[0].gagal)).toBe(0);
  });

  it("menolak kredensial yang salah dengan pesan yang tidak membocorkan email terdaftar", async () => {
    await buatAdmin();

    const hasil = await loginAction(AWAL, formData({ email: EMAIL, password: "sandi-keliru" }));

    expect(hasil.error).toBe("Email atau kata sandi salah.");
  });

  it("memakai pesan yang sama persis untuk email tak dikenal dan kata sandi salah", async () => {
    await buatAdmin();

    const emailTakDikenal = await loginAction(
      AWAL,
      formData({ email: "tidak-ada@uji.local", password: "apa-saja" })
    );
    const sandiSalah = await loginAction(AWAL, formData({ email: EMAIL, password: "keliru" }));

    // Membeda-bedakan kedua pesan sama dengan memberi tahu penyerang
    // email mana yang terdaftar.
    expect(emailTakDikenal.error).toBe(sandiSalah.error);
  });

  it("mempertahankan email yang sudah diketik agar tidak perlu diulang", async () => {
    await buatAdmin();

    const hasil = await loginAction(AWAL, formData({ email: EMAIL, password: "sandi-keliru" }));

    // Brief bagian 8: kesalahan validasi tidak menghapus input yang telah diisi.
    expect(hasil.email).toBe(EMAIL);
  });

  it("tidak pernah mengembalikan kata sandi ke halaman", async () => {
    await buatAdmin();

    const hasil = await loginAction(AWAL, formData({ email: EMAIL, password: "sandi-keliru" }));

    // Kata sandi yang dikembalikan akan ikut ter-render ke HTML.
    expect(JSON.stringify(hasil)).not.toContain("sandi-keliru");
  });

  it("menaikkan penanda percobaan supaya form dipasang ulang", async () => {
    await buatAdmin();

    const hasil = await loginAction(AWAL, formData({ email: EMAIL, password: "keliru" }));

    // React mereset form setiap action selesai, jadi `key` yang berubah
    // inilah yang mengembalikan isian ke DOM saat validasi gagal.
    expect(hasil.percobaan).toBe(AWAL.percobaan + 1);
  });

  it("memangkas spasi di ujung email sebelum mencocokkan", async () => {
    await buatAdmin();

    const hasil = await loginAction(AWAL, formData({ email: `  ${EMAIL}  `, password: "keliru" }));

    // Kalau spasi tidak dipangkas, email tidak akan cocok dan pesannya tetap
    // sama — jadi yang membuktikan pemangkasan adalah tidak adanya baris
    // penghitung gagal pada email yang salah ejaan.
    expect(hasil.email).toBe(EMAIL);
    const baris = await query<{ gagal: number }>(
      "SELECT failed_attempts AS gagal FROM admin_users WHERE email = ?",
      [EMAIL]
    );
    expect(Number(baris[0].gagal)).toBe(1);
  });
});

/**
 * Sesi yang dibuat login memakai token mentah yang hanya ada di cookie.
 * Tes di bawah memeriksa sifat yang membuatnya aman: yang tersimpan di
 * database adalah hash, bukan tokennya, dan sesi benar-benar mati saat
 * dicabut.
 *
 * Batas yang jujur: `loginAction` sendiri tidak bisa dijalankan di sini.
 * Cabang suksesnya memanggil `cookies()` dari `next/headers`, yang hanya
 * hidup di dalam permintaan HTTP dan melempar galat di luar itu. Yang
 * diuji di sini adalah sesi yang dibentuknya, bukan pemanggilan itu
 * sendiri. Jalur HTTP-nya diuji sebagai acceptance test di Task 8.
 */
describe("sesi yang dibuat login", () => {
  beforeEach(bersihkan);

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("menyimpan hash token, bukan token mentahnya", async () => {
    await buatAdmin();
    const admin = await query<{ id: string }>("SELECT id FROM admin_users WHERE email = ?", [EMAIL]);

    const token = await createSession(admin[0].id);

    const baris = await query<{ token_hash: string }>("SELECT token_hash FROM sessions");
    expect(baris).toHaveLength(1);
    expect(baris[0].token_hash).not.toBe(token);
    expect(baris[0].token_hash).toHaveLength(64);
  });

  it("menerima token yang baru dibuat dan mencabutnya setelah logout", async () => {
    await buatAdmin();
    const admin = await query<{ id: string }>("SELECT id FROM admin_users WHERE email = ?", [EMAIL]);

    const token = await createSession(admin[0].id);
    expect(await verifySessionToken(token)).not.toBeNull();

    // Inilah yang dijanjikan brief bagian 7: logout menutup akses, bukan
    // sekadar membersihkan cookie di browser. `deleteSession` adalah fungsi
    // yang benar-benar dipanggil `logoutAction`.
    await deleteSession(token);
    expect(await verifySessionToken(token)).toBeNull();
  });
});
