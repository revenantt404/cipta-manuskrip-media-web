import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, LAMA_SESI_HARI } from "./session";
import type { Admin } from "./login";

export const NAMA_COOKIE = "cmm_session";

const PRODUKSI = process.env.NODE_ENV === "production";

export type OpsiCookie = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

/**
 * Opsi cookie sesi.
 *
 * `httpOnly` menutup cookie dari JavaScript browser, `SameSite=Lax`
 * mencegahnya ikut terkirim pada permintaan lintas situs, dan `secure`
 * menyala di produksi supaya token tidak pernah lewat HTTP polos.
 *
 * Ini fungsi murni supaya nilainya bisa diuji tanpa konteks request.
 */
export function opsiCookieSesi(produksi: boolean = PRODUKSI): OpsiCookie {
  return {
    httpOnly: true,
    secure: produksi,
    sameSite: "lax",
    path: "/",
    maxAge: LAMA_SESI_HARI * 24 * 60 * 60,
  };
}

export function opsiHapusCookie(produksi: boolean = PRODUKSI): OpsiCookie {
  return { ...opsiCookieSesi(produksi), maxAge: 0 };
}

/** Menyimpan token sesi ke cookie. Hanya boleh dipanggil dari Server Action. */
export async function setCookieSesi(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(NAMA_COOKIE, token, opsiCookieSesi());
}

export async function hapusCookieSesi(): Promise<void> {
  const jar = await cookies();
  jar.set(NAMA_COOKIE, "", opsiHapusCookie());
}

/**
 * Admin yang sedang masuk, atau `null`.
 *
 * Cookie berisi token mentah; yang dicocokkan ke database adalah hashnya.
 * Cookie palsu, token yang salah, dan sesi kedaluwarsa semuanya berakhir
 * di sini sebagai `null` — tidak ada lapisan kedua yang menahan, jadi
 * pemeriksaan inilah yang menentukan.
 */
export async function getCurrentAdmin(): Promise<Admin | null> {
  const jar = await cookies();
  const token = jar.get(NAMA_COOKIE)?.value;
  if (token === undefined || token === "") return null;

  try {
    return await verifySessionToken(token);
  } catch {
    // Database tidak terjangkau bukan alasan menganggap seseorang admin.
    return null;
  }
}

/**
 * Penjaga untuk seluruh route admin selain login.
 *
 * Mengalihkan ke halaman login, bukan menampilkan pesan: pengunjung yang
 * belum masuk memang belum punya urusan di sana.
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (admin === null) redirect("/admin/login");
  return admin;
}
