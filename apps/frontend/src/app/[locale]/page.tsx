// src/app/page.tsx
"use client";

import {Link} from "@/i18n/navigation"; 
import {useLocale, useTranslations} from "next-intl";
import {makeTiles} from "@/data/tiles";
import {usePathname} from "@/i18n/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const locale = useLocale() as "pl" | "en";
  const t = useTranslations();
  const tiles = makeTiles(locale, (k) => t(k));
  const pathname = usePathname();

  useEffect(() => {
    console.log("[HomePage] render →", { locale, pathname, sample: t("home.version", {ver: "0.2"}) });
    console.log("TILS: ", tiles)
  }, [locale, pathname, t]);

  return (
    <div key={locale} className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <div className="col-span-full">
        <h1 className="text-2xl font-bold">{t("home.version", {ver: "0.2"})}</h1>
      </div>
      <div className="text-xs opacity-60">
        DEBUG: {t("tiles.interview.title")}
      </div>
      {tiles.map(({href, title, description}) => (
        <Link key={href} href={href} className="p-6 rounded-xl shadow-lg border hover:bg-gray-100 transition">
          <h2 className="text-lg font-bold mb-2">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </Link>
      ))}
    </div>
  );
}
