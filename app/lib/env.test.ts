import { describe, expect, it } from "vitest";
import { readEnv, type EnvSource } from "./env";

/** Sumber environment lengkap dan sah; tes lain menimpanya seperlunya. */
function sumberLengkap(): EnvSource {
  return {
    DB_HOST: "127.0.0.1",
    DB_PORT: "3306",
    DB_USER: "root",
    DB_PASSWORD: "",
    DB_NAME: "cipta_manuskrip_media",
  };
}

describe("readEnv", () => {
  it("mengembalikan konfigurasi database dari environment yang lengkap", () => {
    const hasil = readEnv(sumberLengkap());

    expect(hasil).toEqual({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "",
      database: "cipta_manuskrip_media",
    });
  });

  it("mengubah DB_PORT menjadi number, bukan string", () => {
    const hasil = readEnv(sumberLengkap());

    expect(hasil.port).toBe(3306);
    expect(typeof hasil.port).toBe("number");
  });

  it("menyebut semua variabel yang kurang sekaligus, bukan hanya yang pertama", () => {
    const sumber = sumberLengkap();
    delete sumber.DB_HOST;
    delete sumber.DB_USER;

    expect(() => readEnv(sumber)).toThrowError(/DB_HOST/);
    expect(() => readEnv(sumber)).toThrowError(/DB_USER/);
  });

  it("menolak variabel yang hanya berisi spasi", () => {
    const sumber = sumberLengkap();
    sumber.DB_NAME = "   ";

    expect(() => readEnv(sumber)).toThrowError(/DB_NAME/);
  });

  it("menolak DB_PORT yang bukan angka", () => {
    const sumber = sumberLengkap();
    sumber.DB_PORT = "tiga ribu";

    expect(() => readEnv(sumber)).toThrowError(/DB_PORT/);
  });

  it("menolak DB_PORT di luar rentang 1-65535", () => {
    const sumber = sumberLengkap();

    expect(() => readEnv({ ...sumber, DB_PORT: "0" })).toThrowError(/DB_PORT/);
    expect(() => readEnv({ ...sumber, DB_PORT: "70000" })).toThrowError(/DB_PORT/);
  });

  it("membolehkan DB_PASSWORD kosong dan menggantinya dengan string kosong", () => {
    const sumber = sumberLengkap();
    delete sumber.DB_PASSWORD;

    expect(readEnv(sumber).password).toBe("");
  });
});
