import { HeightField } from "./heightField";

/** Osobna funkcja pędzla – łatwo dodać warianty (noise, smuga, itp.). */
export function applyBrush(
  hf: HeightField,
  x: number,
  z: number,
  radius: number,
  strength: number,
  dir: 1 | -1
) {
  hf.brush(x, z, radius, strength, dir);
}
