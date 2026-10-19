import { parseArgs } from "node:util";
import mysql from "mysql2/promise";
import { hash } from "@node-rs/argon2";

const PESAN = {
  email: "Email tidak valid.",
  password: "Password minimal 12 karakter.",
  duplikat: "Admin dengan email tersebut sudah ada.",
};

function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Variabel environment belum diisi: ${name}`);
  }
  return value;
}

function gagal(pesan) {
  console.error(pesan);
  process.exit(1);
}
/** Membaca password dari stdin tanpa menampilkan ketikan di layar. */
function bacaPasswordTersembunyi() {
  // Tanpa terminal, tidak ada yang bisa mengetik. Tanpa penjaga ini,
  // pemanggil mendapat jejak tumpukan alih-alih keterangan yang berguna.
  if (process.stdin.isTTY !== true) {
    gagal(
      "Password harus diketik dari terminal, atau diisi lewat ADMIN_PASSWORD. " +
        "Contoh: ADMIN_PASSWORD=\"rahasia\" npm run db:create-admin -- --email admin@contoh.com"
    );
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let password = "";

    stdout.write("Password admin: ");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const bersihkan = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", padaData);
    };

    const padaData = (char) => {
      switch (char) {
        case "\u0003": // Ctrl+C
          bersihkan();
          stdout.write("\n");
          process.exit(130);
          break;
        case "\r":
        case "\n":
          bersihkan();
          stdout.write("\n");
          resolve(password);
          break;
        case "\u007f": // Backspace
        case "\b":
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write("\b \b");
          }
          break;
        default:
          password += char;
          stdout.write("*");
      }
    };

    stdin.on("data", padaData);
    stdin.on("error", (error) => {
      bersihkan();
      reject(error);
    });
  });
}

const { values } = parseArgs({
  options: { email: { type: "string" } },
  allowPositionals: true,
});

const email = values.email ?? "";
if (email.trim() === "" || !email.includes("@")) {
  gagal(PESAN.email);
}

const password = process.env.ADMIN_PASSWORD?.trim()
  ? process.env.ADMIN_PASSWORD
  : await bacaPasswordTersembunyi();

if (password.length < 12) {
  gagal(PESAN.password);
}

const connection = await mysql.createConnection({
  host: env("DB_HOST"),
  port: Number(env("DB_PORT")),
  user: env("DB_USER"),
  password: process.env.DB_PASSWORD ?? "",
  database: env("DB_NAME"),
});

try {
  const [ada] = await connection.query("SELECT id FROM admin_users WHERE email = ?", [email]);

  if (ada.length > 0) {
    // Tidak boleh memakai `gagal()` di sini: `process.exit()` melewati blok
    // `finally`, sehingga koneksi tidak pernah ditutup.
    console.error(PESAN.duplikat);
    process.exitCode = 1;
  } else {
    const passwordHash = await hash(password);
    await connection.query("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)", [
      email,
      passwordHash,
    ]);

    console.log(`Admin ${email} dibuat.`);
  }
} catch (error) {
  console.error("\nGagal membuat admin:", error.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}
