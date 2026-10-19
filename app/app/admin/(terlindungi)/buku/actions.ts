"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { simpanBukuBaru, bacaTeks } from "@/lib/books/manage";
import type { NilaiFormBuku, StateFormBuku } from "./form-state";

/**
 * Berkas ini hanya mengekspor fungsi async: `"use server"` menjadikan
 * setiap ekspor endpoint yang bisa dipanggil dari browser, dan ekspor nilai
 * biasa membuat build gagal. Karena itu tipe dan keadaan awal form tinggal
 * di `form-state.ts`.
 */

function bacaNilai(data: FormData): NilaiFormBuku {
  return {
    title: bacaTeks(data, "title"),
    author: bacaTeks(data, "author"),
    synopsis: bacaTeks(data, "synopsis"),
    publisherInfo: bacaTeks(data, "publisherInfo"),
    bookInfo: bacaTeks(data, "bookInfo"),
    status: bacaTeks(data, "status"),
    estimatedRelease: bacaTeks(data, "estimatedRelease"),
  };
}

/**
 * Menambahkan buku baru dari formulir admin.
 *
 * Penjaga sesi dipanggil lebih dahulu, sebelum satu byte pun berkas
 * disentuh: permintaan tanpa sesi berhenti di sini. Server Action bukan
 * endpoint tersembunyi — alamat dan ID-nya ada di HTML halaman — jadi
 * memeriksa di layout saja tidak cukup, layout tidak ikut berjalan untuk
 * pemanggilan action.
 */
export async function createBookAction(
  sebelumnya: StateFormBuku,
  data: FormData
): Promise<StateFormBuku> {
  await requireAdmin();

  const nilai = bacaNilai(data);
  const percobaan = sebelumnya.percobaan + 1;

  const hasil = await simpanBukuBaru(data);

  if (!hasil.ok) {
    // Yang dikembalikan adalah nilai yang baru saja diketik, bukan nilai
    // sebelumnya: React mereset form setiap action selesai, jadi `key` yang
    // berubah bersama `nilai` inilah yang mengembalikan isian ke layar.
    return {
      errors: hasil.errors,
      nilai,
      percobaan,
      ulangiSampul: hasil.errors.coverPath !== undefined || hasil.errors.form !== undefined,
    };
  }

  // Katalog publik dan daftar admin membaca database saat permintaan datang,
  // tetapi halaman beranda dan shell-nya bisa saja tersimpan di cache router
  // klien. Revalidasi keduanya supaya buku baru terlihat tanpa perlu reload
  // paksa, dan detail per-slug supaya tautan lamanya tidak menyajikan versi
  // lama bila slug itu pernah ada.
  revalidatePath("/admin/buku");
  revalidatePath("/katalog/[status]", "page");
  revalidatePath("/", "page");
  revalidatePath(`/buku/${hasil.book.slug}`, "page");

  redirect("/admin/buku");
}
