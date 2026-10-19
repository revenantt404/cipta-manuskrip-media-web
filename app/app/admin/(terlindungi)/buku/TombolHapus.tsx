"use client";

import { useActionState } from "react";
import type { AksiHapusBuku, StateHapusBuku } from "./form-state";

/**
 * Tombol hapus dengan konfirmasi.
 *
 * Konfirmasi memakai `window.confirm` alih-alih dialog sendiri: penghapusan
 * buku beserta sampulnya tidak bisa dibatalkan, dan satu langkah yang
 * menghalangi klik tak sengaja sudah cukup. Dialog kustom akan menambah
 * keadaan yang harus dijaga tanpa menambah keamanan.
 *
 * `key` yang berubah per percobaan diperlukan karena React mengosongkan form
 * setiap action selesai; tanpa itu pesan galat tidak akan pernah tampil.
 */
export function TombolHapus({
  action,
  judul,
}: {
  action: AksiHapusBuku;
  judul: string;
}) {
  const [state, formAction, sedangProses] = useActionState(action, {
    errors: {},
    percobaan: 0,
  } satisfies StateHapusBuku);

  return (
    <form
      key={state.percobaan}
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Hapus "${judul}"? Tindakan ini tidak bisa dibatalkan.`)) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-2"
    >
      {state.errors.form !== undefined ? (
        <p data-testid="galat-hapus" className="text-sm text-red-700">
          {state.errors.form}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sedangProses}
        className="self-start rounded border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {sedangProses ? "Menghapus…" : "Hapus buku"}
      </button>
    </form>
  );
}
