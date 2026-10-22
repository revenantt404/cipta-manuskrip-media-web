import type { Metadata } from "next";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: { absolute: "Pratinjau Admin — Cipta Manuskrip Media" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: LayoutProps<"/admin/preview">) {
  return <AdminShell email="Mode demo" demo>{children}</AdminShell>;
}
