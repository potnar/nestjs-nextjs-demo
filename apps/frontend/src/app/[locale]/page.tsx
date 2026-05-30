"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { makeTiles } from "@/data/interviewTiles";

const HubScene = dynamic(() => import("@/components/HubScene"), { ssr: false });

export default function HomePage() {
  const locale = useLocale() as "pl" | "en";
  const t = useTranslations();
  const tiles = makeTiles(locale, (k) => t(k));

  return <HubScene tiles={tiles} />;
}
