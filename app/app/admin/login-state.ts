/**
 * Tipe dan nilai awal form login.
 *
 * Diletakkan di berkas terpisah — bukan di `actions.ts` — karena berkas
 * ber-`"use server"` hanya boleh mengekspor fungsi async: setiap ekspor
 * di sana menjadi endpoint yang bisa dipanggil klien. Nilai biasa
 * membuat build gagal dengan "A 'use server' file can only export async
 * functions, found object."
 */

export type LoginState = {
  error: string | null;
  /**
   * Email yang tadi diketik, dikembalikan supaya tidak perlu diulang.
   *
   * Kata sandi sengaja TIDAK ikut dikembalikan: menaruhnya kembali ke
   * dalam HTML berarti kata sandi ikut terkirim ulang dan tertinggal di DOM.
   */
  email: string;
  /**
   * Nomor percobaan, dipakai sebagai `key` form di sisi klien.
   *
   * React mereset form setiap kali action dijalankan — termasuk saat
   * validasi gagal — jadi isian tidak bisa diandalkan bertahan di DOM.
   * Mengganti `key` memaksa form dipasang ulang dengan nilai awal yang
   * baru, sehingga isian admin kembali seperti yang ia ketik.
   */
  percobaan: number;
};

export const LOGIN_AWAL: LoginState = { error: null, email: "", percobaan: 0 };
