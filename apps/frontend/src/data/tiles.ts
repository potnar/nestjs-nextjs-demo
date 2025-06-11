export interface Tile {
  href: string;
  title: string;
  description: string;
}

export const tiles: Tile[] = [
  {
    href: "/tree-demo",
    title: "🧠 Rekursja vs Iteracja",
    description: "Porównanie renderowania drzewa folderów",
  },
  {
    href: "/filesystem",
    title: "📁 Struktura folderów",
    description: "Generuj i przeglądaj strukturę plików",
  },
  {
    href: "/weight",
    title: "⚖️ Monitorowanie wagi",
    description: "Zapisuj wagę i śledź wykres",
  },
];
