import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "..", "db", "migrations");

function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Variabel environment belum diisi: ${name}`);
  }
  return value;
}

const connection = await mysql.createConnection({
  host: env("DB_HOST"),
  port: Number(env("DB_PORT")),
  user: env("DB_USER"),
  password: process.env.DB_PASSWORD ?? "",
  multipleStatements: true,
});

try {
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${env("DB_NAME")}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
  );
  await connection.changeUser({ database: env("DB_NAME") });

  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    throw new Error(`Tidak ada file migration di ${migrationsDir}`);
  }

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    process.stdout.write(`Menjalankan ${file} ... `);
    await connection.query(sql);
    process.stdout.write("selesai\n");
  }

  console.log(`\n${files.length} migration diterapkan ke database "${env("DB_NAME")}".`);
} catch (error) {
  console.error("\nMigration gagal:", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
