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
    { href: "/",               labelPL: "Strona główna", labelEN: "Home" },
    { href: "/interview-prep", labelPL: "Przygotowanie", labelEN: "Interview prep" },
    { href: "/weight",         labelPL: "Waga",          labelEN: "Weight" },
  ];

  const isActive = (href: string) =>
    pathname === (href === "/" ? "/" : href);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: logo */}
        <Link href="/" className="font-semibold">
          DevLab
        </Link>

        {/* Desktop: links */}
        <ul className="hidden gap-6 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`text-sm transition hover:opacity-80 ${
                  isActive(l.href)
                    ? "font-medium underline underline-offset-4"
                    : ""
                }`}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {locale === "en" ? l.labelEN : l.labelPL}
              </Link>
            </li>
          ))}
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
                  open ? "translate-y-[10px] rotate-45" : "translate-y-0 rotate-0",
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
                  open ? "-translate-y-[10px] -rotate-45" : "translate-y-0 rotate-0",
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
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isActive(l.href) ? "font-medium underline underline-offset-4" : ""
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
