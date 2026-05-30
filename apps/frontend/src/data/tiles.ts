export function makeTiles(locale: "pl" | "en", t: (key: string) => string) {
  return [
    { href: "/interview-prep",title: `🎯 ${t("home.tiles.interview.title")}`,  description: t("home.tiles.interview.desc") },
  ];
}
