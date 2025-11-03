export function makeTiles(locale: "pl" | "en", t: (key: string) => string) {
  return [
    {
      href: "/interview-prep/login-sso",
      title: `🔐 ${t("interview-prep.sso.title") || "SSO Login Flow"}`,
      description:
        t("interview-prep.sso.desc") ||
        "Authorization Code + PKCE krok po kroku.",
    },
    {
      href: "/interview-prep/tree-demo",
      title: `🧠 ${t("interview-prep.recursion.title")}`,
      description: t("interview-prep.recursion.desc"),
    },
    {
      href: "/interview-prep/filesystem",
      title: `📁 ${t("interview-prep.filesystem.title")}`,
      description: t("interview-prep.filesystem.desc"),
    },
    {
      href: "/interview-prep/web-storage",
      title: `🍪 ${t("interview-prep.storage.title") || "Storage & Cookies"}`,
      description:
        t("interview-prep.storage.desc") ||
        "Hands-on: localStorage vs sessionStorage vs cookies",
    },
    {
      href: "/interview-prep/threejs",
      title: `🌀 ${t("interview-prep.three.title")}`,
      description: t("interview-prep.three.desc"),
    },
    {
      href: "/typescript/faq", // albo "/interview-prep/typescript-faq"
      title: `📘 ${
        t("interview-prep.ts-faq.title") ||
        (locale === "pl" ? "TypeScript – FAQ" : "TypeScript – FAQ")
      }`,
      description:
        t("interview-prep.ts-faq.desc") ||
        (locale === "pl"
          ? "Najczęściej zadawane pytania z przykładami."
          : "Most common questions with examples."),
    },
    {
      href: "/interview-prep/abortable-search",
      title: `⏹️ ${
        t("interview-prep.abort.title") ||
        (locale === "pl"
          ? "Anulowanie zapytań (AbortController)"
          : "Abortable Fetch (AbortController)")
      }`,
      description:
        t("interview-prep.abort.desc") ||
        (locale === "pl"
          ? "Demo: debounce, anulowanie fetch i przycisk Stop."
          : "Demo: debounce, fetch cancellation and a Stop button."),
    },
    {
      href: "/interview-prep/form-example",
      title: `💬 ${t("interview-prep.form.title")}`,
      description: t("interview-prep.form.desc"),
    },
  ];
}
