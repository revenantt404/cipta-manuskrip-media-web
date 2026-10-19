import { describe, expect, it, beforeEach, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { execute, query, closePool } from "../lib/db/query";

/**
 * Skrip ini dijalankan sebagai proses terpisah, bukan dipanggil sebagai fungsi:
 * yang diuji adalah perilaku yang benar-benar diterima pemakainya — keluaran
 * di layar dan kode keluar — bukan bentuk internalnya.
 */
const EMAIL_BARU = "uji-admin-baru@localhost";
const EMAIL_ADA = "uji-admin-ada@localhost";
const PASSWORD_SAH = "password-yang-cukup-panjang";
const PASSWORD_PENDEK = "pendek"; // 6 karakter, jelas di bawah batas 12

function jalankanSkrip(args: string[], env: Record<string, string> = {}) {
  const hasil = spawnSync(process.execPath, ["scripts/create-admin.mjs", ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  return {
    kode: hasil.status,
    keluaran: `${hasil.stdout ?? ""}${hasil.stderr ?? ""}`.trim(),
  };
}

async function bersihkan() {
  await execute("DELETE FROM admin_users WHERE email IN (?, ?)", [EMAIL_BARU, EMAIL_ADA]);
}

describe("create-admin", () => {
  // Setiap tes berdiri sendiri: urutan pelaksanaan tidak boleh menentukan hasil.
  beforeEach(bersihkan);

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("menolak email tanpa tanda @", async () => {
    const hasil = jalankanSkrip(["--email", "bukanemail"]);

    expect(hasil.kode).toBe(1);
    expect(hasil.keluaran).toContain("Email tidak valid.");
  });

  it("menolak password kurang dari 12 karakter", async () => {
    const hasil = jalankanSkrip(["--email", EMAIL_BARU], { ADMIN_PASSWORD: PASSWORD_PENDEK });

    expect(hasil.kode).toBe(1);
    expect(hasil.keluaran).toContain("Password minimal 12 karakter.");
  });

  it("menerima password tepat 12 karakter", async () => {
    const tepatDuaBelas = "duabelaskali"; // d-u-a-b-e-l-a-s-k-a-l-i = 12
    expect(tepatDuaBelas).toHaveLength(12);

    const hasil = jalankanSkrip(["--email", EMAIL_BARU], { ADMIN_PASSWORD: tepatDuaBelas });

    expect(hasil.kode).toBe(0);
    expect(hasil.keluaran).toContain(`Admin ${EMAIL_BARU} dibuat.`);
  });

  it("menyimpan password sebagai hash argon2id, bukan teks biasa", async () => {
    const hasil = jalankanSkrip(["--email", EMAIL_BARU], { ADMIN_PASSWORD: PASSWORD_SAH });

    expect(hasil.kode).toBe(0);
    expect(hasil.keluaran).toContain(`Admin ${EMAIL_BARU} dibuat.`);

    const [baris] = await query<{
      hash: string;
      panjang: number;
      failed_attempts: number;
    }>(
      "SELECT password_hash AS hash, LENGTH(password_hash) AS panjang, failed_attempts FROM admin_users WHERE email = ?",
      [EMAIL_BARU]
    );

    // Parameter bawaan @node-rs/argon2: argon2id, m=19456, t=2, p=1.
    // Diperiksa utuh, bukan dipotong: panjang potongan yang salah di plan
    // (22 karakter) tidak cocok dengan nilai yang diharapkannya.
    expect(baris.hash.startsWith("$argon2id$v=19$m=19456,t=2,p=1$")).toBe(true);
    expect(baris.hash).not.toContain(PASSWORD_SAH);
    expect(baris.panjang).toBe(97);
    expect(baris.failed_attempts).toBe(0);
  });

  it("menolak email yang sudah ada dan tidak menimpa barisnya", async () => {
    await execute("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)", [
      EMAIL_ADA,
      "$argon2id$v=19$m=19456,t=2,p=1$hash-lama-yang-tidak-boleh-berubah",
    ]);

    const hasil = jalankanSkrip(["--email", EMAIL_ADA], { ADMIN_PASSWORD: PASSWORD_SAH });

    expect(hasil.kode).toBe(1);
    expect(hasil.keluaran).toContain("Admin dengan email tersebut sudah ada.");

    const [baris] = await query<{ n: number; hash: string }>(
      "SELECT COUNT(*) AS n, MIN(password_hash) AS hash FROM admin_users WHERE email = ?",
      [EMAIL_ADA]
    );
    expect(baris.n).toBe(1);
    expect(baris.hash).toContain("hash-lama-yang-tidak-boleh-berubah");
  });

  it("memberi pesan jelas saat tidak ada terminal untuk mengetik password", async () => {
    // Tanpa ADMIN_PASSWORD dan tanpa TTY, skrip tidak boleh menampilkan
    // jejak tumpukan (stack trace) ke pemakainya.
    const hasil = jalankanSkrip(["--email", EMAIL_BARU]);

    expect(hasil.kode).toBe(1);
    expect(hasil.keluaran).toContain("harus diketik dari terminal");
    expect(hasil.keluaran).not.toContain("at bacaPasswordTersembunyi");
    expect(hasil.keluaran).not.toContain("TypeError");
  });
});
