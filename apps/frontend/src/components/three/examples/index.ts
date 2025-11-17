export type ExampleKey = "minimal" | "raycast" | "shader" | "instanced" | "LOD" | "brushripple" | "gaussianSplatDemo" | "modelConvertViewer" | "minecraftDudeExample";;

export const EXAMPLE_LABELS: Record<ExampleKey, string> = {
  minimal:   "Minimal: PBR + OrbitControls",
  raycast:   "Interakcja: Raycasting",
  shader:    "Shader: animowany gradient",
  instanced: "InstancedMesh: many objects",
  LOD:       "LOD: levels of detail",
  brushripple: "Brush & Ripple: interactive ripple effect",
  gaussianSplatDemo: "Gaussian Splat: point-cloud (NeRF-like)",
  modelConvertViewer: "3D Viewer & Converter (client-only)",
  minecraftDudeExample: "Minecraft-like dude: walking animation"
};
