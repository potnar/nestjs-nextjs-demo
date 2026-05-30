export type ExampleKey =
  | "projectHub"
  | "minimal"
  | "raycast"
  | "shader"
  | "instanced"
  | "LOD"
  | "brushripple"
  | "gaussianSplat"
  | "converter"
  | "minecraft"
  | "pathfinding"
  | "iotRoom"
  | "galaxy"
  | "spaceHub";

export const EXAMPLE_LABELS: Record<ExampleKey, string> = {
  projectHub:   "3D Project Hub: portfolio / systemy",
  minimal:      "Minimal: PBR + OrbitControls",
  raycast:      "Interakcja: Raycasting",
  shader:       "Shader: animowany gradient",
  instanced:    "InstancedMesh: many objects",
  LOD:          "LOD: levels of detail",
  brushripple:  "Brush & Ripple: interactive ripple effect",
  gaussianSplat: "Gaussian Splat: point-cloud (NeRF-like)",
  converter:    "3D Viewer & Converter (client-only)",
  minecraft:    "Minecraft-like dude: walking animation",
  pathfinding:  "Minecraft pathfinding (A*)",
  iotRoom:      "IoT room: 3D mapa infrastruktury",
  galaxy:       "Galaktyka: Generator cząsteczek",
  spaceHub:     "Space Hub: interaktywny wybór",
};
