export type ExampleKey =
  | "projectHub"
  | "minimal"
  | "raycast"
  | "shader"
  | "instanced"
  | "LOD"
  | "brushripple"
  | "gaussianSplatDemo"
  | "modelConvertViewer"
  | "minecraftDudeExample"
  | "minecraftPathfinding"
  | "IoTRoomScene"
  | "galaxy"
  | "spaceHub";

export const EXAMPLE_LABELS: Record<ExampleKey, string> = {
  projectHub: "3D Project Hub: portfolio / systemy",
  minimal: "Minimal: PBR + OrbitControls",
  raycast: "Interakcja: Raycasting",
  shader: "Shader: animowany gradient",
  instanced: "InstancedMesh: many objects",
  LOD: "LOD: levels of detail",
  brushripple: "Brush & Ripple: interactive ripple effect",
  gaussianSplatDemo: "Gaussian Splat: point-cloud (NeRF-like)",
  modelConvertViewer: "3D Viewer & Converter (client-only)",
  minecraftDudeExample: "Minecraft-like dude: walking animation",
  minecraftPathfinding: "Minecraft pathfinding (A*)",
  IoTRoomScene: "IoT room: 3D mapa infrastruktury",
  galaxy: "Galaktyka: Generator cząsteczek",
  spaceHub: "Space Hub: interaktywny wybór",
};
