"use client";

import React, {useEffect, useId, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {CircleHelp} from "lucide-react";
import clsx from "clsx";

type Side = "top" | "right" | "bottom" | "left";

export type HelpTipProps = {
  /** Klucz i18n. Jeśli brak – użyje `content`. */
  tKey?: string;
  /** Treść tooltipa, gdy nie używasz i18n. */
  content?: React.ReactNode;
  /** 'hover' (dla asChild) lub 'click' (dla ikonki). */
  trigger?: "hover" | "click";
  /** Pozycja względem elementu. */
  side?: Side;
  /** Owiń istniejący element (hover) czy renderuj ikonkę „?” (click). */
  asChild?: boolean;
  /** Dodatkowe klasy kontenera. */
  className?: string;
  /** Dziecko do owinięcia, jeśli `asChild` = true. */
  children?: React.ReactNode;
  /** Opcjonalny tytuł przy ikonce (aria-label). */
  label?: string;
};

export default function HelpTip({
  tKey,
  content,
  trigger = "click",
  side = "top",
  asChild = false,
  className,
  children,
  label,
}: HelpTipProps) {
  const t = useTranslations();
  const text = tKey ? t(tKey as any) : content;
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLSpanElement | null>(null);

  // zamykanie po kliknięciu poza oraz po ESC
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // klasa pozycjonowania + strzałka
  const pos = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  }[side];

  const arrowPos = {
    top: "top-full left-1/2 -translate-x-1/2",
    right: "right-full top-1/2 -translate-y-1/2",
    bottom: "bottom-full left-1/2 -translate-x-1/2",
    left: "left-full top-1/2 -translate-y-1/2",
  }[side];

  // if asChild -> hover
  if (asChild) {
    return (
      <span
        ref={rootRef}
        className={clsx("relative inline-block", className)}
        onMouseEnter={() => trigger === "hover" && setOpen(true)}
        onMouseLeave={() => trigger === "hover" && setOpen(false)}
        onFocus={() => trigger === "hover" && setOpen(true)}
        onBlur={() => trigger === "hover" && setOpen(false)}
        aria-describedby={open ? id : undefined}
      >
        {children}
        {open && text && (
          <div
            id={id}
            role="tooltip"
            className={clsx(
              "absolute z-50 max-w-xs rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg",
              "animate-in fade-in zoom-in-95",
              pos
            )}
          >
            {text}
            <span
              className={clsx(
                "absolute h-2 w-2 rotate-45 bg-gray-900",
                arrowPos
              )}
            />
          </div>
        )}
      </span>
    );
  }

  // else: icon-trigger („?”) on click
  return (
    <span ref={rootRef} className={clsx("relative inline-flex", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label || (typeof text === "string" ? text : "Help")}
        className={clsx(
          "inline-flex items-center justify-center rounded-full",
          "w-5 h-5 text-[11px] bg-gray-200 text-gray-800",
          "hover:bg-gray-300 active:scale-95 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp className="w-3.5 h-3.5" aria-hidden />
      </button>

      {open && text && (
        <div
          id={id}
          role="tooltip"
          className={clsx(
            "absolute z-50 max-w-xs rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg",
            "animate-in fade-in zoom-in-95",
            pos
          )}
        >
          {text}
          <span className={clsx("absolute h-2 w-2 rotate-45 bg-gray-900", arrowPos)} />
        </div>
      )}
    </span>
  );
}
