import Link from "next/link";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-shell">
      <header className="glass-bar">
        <Link href="/dashboard" className="font-bold">EcoStream</Link>
        <span className="font-mono text-xs">Entorno simulado</span>
      </header>
      <nav aria-label="Dashboard" className="flex flex-wrap gap-6 py-6">
        <Link href="/dashboard/cumplimiento">Cumplimiento</Link>
        <Link href="/dashboard/decision">Matriz de decisión</Link>
        <Link href="/dashboard/mercado">TAM / SAM</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
