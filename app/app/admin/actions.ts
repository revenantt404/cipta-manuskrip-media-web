"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { attemptLogin } from "@/lib/auth/login";
import { createSession, deleteSession } from "@/lib/auth/session";
import { NAMA_COOKIE, setCookieSesi, hapusCookieSesi } from "@/lib/auth/guard";
import { isianTerlaluPanjang } from "@/lib/auth/limits";
import type { LoginState } from "./login-state";

/**
 * Berkas ini hanya mengekspor fungsi async, dan itu bukan gaya penulisan
 * semata: `"use server"` menjadikan SETIAP ekspor di sini endpoint yang
 * bisa dipanggil dari browser. Menambahkan nilai biasa — konstanta, objek,
 * tipe — membuat build gagal. Tipe dan nilai awal form karena itu tinggal
 * di `login-state.ts`.
 */

function isian(data: FormData, kunci: string): string {
  const nilai = data.get(kunci);
  return typeof nilai === "string" ? nilai : "";
}

/**
 * Satu percobaan login dari form.
 *
 * Galat yang bisa diduga — isian kurang, kredensial salah, akun terkunci —
 * dikembalikan sebagai nilai, bukan dilempar: brief bagian 7 meminta umpan
 * balik yang jelas, dan galat yang dilempar berakhir sebagai layar galat,
 * bukan pesan di form.
 */
export async function loginAction(
  sebelumnya: LoginState,
  data: FormData
): Promise<LoginState> {
  const email = isian(data, "email").trim();
  const password = isian(data, "password");
  const percobaan = sebelumnya.percobaan + 1;

  if (email === "" || password === "") {
    return { error: "Email dan kata sandi wajib diisi.", email, percobaan };
  }

  if (isianTerlaluPanjang(email, password)) {
    return { error: "Email atau kata sandi terlalu panjang.", email, percobaan };
  }

  let hasil;
  try {
    hasil = await attemptLogin(email, password);
  } catch {
    // Database tidak terjangkau bukan "kredensial salah" — mengatakannya
    // begitu membuat admin mengira kata sandinya bermasalah.
    return {
      error: "Login sedang tidak dapat diproses. Coba lagi beberapa saat lagi.",
      email,
      percobaan,
    };
  }

  if (!hasil.ok) return { error: hasil.error, email, percobaan };

  const token = await createSession(hasil.admin.id);
  await setCookieSesi(token);

  // `redirect` dipanggil di luar blok try/catch dengan sengaja: ia bekerja
  // dengan melempar `NEXT_REDIRECT`, sehingga di dalam catch ia akan
  // tertangkap dan pengguna tidak pernah berpindah halaman.
  redirect("/admin");
}

/** Token sesi dari cookie, atau `null`. */
async function tokenSesi(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(NAMA_COOKIE)?.value;
  return token === undefined || token === "" ? null : token;
}

/**
 * Logout: baris sesi dihapus lebih dahulu, baru cookie dibersihkan.
 *
 * Urutannya penting. Cookie tanpa baris sesi tidak berguna — tokennya tidak
 * cocok dengan apa pun. Sebaliknya, baris sesi yang masih hidup sementara
 * cookie sudah hilang tetap sah bagi siapa pun yang sempat menyalin
 * tokennya. Jadi yang dimatikan lebih dahulu adalah sesinya.
 */
export async function logoutAction(): Promise<void> {
  const token = await tokenSesi();
  if (token !== null) {
    try {
      await deleteSession(token);
    } catch {
      // Database tidak terjangkau: cookie tetap dibersihkan supaya browser
      // tidak terus membawa token yang tidak bisa dicabut sekarang.
    }
  }

  await hapusCookieSesi();
  redirect("/admin/login");
}
