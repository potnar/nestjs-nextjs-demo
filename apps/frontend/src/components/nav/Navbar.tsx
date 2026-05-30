"use client";

import { useEffect, useState } from "react";
import { usePathname, Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import LocaleSwitcher from "./LocaleSwitcher";

type NavLink = {
  href: string;
  labelPL: string;
  labelEN: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const locale = useLocale() as "pl" | "en";
  const [open, setOpen] = useState(false);

  // Zamknij menu po każdej zmianie trasy
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links: NavLink[] = [
    { href: "/", labelPL: "Hub", labelEN: "Hub" },
    { href: "/3d-hub", labelPL: "3D Hub 🌌", labelEN: "3D Hub 🌌" },
    { href: "/threejs", labelPL: "3D Lab", labelEN: "3D Lab" },
    { href: "/typescript/faq", labelPL: "TS FAQ", labelEN: "TS FAQ" },
  ];

  const labLinks: NavLink[] = [
    { href: "/login-sso", labelPL: "SSO (PKCE)", labelEN: "SSO (PKCE)" },
    { href: "/tree-demo", labelPL: "Rekursja", labelEN: "Recursion" },
    { href: "/filesystem", labelPL: "System plików", labelEN: "Filesystem" },
    { href: "/web-storage", labelPL: "Storage", labelEN: "Storage" },
    {
      href: "/abortable-search",
      labelPL: "Abort (Search)",
      labelEN: "Abort (Search)",
    },
    { href: "/form-example", labelPL: "Formularz", labelEN: "Form" },
  ];

  const isActive = (href: string) => pathname === (href === "/" ? "/" : href);

  return (
    <header
      className="sticky top-0 z-50"
      style={{ borderBottom: "2px solid var(--sand-muted)", background: "transparent" }}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-sm font-semibold tracking-widest uppercase" style={{ color: "var(--sand)" }}>
          DevLab
        </Link>

        <ul className="hidden gap-8 md:flex items-center">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-xs tracking-widest uppercase transition-opacity hover:opacity-60"
                style={{
                  color: "var(--sand)",
                  opacity: isActive(l.href) ? 1 : 0.7,
                  borderBottom: isActive(l.href) ? "1px solid var(--sand)" : "none",
                  paddingBottom: "2px",
                }}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {locale === "en" ? l.labelEN : l.labelPL}
              </Link>
            </li>
          ))}

          <li className="relative group">
            <button
              className="text-xs tracking-widest uppercase flex items-center gap-1 transition-opacity hover:opacity-60"
              style={{ color: "var(--sand)", opacity: 0.7 }}
            >
              {locale === "en" ? "More" : "Więcej"}
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-180">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div
              className="absolute right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1"
              style={{ background: "rgba(10,10,18,0.95)", border: "1px solid var(--card-glass-border)", borderRadius: "4px" }}
            >
              {labLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block px-4 py-2 text-xs tracking-wider uppercase transition-opacity hover:opacity-60"
                  style={{ color: "var(--sand)", opacity: isActive(l.href) ? 1 : 0.7 }}
                >
                  {locale === "en" ? l.labelEN : l.labelPL}
                </Link>
              ))}
            </div>
          </li>
        </ul>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <button
            type="button"
            className="md:hidden relative inline-flex h-10 w-10 items-center justify-center transition"
            style={{ color: "var(--sand)" }}
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-5 w-6">
              <span className={["absolute left-0 top-0 h-[2px] w-6 bg-current transition-transform duration-300", open ? "translate-y-[10px] rotate-45" : ""].join(" ")} />
              <span className={["absolute left-0 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-current transition-all duration-300", open ? "opacity-0 scale-x-0" : ""].join(" ")} />
              <span className={["absolute left-0 bottom-0 h-[2px] w-6 bg-current transition-transform duration-300", open ? "-translate-y-[10px] -rotate-45" : ""].join(" ")} />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={["md:hidden overflow-hidden transition-[max-height,opacity] duration-300", open ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"].join(" ")}
        style={{ borderTop: "1px solid var(--card-glass-border)" }}
      >
        <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-3">
          {[...links, ...labLinks].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block px-3 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-60"
                style={{ color: "var(--sand)", opacity: isActive(l.href) ? 1 : 0.7 }}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {locale === "en" ? l.labelEN : l.labelPL}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
