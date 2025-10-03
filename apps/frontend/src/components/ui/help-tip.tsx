"use client";

import { useTranslations } from "next-intl";
import { ReactNode, HTMLAttributes } from "react";

type HelpTipProps = {
  /** Klucz do tłumaczenia, np. "tooltips.mode_instanced" */
  tKey: string;
  /** Ikonka / zawartość w kółeczku; domyślnie „i” */
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, "title">;

export default function HelpTip({
  tKey,
  children,
  className,
  ...rest
}: HelpTipProps) {
  const t = useTranslations();
  const text = t(tKey);

  return (
    <span
      {...rest}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs leading-none select-none
      bg-white/60 dark:bg-black/30 border-gray-300 dark:border-gray-700
      hover:bg-white/80 dark:hover:bg-black/50 transition ${className ?? ""}`}
      title={text}
      aria-label={text}
      role="img"
    >
      {children ?? "i"}
    </span>
  );
}
