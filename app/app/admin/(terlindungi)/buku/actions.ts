"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { simpanBukuBaru, perbaruiBuku, hapusBuku, bacaTeks } from "@/lib/books/manage";
import type { NilaiFormBuku, StateFormBuku, StateHapusBuku } from "./form-state";

/**
 * Berkas ini hanya mengekspor fungsi async: `"use server"` menjadikan
 * setiap ekspor endpoint yang bisa dipanggil dari browser, dan ekspor nilai
 * biasa membuat build gagal. Karena itu tipe dan keadaan awal form tinggal
 * di `form-state.ts`.
 */

function bacaNilai(data: FormData): NilaiFormBuku {
  return {
    title: bacaTeks(data, "title"),
    slug: bacaTeks(data, "slug"),
    author: bacaTeks(data, "author"),
    synopsis: bacaTeks(data, "synopsis"),
    publisherInfo: bacaTeks(data, "publisherInfo"),
    bookInfo: bacaTeks(data, "bookInfo"),
    status: bacaTeks(data, "status"),
    estimatedRelease: bacaTeks(data, "estimatedRelease"),
  };
}

/**
 * Seluruh alamat yang isinya bergantung pada satu buku.
 *
 * Dijadikan satu fungsi karena setiap mutasi harus menyentuhnya, dan daftar
 * yang ditulis ulang di tiga tempat cepat atau lambat akan berbeda isinya.
 * Detail per-slug memakai argumen `"page"`: tanpa itu `revalidatePath`
 * menganggapnya path halaman statis dan tidak melakukan apa pun.
 */
function revalidasiBuku(slug: string): void {
  revalidatePath("/admin/buku");
  revalidatePath("/katalog/[status]", "page");
  revalidatePath("/", "page");
  revalidatePath(`/buku/${slug}`, "page");
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

  revalidasiBuku(hasil.book.slug);

  redirect("/admin/buku");
}

/**
 * Menyunting buku yang sudah ada.
 *
 * `id` diikat pada action lewat `bind` di halaman, bukan dibaca dari form:
 * nilai yang datang dari form bisa diubah siapa pun yang menyunting HTML,
 * dan id adalah penentu baris mana yang ditulis.
 *
 * Penjaga sesi tetap dipanggil di sini meski `id` sudah diikat — pengikatan
 * hanya menyembunyikan nilainya dari tampilan, bukan menjadikan pemanggilan
 * action ini mustahil dilakukan tanpa halaman.
 */
export async function updateBookAction(
  id: string,
  sebelumnya: StateFormBuku,
  data: FormData
): Promise<StateFormBuku> {
  await requireAdmin();

  const nilai = bacaNilai(data);
  const percobaan = sebelumnya.percobaan + 1;

  const hasil = await perbaruiBuku(id, data);

  if (!hasil.ok) {
    return {
      errors: hasil.errors,
      nilai,
      percobaan,
      ulangiSampul: hasil.errors.coverPath !== undefined || hasil.errors.form !== undefined,
    };
  }

  // Alamat lama dan baru sama-sama diinvalidasi: brief §8 menuntut slug lama
  // tidak lagi menyajikan buku ini sebagai halaman yang masih hidup.
  revalidasiBuku(hasil.slugLama);
  if (hasil.book.slug !== hasil.slugLama) {
    revalidasiBuku(hasil.book.slug);
  }

  redirect("/admin/buku");
}

/**
 * Menghapus buku.
 *
 * Sampul ikut dibersihkan oleh lapisan `hapusBuku`; di sini yang tersisa
 * hanya kewajiban memberi tahu cache bahwa halaman-halaman itu sudah tidak
 * berisi apa-apa.
 */
export async function deleteBookAction(
  id: string,
  sebelumnya: StateHapusBuku,
  // `useActionState` selalu mengirim `(state, formData)`; parameter ini harus
  // ada agar `formData` tidak masuk ke posisi `sebelumnya`. Isinya tidak
  // dipakai: penghapusan hanya butuh id yang sudah terikat di server.
  _data: FormData
): Promise<StateHapusBuku> {
  await requireAdmin();

  const percobaan = sebelumnya.percobaan + 1;
  const hasil = await hapusBuku(id);

  if (!hasil.ok) {
    return { errors: hasil.errors, percobaan };
  }

  revalidasiBuku(hasil.book.slug);

  redirect("/admin/buku");
}
