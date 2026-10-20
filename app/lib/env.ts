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

/**
 * Alamat dasar situs tanpa garis miring di ujung, dipakai untuk
 * `metadataBase`, robots.txt, dan sitemap.xml.
 *
 * Berbeda dari `readEnv`, fungsi ini sengaja tidak melempar galat: satu
 * variabel yang belum diisi tidak boleh menggagalkan halaman publik, jadi
 * `http://localhost:3000` dikembalikan untuk nilai kosong, spasi saja, atau
 * bukan URL http(s) yang sah. Tanpa garis miring di ujung penting karena
 * `metadataBase` dan URL sitemap dari Next.js kelak digandengkan dengan nilai ini.
 */
export function siteUrl(source: EnvSource = process.env): string {
  const bawaan = "http://localhost:3000";
  const nilai = source.SITE_URL?.trim();

  if (!nilai) return bawaan;

  try {
    const url = new URL(nilai);
    if (url.protocol !== "http:" && url.protocol !== "https:") return bawaan;
    // Ruling AA: hasil fungsi ini digandengkan dengan path (`/sitemap.xml`,
    // `/robots.txt`). SITE_URL ber-query atau ber-fragment menghasilkan
    // `https://contoh.com/?x=1/sitemap.xml` — path tersesat di belakang
    // query. Nilai seperti itu dianggap tidak sah, bukan dipangkas.
    if (url.search !== "" || url.hash !== "") return bawaan;
    return url.href.replace(/\/+$/, "");
  } catch {
    return bawaan;
  }
}
