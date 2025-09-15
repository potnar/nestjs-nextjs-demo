export function makeTiles(locale: "pl" | "en", t: (key: string) => string) {
  return [
    { href: "/weight",        title: `⚖️ ${t("tiles.weight.title")}`,     description: t("tiles.weight.desc") },
    { href: "/interview-prep",title: `🎯 ${t("tiles.interview.title")}`,  description: t("tiles.interview.desc") },
  ];
}
