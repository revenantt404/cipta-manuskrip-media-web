import { parseArgs } from "node:util";
import { hash } from "@node-rs/argon2";

/**
 * Membuat satu pernyataan SQL `INSERT` untuk akun admin, untuk ditempel
 * manual di phpMyAdmin.
 *
 * Jalur biasa (`db:create-admin`) butuh Node.js *di server* karena harus
 * menulis ke database. Skrip ini tidak menyentuh database sama sekali: ia
 * hanya menghitung hash argon2id di mesin lokal, lalu mencetak SQL-nya.
 * Hasilnya bisa ditempel ke hosting yang hanya menyediakan phpMyAdmin.
 *
 * Hash argon2id bersifat mandiri: parameter (memori, iterasi, paralelisme)
 * dan salt ikut tersimpan di dalam string-nya, sehingga bisa diverifikasi
 * oleh pustaka yang sama di mesin mana pun.
 */

const PESAN = {
  email: "Email tidak valid.",
  password: "Password minimal 12 karakter.",
};

function gagal(pesan) {
  console.error(pesan);
  process.exit(1);
}

/** Membaca password dari stdin tanpa menampilkan ketikan di layar. */
function bacaPasswordTersembunyi() {
  if (process.stdin.isTTY !== true) {
    gagal(
      "Password harus diketik dari terminal, atau diisi lewat ADMIN_PASSWORD. " +
        'Contoh: ADMIN_PASSWORD="rahasia" npm run db:admin-sql -- --email admin@contoh.com'
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

/**
 * Meng-escape nilai string untuk literal SQL.
 *
 * Backslash ikut di-escape karena MySQL memperlakukannya sebagai karakter
 * escape di dalam string. Hash argon2 hanya berisi huruf, angka, `.`, `+`,
 * `/`, `$`, dan `=`, tetapi email berasal dari pengguna sehingga harus
 * diperlakukan sebagai data yang tidak tepercaya.
 */
function literalSql(nilai) {
  return `'${nilai.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

const { values } = parseArgs({
  options: { email: { type: "string" } },
  allowPositionals: true,
});

const email = (values.email ?? "").trim();
if (email === "" || !email.includes("@")) {
  gagal(PESAN.email);
}

const password = process.env.ADMIN_PASSWORD?.trim()
  ? process.env.ADMIN_PASSWORD
  : await bacaPasswordTersembunyi();

if (password.length < 12) {
  gagal(PESAN.password);
}

const passwordHash = await hash(password);

if (passwordHash.length > 255) {
  gagal(`Hash terlalu panjang untuk kolom VARCHAR(255): ${passwordHash.length} karakter.`);
}

process.stdout.write(
  [
    "",
    "Tempel pernyataan berikut di phpMyAdmin (tab SQL), lalu klik Go:",
    "",
    `INSERT INTO admin_users (email, password_hash) VALUES (${literalSql(email)}, ${literalSql(passwordHash)});`,
    "",
    "Setelah itu login di /admin/login dengan email dan password yang tadi diketik.",
    "Panjang hash: " + passwordHash.length + " karakter (kolom database: 255).",
    "",
  ].join("\n"),
);
