/**
 * Batas panjang isian login di sisi server.
 *
 * URL-encoded dan multipart sama-sama bisa membawa kata sandi sepanjang
 * apa pun, dan argon2 sengaja lambat — membiarkan server memverifikasi
 * kata sandi sejuta karakter adalah cara mudah menghabiskan CPU.
 *
 * Nilai ini tidak boleh lebih ketat daripada yang diterima
 * `scripts/create-admin.mjs`, atau admin bisa membuat kata sandi yang
 * tidak bisa dipakai untuk masuk. Skrip itu menuntut minimal 12 karakter;
 * di sini batas bawahnya tidak ditegakkan ulang karena kata sandi yang
 * sudah tersimpan tetap harus bisa dipakai.
 */
export const PANJANG_EMAIL_MAKS = 255;
export const PANJANG_SANDI_MAKS = 1024;

export function isianTerlaluPanjang(email: string, password: string): boolean {
  return email.length > PANJANG_EMAIL_MAKS || password.length > PANJANG_SANDI_MAKS;
}
