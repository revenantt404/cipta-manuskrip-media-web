/**
 * Sumber nilai environment. Sengaja bukan `NodeJS.ProcessEnv`: mulai
 * `@types/node` 24 tipe itu mewajibkan `NODE_ENV`, sehingga objek biasa
 * tidak lagi memenuhinya — termasuk objek yang dipakai tes.
 */
export type EnvSource = Record<string, string | undefined>;

export type DbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

export function readEnv(source: EnvSource = process.env): DbConfig {
  const missing: string[] = [];
  const required = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"] as const;

  for (const key of required) {
    const value = source[key];
    if (value === undefined || value.trim() === "") missing.push(key);
  }

  if (missing.length > 0) {
    throw new Error(
      `Variabel environment belum diisi: ${missing.join(", ")}. Salin .env.example menjadi .env.local lalu isi nilainya.`
    );
  }

  const port = Number(source.DB_PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`DB_PORT harus bilangan bulat 1-65535, diterima: ${source.DB_PORT}`);
  }

  return {
    host: source.DB_HOST as string,
    port,
    user: source.DB_USER as string,
    password: source.DB_PASSWORD ?? "",
    database: source.DB_NAME as string,
  };
}
