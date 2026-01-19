// src/app/page.tsx
"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { makeTiles } from "@/data/interviewTiles";

export default function HomePage() {
  const locale = useLocale() as "pl" | "en";
  const t = useTranslations();
  const tiles = makeTiles(locale, (k) => t(k));

  return (
    <div
      key={locale}
      className="p-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
    >
      <div className="col-span-full">
        <h1 className="text-2xl font-bold">DevLab Hub</h1>
      </div>
      {tiles.map(({ href, title, description }) => (
        <Link
          key={href}
          href={href}
          className="p-6 rounded-xl shadow-lg border hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <h2 className="text-lg font-bold mb-2">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </Link>
      ))}
    </div>
  );
}
