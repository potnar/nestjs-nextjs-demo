export interface Tile {
    href: string;
    title: string;
    description: string;
  }
  
  export const tiles: Tile[] = [
    {
      href: "/interview-prep/tree-demo",
      title: "🧠 Rekursja vs Iteracja",
      description: "Porównanie renderowania drzewa folderów",
    },
    {
      href: "/interview-prep/filesystem",
      title: "📁 Struktura folderów",
      description: "Generuj i przeglądaj strukturę plików",
    },
    {
        href: "/interview-prep/threejs",
        title: "🌀 Three.js – przykłady",
        description: "Eksperymentuj z grafiką 3D i interakcjami w przeglądarce",
      }
      
  ];
  