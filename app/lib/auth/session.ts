import { randomBytes, createHash } from "node:crypto";
import { query, execute } from "../db/query";
import type { Admin } from "./login";

export const LAMA_SESI_HARI = 7;

/**
 * Cookie sesi disimpan tanpa tanda tangan, dan yang ada di database adalah
 * hash token — bukan token aslinya. Konsekuensinya sesi bisa dicabut seketika
 * cukup dengan menghapus barisnya, tanpa kunci penandatangan yang perlu
 * dibuat atau dirotasi. Inilah alasan desain di `docs/DESIGN-STACK.md` §4.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");

  // Masa berlaku ditetapkan oleh jam database, bukan jam Node.js — sama
  // seperti pemeriksaan lockout di `login.ts`, supaya satu sumber waktu
  // yang menulis juga yang menilai.
  await execute(
    `INSERT INTO sessions (token_hash, admin_id, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [hashToken(token), adminId, LAMA_SESI_HARI]
  );

  return token;
}

type BarisSesi = {
  admin_id: string;
  email: string;
  sah: number;
};

/**
 * Memeriksa token terhadap tabel `sessions`.
 *
 * Sesi kedaluwarsa dihapus saat ditemukan, bukan dibiarkan menumpuk:
 * pemeriksaan ini satu-satunya tempat yang pasti melihatnya.
 */
export async function verifySessionToken(token: string): Promise<Admin | null> {
  const dicari = token.trim();
  if (dicari === "") return null;

  const tokenHash = hashToken(dicari);
  const baris = await query<BarisSesi>(
    `SELECT s.admin_id, a.email, (s.expires_at > NOW()) AS sah
       FROM sessions s
       JOIN admin_users a ON a.id = s.admin_id
      WHERE s.token_hash = ?`,
    [tokenHash]
  );

  if (baris.length === 0) return null;

  if (Number(baris[0].sah) !== 1) {
    await execute("DELETE FROM sessions WHERE token_hash = ?", [tokenHash]);
    return null;
  }

  return { id: baris[0].admin_id, email: baris[0].email };
}

/** Logout. Token yang tidak ada bukan kesalahan — hasilnya sama: tidak ada sesi. */
export async function deleteSession(token: string): Promise<void> {
  const dicari = token.trim();
  if (dicari === "") return;

  await execute("DELETE FROM sessions WHERE token_hash = ?", [hashToken(dicari)]);
}

export async function hapusSesiKedaluwarsa(): Promise<number> {
  const hasil = await execute("DELETE FROM sessions WHERE expires_at <= NOW()");
  return hasil.affectedRows;
}
