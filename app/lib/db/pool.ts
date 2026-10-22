import mysql from "mysql2/promise";
import { readEnv } from "../env";

let pool: mysql.Pool | null = null;

/**
 * Kolasi koneksi.
 *
 * `utf8mb4_unicode_ci` dipilih karena tersedia di MySQL 8 **dan** MariaDB.
 * `utf8mb4_0900_ai_ci` hanya ada di MySQL 8; memakainya membuat koneksi ke
 * MariaDB gagal. Pengurutan `ORDER BY title` mengikuti kolasi kolom tabel,
 * bukan kolasi koneksi, jadi urutan A–Z katalog ditentukan di migration.
 */
const KOLASI = "utf8mb4_unicode_ci";

export function getPool(): mysql.Pool {
  if (pool === null) {
    const config = readEnv();
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      charset: KOLASI,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool !== null) {
    const sedangDitutup = pool;
    pool = null;
    await sedangDitutup.end();
  }
}
