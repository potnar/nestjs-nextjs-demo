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
    { href: "/threejs", labelPL: "3D Lab", labelEN: "3D Lab" },
    { href: "/typescript/faq", labelPL: "TS FAQ", labelEN: "TS FAQ" },
    { href: "/weight", labelPL: "Waga", labelEN: "Weight" },
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
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: logo */}
        <Link href="/" className="font-semibold">
          DevLab
        </Link>

        {/* Desktop: links */}
        <ul className="hidden gap-6 md:flex items-center">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`text-sm transition hover:opacity-80 ${
                  isActive(l.href)
                    ? "font-medium text-sky-500 underline underline-offset-4"
                    : "text-muted-foreground"
                }`}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {locale === "en" ? l.labelEN : l.labelPL}
              </Link>
            </li>
          ))}

          {/* Labs Dropdown for Desktop */}
          <li className="relative group">
            <button className="text-sm font-medium text-muted-foreground hover:opacity-80 flex items-center gap-1 cursor-default py-2">
              {locale === "en" ? "More Labs" : "Więcej Labów"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:rotate-180"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div className="absolute right-0 mt-0 w-48 rounded-md shadow-lg bg-white dark:bg-slate-900 border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
              {labLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`block px-4 py-2 text-xs transition hover:bg-muted ${
                    isActive(l.href)
                      ? "bg-muted font-medium text-sky-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {locale === "en" ? l.labelEN : l.labelPL}
                </Link>
              ))}
            </div>
          </li>
        </ul>

        {/* Right: locale switcher + burger */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />

          {/* Mobile burger (animowany) */}
          <button
            type="button"
            className="md:hidden relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-5 w-6">
              {/* górna kreska */}
              <span
                className={[
                  "absolute left-0 top-0 h-[2px] w-6 bg-current",
                  "transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
                  open
                    ? "translate-y-[10px] rotate-45"
                    : "translate-y-0 rotate-0",
                ].join(" ")}
              />
              {/* środkowa kreska */}
              <span
                className={[
                  "absolute left-0 top-1/2 h-[2px] w-6 -translate-y-1/2 bg-current",
                  "transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
                  open ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100",
                ].join(" ")}
              />
              {/* dolna kreska */}
              <span
                className={[
                  "absolute left-0 bottom-0 h-[2px] w-6 bg-current",
                  "transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
                  open
                    ? "-translate-y-[10px] -rotate-45"
                    : "translate-y-0 rotate-0",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile menu panel — ładne rozwijanie wysokości + fade */}
      <div
        id="mobile-menu"
        className={[
          "md:hidden border-t overflow-hidden",
          "transition-[max-height,opacity] duration-300 ease-[cubic-bezier(.4,0,.2,1)]",
          open ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          {[...links, ...labLinks].map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isActive(l.href)
                    ? "font-medium text-sky-500 bg-sky-500/5 shadow-sm"
                    : "text-muted-foreground"
                }`}
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
