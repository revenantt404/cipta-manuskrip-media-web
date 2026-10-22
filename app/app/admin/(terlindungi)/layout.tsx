import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/guard";
import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Layout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
