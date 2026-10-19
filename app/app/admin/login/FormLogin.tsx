"use client";

import { useActionState } from "react";
import type { LoginState } from "../login-state";

type Aksi = (sebelumnya: LoginState, data: FormData) => Promise<LoginState>;

export function FormLogin({ action, awal }: { action: Aksi; awal: LoginState }) {
  const [state, formAction, sedangProses] = useActionState(action, awal);

  return (
    // `key` yang berubah setiap percobaan memaksa form dipasang ulang dengan
    // isian awal yang baru. Ini yang membuat email yang sudah diketik tidak
    // hilang saat validasi gagal — React mereset form setiap action selesai,
    // jadi mengandalkan nilai di DOM saja tidak cukup.
    <form key={state.percobaan} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          // Halaman login hanya berisi satu form; fokus otomatis
          // menghemat satu klik bagi admin yang membukanya berkali-kali.
          autoFocus
          required
          defaultValue={state.email}
          className="rounded border px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password">Kata sandi</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded border px-3 py-2"
        />
      </div>

      <p aria-live="polite" data-testid="login-error" className="min-h-5 text-sm text-red-700">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={sedangProses}
        className="rounded border px-4 py-2 hover:bg-zinc-50 disabled:opacity-50"
      >
        {sedangProses ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
