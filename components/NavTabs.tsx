"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Painel" },
  { href: "/remedios", label: "Remédios" },
  { href: "/exames", label: "Exames" },
  { href: "/historico", label: "Histórico" },
  { href: "/pendencias", label: "Pendências" },
];

export default function NavTabs() {
  const path = usePathname();
  return (
    <nav className="tabs" aria-label="Seções">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
