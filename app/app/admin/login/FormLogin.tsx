"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, KeyRound, Mail, MoveRight } from "lucide-react";
import type { LoginState } from "../login-state";

type Aksi = (sebelumnya: LoginState, data: FormData) => Promise<LoginState>;

export function FormLogin({ action, awal }: { action: Aksi; awal: LoginState }) {
  const [state, formAction, sedangProses] = useActionState(action, awal);
  const [lihatPassword, setLihatPassword] = useState(false);

  return (
    <form key={state.percobaan} action={formAction} className="admin-login-form">
      <div className="admin-login-field">
        <label htmlFor="email">Email</label>
        <div className="admin-login-input-wrap">
          <Mail size={17} aria-hidden="true" />
          <input id="email" name="email" type="email" autoComplete="username" autoFocus required defaultValue={state.email} placeholder="nama@perusahaan.com" />
        </div>
      </div>

      <div className="admin-login-field">
        <div className="admin-login-label-row"><label htmlFor="password">Kata sandi</label></div>
        <div className="admin-login-input-wrap">
          <KeyRound size={17} aria-hidden="true" />
          <input id="password" name="password" type={lihatPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Masukkan kata sandi" />
          <button type="button" className="admin-password-toggle" aria-label={lihatPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} onClick={() => setLihatPassword((visible) => !visible)}>
            {lihatPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <p aria-live="polite" role={state.error ? "alert" : undefined} data-testid="login-error" className={`admin-login-error${state.error ? " has-error" : ""}`}>
        {state.error}
      </p>
      <button type="submit" disabled={sedangProses} className="admin-login-submit">
        <span>{sedangProses ? "Memeriksa akun…" : "Masuk ke panel"}</span>
        <MoveRight size={17} aria-hidden="true" />
      </button>
      <p className="admin-login-secure-note"><KeyRound size={13} /> Sesi masuk dikelola secara aman oleh server.</p>
    </form>
  );
}
