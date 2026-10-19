import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { hash } from "@node-rs/argon2";
import { execute, query, closePool } from "../db/query";
import { attemptLogin, BATAS_PERCOBAAN, LAMA_KUNCI_MENIT } from "./login";

const EMAIL = "admin@uji.local";
const SANDI = "sandi-yang-cukup-panjang";

async function bersihkan() {
  // Urutan penting: `sessions` punya foreign key ke `admin_users`.
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

async function bacaAdmin() {
  const baris = await query<{
    failed_attempts: number;
    locked_until: Date | null;
  }>("SELECT failed_attempts, locked_until FROM admin_users WHERE email = ?", [EMAIL]);
  return baris[0];
}

describe("attemptLogin", () => {
  beforeEach(bersihkan);

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("menerima kredensial benar dan mengembalikan data admin", async () => {
    await buatAdmin();

    const hasil = await attemptLogin(EMAIL, SANDI);

    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.admin.email).toBe(EMAIL);
  });

  it("menolak kata sandi salah dengan pesan yang tidak membocorkan mana yang salah", async () => {
    await buatAdmin();

    const hasil = await attemptLogin(EMAIL, "sandi-yang-salah-sekali");

    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toBe("Email atau kata sandi salah.");
  });

  it("menolak email yang tidak terdaftar dengan pesan yang sama persis", async () => {
    await buatAdmin();

    const hasil = await attemptLogin("bukan-siapa-siapa@uji.local", SANDI);

    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toBe("Email atau kata sandi salah.");
  });

  it("menambah failed_attempts setiap kali kata sandi salah", async () => {
    await buatAdmin();

    await attemptLogin(EMAIL, "salah-satu");
    expect((await bacaAdmin()).failed_attempts).toBe(1);

    await attemptLogin(EMAIL, "salah-dua");
    expect((await bacaAdmin()).failed_attempts).toBe(2);
  });

  it("mereset failed_attempts setelah login berhasil", async () => {
    await buatAdmin();
    await attemptLogin(EMAIL, "salah");
    await attemptLogin(EMAIL, "salah");

    const hasil = await attemptLogin(EMAIL, SANDI);
    expect(hasil.ok).toBe(true);

    const setelah = await bacaAdmin();
    expect(setelah.failed_attempts).toBe(0);
    expect(setelah.locked_until).toBeNull();
  });

  it(`mengunci akun setelah ${BATAS_PERCOBAAN} kali gagal`, async () => {
    await buatAdmin();

    for (let i = 0; i < BATAS_PERCOBAAN; i += 1) {
      await attemptLogin(EMAIL, "salah");
    }

    const setelah = await bacaAdmin();
    expect(setelah.failed_attempts).toBe(BATAS_PERCOBAAN);
    expect(setelah.locked_until).toBeInstanceOf(Date);
  });

  it("menolak kata sandi benar selama akun masih terkunci", async () => {
    await buatAdmin();

    for (let i = 0; i < BATAS_PERCOBAAN; i += 1) {
      await attemptLogin(EMAIL, "salah");
    }

    const hasil = await attemptLogin(EMAIL, SANDI);

    expect(hasil.ok).toBe(false);
    if (!hasil.ok) expect(hasil.error).toContain("terkunci");
  });

  it("menerima kembali setelah masa kunci lewat", async () => {
    await buatAdmin();

    for (let i = 0; i < BATAS_PERCOBAAN; i += 1) {
      await attemptLogin(EMAIL, "salah");
    }

    // Memundurkan locked_until ke masa lalu, bukan menunggu 15 menit.
    await execute(
      "UPDATE admin_users SET locked_until = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE email = ?",
      [EMAIL]
    );

    const hasil = await attemptLogin(EMAIL, SANDI);
    expect(hasil.ok).toBe(true);
  });

  it("memakai lama kunci yang ditetapkan brief", () => {
    expect(LAMA_KUNCI_MENIT).toBe(15);
  });
});
