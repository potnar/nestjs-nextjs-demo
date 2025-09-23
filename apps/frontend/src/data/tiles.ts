export function makeTiles(locale: "pl" | "en", t: (key: string) => string) {
  return [
    { href: "/weight",        title: `⚖️ ${t("home.tiles.weight.title")}`,     description: t("home.tiles.weight.desc") },
    { href: "/interview-prep",title: `🎯 ${t("home.tiles.interview.title")}`,  description: t("home.tiles.interview.desc") },
  ];
}
