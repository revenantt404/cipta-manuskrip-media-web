import mysql from "mysql2/promise";
import { readEnv } from "../env";

let pool: mysql.Pool | null = null;

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
      charset: "utf8mb4_0900_ai_ci",
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
