import { query, execute } from "../db/query";
import { verifyPassword } from "./password";

export const BATAS_PERCOBAAN = 5;
export const LAMA_KUNCI_MENIT = 15;

export type Admin = { id: string; email: string };

export type LoginResult =
  | { ok: true; admin: Admin }
  | { ok: false; error: string };

/**
 * Pesan yang sama untuk email tak dikenal dan kata sandi salah: membedakan
 * keduanya memberi tahu penyerang email mana yang terdaftar.
 */
const PESAN_GAGAL = "Email atau kata sandi salah.";

type BarisAdmin = {
  id: string;
  email: string;
  password_hash: string;
  failed_attempts: number;
  terkunci: number;
};

/**
 * Apakah akun sedang terkunci.
 *
 * Perbandingan dilakukan oleh database lewat `terkunci`, bukan oleh
 * JavaScript: jam server aplikasi dan jam server database bisa berbeda
 * (beda zona waktu, beda NTP), dan membandingkan `locked_until` dengan
 * `new Date()` Node.js membuat lockout salah hitung begitu keduanya
 * bergeser. Database yang menulis waktunya, database yang menilainya.
 */
async function ambilAdmin(email: string): Promise<BarisAdmin | null> {
  const baris = await query<BarisAdmin>(
    `SELECT id, email, password_hash, failed_attempts,
            (locked_until IS NOT NULL AND locked_until > NOW()) AS terkunci
       FROM admin_users
      WHERE email = ?`,
    [email]
  );
  return baris.length > 0 ? baris[0] : null;
}

async function catatGagal(admin: BarisAdmin): Promise<void> {
  const percobaan = Number(admin.failed_attempts) + 1;

  if (percobaan >= BATAS_PERCOBAAN) {
    await execute(
      `UPDATE admin_users
          SET failed_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
        WHERE id = ?`,
      [percobaan, LAMA_KUNCI_MENIT, admin.id]
    );
    return;
  }

  await execute("UPDATE admin_users SET failed_attempts = ? WHERE id = ?", [
    percobaan,
    admin.id,
  ]);
}

async function bersihkanHitungan(adminId: string): Promise<void> {
  await execute(
    "UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = ?",
    [adminId]
  );
}

/**
 * Satu percobaan login.
 *
 * Penghitung kegagalan disimpan di database, bukan di memori proses:
 * penghitung di memori hilang saat restart dan tidak berlaku lintas proses,
 * sehingga kontrolnya tidak nyata.
 */
export async function attemptLogin(email: string, plainPassword: string): Promise<LoginResult> {
  const dicari = email.trim();
  if (dicari === "" || plainPassword === "") return { ok: false, error: PESAN_GAGAL };

  const admin = await ambilAdmin(dicari);

  // Email tak dikenal tidak punya baris untuk dihitung; jalur ini tetap
  // memakai pesan yang sama supaya tidak bisa dipakai menebak email.
  if (admin === null) return { ok: false, error: PESAN_GAGAL };

  if (Number(admin.terkunci) === 1) {
    return {
      ok: false,
      error: `Akun terkunci sementara setelah ${BATAS_PERCOBAAN} percobaan gagal. Coba lagi beberapa saat lagi.`,
    };
  }

  if (!(await verifyPassword(admin.password_hash, plainPassword))) {
    await catatGagal(admin);
    return { ok: false, error: PESAN_GAGAL };
  }

  await bersihkanHitungan(admin.id);
  return { ok: true, admin: { id: admin.id, email: admin.email } };
}
