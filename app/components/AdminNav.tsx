"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Plus } from "lucide-react";

const NAV_REAL = [
  { label: "Ringkasan", href: "/admin", icon: LayoutDashboard },
  { label: "Kelola Buku", href: "/admin/buku", icon: BookOpen },
  { label: "Tambah Buku", href: "/admin/buku/tambah", icon: Plus },
] as const;
const NAV_DEMO = [
  { label: "Ringkasan", href: "/admin/preview", icon: LayoutDashboard },
  { label: "Kelola Buku", href: "/admin/preview/buku", icon: BookOpen },
  { label: "Tambah Buku", href: "/admin/preview/buku/tambah", icon: Plus },
] as const;

export function AdminNav({ demo = false }: { demo?: boolean }) {
  const pathname = usePathname() ?? "";
  const items = demo ? NAV_DEMO : NAV_REAL;

  return (
    <nav className="admin-nav" aria-label="Navigasi panel admin">
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (label === "Kelola Buku" && pathname.startsWith(`${href}/`));
        return (
          <Link key={href} href={href} className={`admin-nav-link${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
