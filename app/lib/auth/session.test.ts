import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createHash } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { execute, query, closePool } from "../db/query";
import {
  createSession,
  verifySessionToken,
  deleteSession,
  hapusSesiKedaluwarsa,
  LAMA_SESI_HARI,
} from "./session";

const EMAIL = "admin@uji.local";

async function bersihkan() {
  await execute("DELETE FROM sessions");
  await execute("DELETE FROM admin_users");
}

async function buatAdmin(): Promise<string> {
  const passwordHash = await hash("sandi-yang-cukup-panjang");
  await execute("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)", [
    EMAIL,
    passwordHash,
  ]);
  const baris = await query<{ id: string }>("SELECT id FROM admin_users WHERE email = ?", [EMAIL]);
  return baris[0].id;
}

function sha256(nilai: string): string {
  return createHash("sha256").update(nilai).digest("hex");
}

describe("manajemen sesi", () => {
  beforeEach(bersihkan);

  afterAll(async () => {
    await bersihkan();
    await closePool();
  });

  it("membuat token 64 karakter heksadesimal dari 32 byte acak", async () => {
    const adminId = await buatAdmin();

    const token = await createSession(adminId);

    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("menyimpan hash token, bukan token aslinya", async () => {
    const adminId = await buatAdmin();

    const token = await createSession(adminId);

    const tersimpan = await query<{ token_hash: string }>("SELECT token_hash FROM sessions");
    expect(tersimpan).toHaveLength(1);
    expect(tersimpan[0].token_hash).toBe(sha256(token));
    expect(tersimpan[0].token_hash).not.toBe(token);
  });

  it("membuat token berbeda untuk setiap sesi", async () => {
    const adminId = await buatAdmin();

    const a = await createSession(adminId);
    const b = await createSession(adminId);

    expect(a).not.toBe(b);
  });

  it("mengembalikan data admin untuk token yang sah", async () => {
    const adminId = await buatAdmin();
    const token = await createSession(adminId);

    const admin = await verifySessionToken(token);

    expect(admin).not.toBeNull();
    expect(admin?.id).toBe(adminId);
    expect(admin?.email).toBe(EMAIL);
  });

  it("menolak token acak yang tidak pernah dibuat", async () => {
    const adminId = await buatAdmin();
    await createSession(adminId);

    expect(await verifySessionToken("a".repeat(64))).toBeNull();
  });

  it("menolak token kosong tanpa menyentuh database", async () => {
    const adminId = await buatAdmin();
    await createSession(adminId);

    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("   ")).toBeNull();
  });

  it("menolak dan membersihkan sesi yang sudah kedaluwarsa", async () => {
    const adminId = await buatAdmin();
    const token = await createSession(adminId);

    await execute("UPDATE sessions SET expires_at = DATE_SUB(NOW(), INTERVAL 1 SECOND)");

    expect(await verifySessionToken(token)).toBeNull();

    const tersisa = await query<{ jumlah: number }>(
      "SELECT COUNT(*) AS jumlah FROM sessions"
    );
    expect(Number(tersisa[0].jumlah)).toBe(0);
  });

  it("menutup akses setelah logout", async () => {
    const adminId = await buatAdmin();
    const token = await createSession(adminId);

    await deleteSession(token);

    expect(await verifySessionToken(token)).toBeNull();
  });

  it("tidak melempar ketika logout dengan token yang tidak ada", async () => {
    await expect(deleteSession("b".repeat(64))).resolves.toBeUndefined();
  });

  it("menghapus sesi milik admin yang dihapus, tanpa menyisakan baris yatim", async () => {
    const adminId = await buatAdmin();
    await createSession(adminId);

    await execute("DELETE FROM admin_users WHERE id = ?", [adminId]);

    const tersisa = await query<{ jumlah: number }>("SELECT COUNT(*) AS jumlah FROM sessions");
    expect(Number(tersisa[0].jumlah)).toBe(0);
  });

  it("membersihkan seluruh sesi kedaluwarsa sekaligus", async () => {
    const adminId = await buatAdmin();
    await createSession(adminId);
    await createSession(adminId);
    const segar = await createSession(adminId);

    await execute("UPDATE sessions SET expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY)");
    await createSession(adminId);

    const dihapus = await hapusSesiKedaluwarsa();
    expect(dihapus).toBeGreaterThanOrEqual(3);

    expect(await verifySessionToken(segar)).toBeNull();
    const tersisa = await query<{ jumlah: number }>("SELECT COUNT(*) AS jumlah FROM sessions");
    expect(Number(tersisa[0].jumlah)).toBe(1);
  });

  it("memakai masa berlaku yang ditetapkan yaitu 7 hari", () => {
    expect(LAMA_SESI_HARI).toBe(7);
  });
});
