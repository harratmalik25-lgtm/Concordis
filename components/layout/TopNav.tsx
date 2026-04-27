"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Research",  href: "/" },
  { label: "Library",   href: "/sources" },
  { label: "History",   href: "/history" },
  { label: "Settings",  href: "/settings" },
];

export function TopNav() {
  const path = usePathname();
  const active = LINKS.find(l => l.href === path)?.label ?? "Research";

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16"
      style={{ background:"rgba(5,20,36,0.7)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
      <Link href="/" className="text-2xl font-bold tracking-tighter neon-text-glow" style={{ fontFamily:"Space Grotesk", color:"var(--color-primary,#00f0ff)", textDecoration:"none" }}>
        Concordis
      </Link>
      <nav className="hidden md:flex gap-8">
        {LINKS.map(l => (
          <Link key={l.label} href={l.href}
            className={`text-sm uppercase tracking-widest pb-1 transition-all duration-200`}
            style={{
              fontFamily: "Space Grotesk",
              textDecoration: "none",
              color: active === l.label ? "var(--color-primary,#00f0ff)" : "#64748b",
              borderBottom: active === l.label ? "2px solid var(--color-primary,#00f0ff)" : "2px solid transparent",
            }}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="flex gap-3" style={{ color:"var(--color-primary,#00f0ff)" }}>
        <Link href="/settings" style={{ display:"flex", alignItems:"center", padding:"8px", borderRadius:"999px", transition:"all 0.2s", textDecoration:"none", color:"inherit" }}
          className="hover:bg-white/5">
          <span className="material-symbols-outlined" style={{ fontSize:"22px" }}>settings</span>
        </Link>
        <button className="hover:bg-white/5 p-2 rounded-full transition-all">
          <span className="material-symbols-outlined" style={{ fontSize:"22px" }}>account_circle</span>
        </button>
      </div>
    </header>
  );
}
