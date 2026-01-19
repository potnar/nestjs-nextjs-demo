"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import LiveNestingBuilder from "@/components/recursion/LiveNestingBuilder";

export default function TreeDemoPage() {
  const locale = useLocale() as "pl" | "en";
  const t = useTranslations("recursion");

  return (
    <div key={locale} className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href="/"
          className="text-sm underline decoration-dotted hover:opacity-80"
        >
          {t("back")}
        </Link>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300">{t("lead")}</p>

      <LiveNestingBuilder
        labels={{
          newTree: t("actions.newTree"),
          expandRoot: t("actions.expandRoot"),
          expandAll: t("actions.expandAll"),
          collapseAll: t("actions.collapseAll"),
          traversalMode: t("traversal.mode"),
          preorder: t("traversal.preorder"),
          postorder: t("traversal.postorder"),
          bfs: t("traversal.bfs"),
          start: t("controls.start"),
          pause: t("controls.pause"),
          step: t("controls.step"),
          reset: t("controls.reset"),
          whatIsHappening: t("explain.title"),
          callStack: t("explain.stack"),
          structure: t("structure.title"),
          dirs: t("structure.dirs"),
          files: t("structure.files"),
        }}
      />
    </div>
  );
}
