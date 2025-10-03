"use client";
import {useLocale} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname(); // bez prefiksu /pl|/en
  const next = (useLocale() === "en" ? "en" : "pl") as "en" | "pl";

  return (
    <button
      className="rounded-md border px-3 py-1 text-sm"
      onClick={() => router.replace(pathname, {locale: next})}
    >
      {next.toUpperCase()}
    </button>
  );
}
