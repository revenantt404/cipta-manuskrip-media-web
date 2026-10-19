import { verify } from "@node-rs/argon2";

/**
 * Verifikasi kata sandi terhadap hash argon2id.
 *
 * Hash yang rusak atau bukan hasil argon2id membuat library melempar galat.
 * Di sini galat itu dianggap "tidak cocok" — bukan dibiarkan naik — supaya
 * satu baris rusak di tabel admin menjadi kegagalan login biasa, bukan
 * halaman 500.
 */
export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  if (hash.trim() === "" || plain === "") return false;

  try {
    return await verify(hash, plain);
  } catch {
    return false;
  }
}
