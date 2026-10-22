import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, LogOut } from "lucide-react";
import { AdminNav } from "./AdminNav";
import { logoutAction } from "@/app/admin/actions";

export function AdminShell({
  children,
  email,
  demo = false,
}: {
  children: ReactNode;
  email: string;
  demo?: boolean;
}) {
  const initial = email.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className={`admin-shell${demo ? " admin-shell-demo" : ""}`}>
      <aside className="admin-sidebar">
        <Link href={demo ? "/admin/preview" : "/admin"} className="admin-brand" aria-label="Panel Cipta Manuskrip Media">
          {/* eslint-disable-next-line @next/next/no-img-element -- local brand mark */}
          <img src="/logo-cmm-trim.png" alt="" />
          <span><strong>CIPTA</strong><small>MANUSKRIP MEDIA</small></span>
        </Link>

        {demo ? <div className="admin-demo-badge"><span /> MODE PRATINJAU</div> : <p className="admin-sidebar-caption">RUANG KERJA</p>}
        <AdminNav demo={demo} />

        <div className="admin-sidebar-bottom">
          <div className="admin-user-avatar" aria-hidden="true">{initial}</div>
          <div className="admin-user-details"><strong>{demo ? "Pratinjau Admin" : email}</strong><small>{demo ? "Data simulasi · tidak tersimpan" : "Administrator"}</small></div>
          {demo ? (
            <Link href="/admin/login" className="admin-logout" aria-label="Kembali ke login"><LogOut size={16} /></Link>
          ) : (
            <form action={logoutAction}>
              <button type="submit" className="admin-logout" aria-label="Keluar"><LogOut size={16} /></button>
            </form>
          )}
        </div>
      </aside>

      <div className="admin-main-column">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>Workspace</span><i>/</i><strong>{demo ? "Pratinjau" : "Panel Admin"}</strong></div>
          <Link href="/" className="admin-view-site">Lihat situs <ArrowUpRight size={14} /></Link>
        </header>
        {demo ? <div className="admin-preview-banner"><span>PRATINJAU</span> Data pada halaman ini hanya contoh dan tidak tersimpan ke database.</div> : null}
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
