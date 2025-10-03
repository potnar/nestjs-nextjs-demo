export type ExampleKey = "minimal" | "raycast" | "shader" | "instanced" | "LOD";

export const EXAMPLE_LABELS: Record<ExampleKey, string> = {
  minimal:   "Minimal: PBR + OrbitControls",
  raycast:   "Interakcja: Raycasting",
  shader:    "Shader: animowany gradient",
  instanced: "InstancedMesh: many objects",
  LOD:       "LOD: levels of detail"
};
