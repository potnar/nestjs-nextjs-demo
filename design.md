# Design Notes

## Three.js Lab (`/pl/threejs`)

### Kierunek designu — wybrany: **Slate Dark**

| Token | Wartość |
|---|---|
| Background | `#0f172a` (slate-900) |
| Accent | `#38bdf8` (sky-400) |
| Secondary | `#818cf8` (indigo-400) |
| Text | `#cbd5e1` (slate-300) |

- Glassmorphism: **subtelny** — lekkie frosted glass, UI nie przesłania Three.js
- Navbar: **solid dark** — pełne ciemne tło, wyraźne oddzielenie

### Status
- [x] CSS variables — paleta Slate Dark
- [x] Wymuszony dark mode (`dark` class na `<html>`)
- [x] Navbar — solid dark background (`bg-slate-900`)
- [ ] Karty/panele — subtelny backdrop-blur z minimalnym border

### Feedback
- Design "lepszy niż poprzedni, ale ogólnie nie podoba się" — wymaga gruntownego przeprojektowania
- Tymczasowo zaakceptowany jako baza

---

## Docelowy redesign — wizja

**Inspiracja:** https://www.cartier.com/en-fr/watchesandwonders#/ (płynne, luksusowe przejścia)

### Paleta
| Token | Wartość |
|---|---|
| Akcent / tekst / bordery | kolor piasku (~`#C9B896`) |
| Tło kart | `rgba(255,255,255,0.08)` (półprzezroczysty biały) |
| Border-radius | `4px` wszędzie |

### Navbar
- Tło: przezroczyste
- Border-bottom: `2px solid` w kolorze piasku
- Czcionka: kolor piasku
- Styl: minimalistyczny, luksusowy

### Layout

**Zakładka /threejs (Three.js Lab):**
- Przykład zajmuje całą przestrzeń (fullscreen canvas)
- Z prawej: minimalistyczny panel z kontrolkami, `border-radius: 4px`, półprzezroczysty biały, sand border
- Z lewej: overlay drawer — ukryty, otwierany przyciskiem, lista wszystkich przykładów
- Górny navbar: przezroczysty + sand border-bottom 2px

**Inne podstrony (Hub, TS FAQ itp.):**
- Lewitująca karta na tle gwiazd (Three.js) + woda z falami (Three.js shader) pod kartą
- Karta: `border-radius: 4px`, `rgba(255,255,255,0.08)`, sand border

### Nawigacja
- **Lewy overlay drawer:** przycisk z lewej → pełna lista przykładów Three.js
- **Górny navbar:** linki do głównych podstron; transparent bg, sand border-bottom 2px

### Przejścia
- Płynne, filmowe — wzorowane na Cartier (fade + slide lub morph)
- `AnimatePresence` z dłuższym `duration` i easing

### Do zrobienia
- [ ] Zdefiniować sand color token w CSS
- [ ] Przeprojektować Navbar (transparent + sand border-bottom)
- [ ] Stworzyć układ 2D: stars bg + water ripple + floating card
- [ ] Stworzyć układ 3D: fullscreen canvas + prawy panel kontrolny
- [ ] Lewy drawer/dropdown nawigacja między przykładami
- [ ] Zaimplementować płynne przejścia między przykładami
- [ ] Ujednolicić border-radius na 4px

