// // src/components/nav/Navbar.tsx
// "use client";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useState } from "react";
// import { useLocale } from "next-intl";
// import LocaleSwitcher from "./LocaleSwitcher";
// import { withLocalePrefix } from "./urlHelpers";

// export default function Navbar() {
//   const pathname = usePathname();
//   const locale = useLocale() as "pl" | "en";
//   const [open, setOpen] = useState(false);

//   const links = [
//     { href: "/",               labelPL: "Strona główna", labelEN: "Home" },
//     { href: "/interview-prep", labelPL: "Przygotowanie", labelEN: "Interview prep" },
//     { href: "/weight",         labelPL: "Waga",          labelEN: "Weight" },
//   ];

//   return (
//     <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
//       <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
//         <Link href={withLocalePrefix("/", locale)} className="font-semibold">
//           DevLab
//         </Link>

//         <ul className="hidden gap-6 md:flex">
//           {links.map((l) => {
//             const href = withLocalePrefix(l.href, locale);
//             const active = pathname === href;
//             return (
//               <li key={l.href}>
//                 <Link
//                   href={href}
//                   className={`text-sm transition hover:opacity-80 ${active ? "font-medium underline underline-offset-4" : ""}`}
//                 >
//                   {locale === "en" ? l.labelEN : l.labelPL}
//                 </Link>
//               </li>
//             );
//           })}
//         </ul>

//         <div className="flex items-center gap-3">
//           <LocaleSwitcher />
//           <button
//             className="md:hidden rounded-md border px-2 py-1 text-sm"
//             onClick={() => setOpen((v) => !v)}
//             aria-expanded={open}
//             aria-controls="mobile-menu"
//           >
//             Menu
//           </button>
//         </div>
//       </nav>

//       {open && (
//         <div id="mobile-menu" className="border-t md:hidden">
//           <ul className="mx-auto max-w-6xl px-4 py-2 space-y-2">
//             {links.map((l) => (
//               <li key={l.href}>
//                 <Link
//                   href={withLocalePrefix(l.href, locale)}
//                   className="block rounded-md px-2 py-2 text-sm hover:bg-muted"
//                   onClick={() => setOpen(false)}
//                 >
//                   {locale === "en" ? l.labelEN : l.labelPL}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </header>
//   );
// }
"use client";
import {usePathname} from "@/i18n/navigation";
import {Link} from "@/i18n/navigation";
import {useLocale} from "next-intl";
import {useState} from "react";
import LocaleSwitcher from "./LocaleSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const locale = useLocale() as "pl" | "en";
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/",               labelPL: "Strona główna", labelEN: "Home" },
    { href: "/interview-prep", labelPL: "Przygotowanie", labelEN: "Interview prep" },
    { href: "/weight",         labelPL: "Waga",          labelEN: "Weight" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">DevLab</Link>

        <ul className="hidden gap-6 md:flex">
          {links.map((l) => {
            const active = pathname === (l.href === "/" ? "/" : l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`text-sm transition hover:opacity-80 ${active ? "font-medium underline underline-offset-4" : ""}`}
                >
                  {locale === "en" ? l.labelEN : l.labelPL}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
        <LocaleSwitcher />
        </div>
      </nav>
      {/* …mobile menu analogicznie z <Link> z i18n/navigation */}
    </header>
  );
}
