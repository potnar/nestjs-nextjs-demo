export function makeTiles(locale: "pl" | "en", t: (key: string) => string) {
  return [
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
      href: "/interview-prep/threejs",
      title: `🌀 ${t("interview-prep.three.title")}`,
      description: t("interview-prep.three.desc"),
    },
  ];
}
