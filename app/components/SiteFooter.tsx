import Link from "next/link";
import { TAUTAN_LAYANAN } from "@/content/site";

/**
 * Footer situs publik — komponen presentasi murni, sinkron.
 *
 * Nama perusahaan dan tautan layanan bersumber dari brief §10; tanpa NIB,
 * NPWP, alamat, surel, atau tautan sosial apa pun karena semuanya
 * menunggu materi klien (brief §3).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-garis bg-latar-alt">
      <div className="mx-auto max-w-5xl p-6 text-sm">
        <p className="font-medium text-teks">CV Cipta Manuskrip Media</p>

        <nav aria-label="Tautan layanan" className="mt-2 flex flex-wrap gap-4">
          {TAUTAN_LAYANAN.map((tautan) => (
            <Link
              key={tautan.href}
              href={tautan.href}
              className="text-teks-sec hover:underline"
            >
              {tautan.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
