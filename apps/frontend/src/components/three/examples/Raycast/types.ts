import * as THREE from "three";

export type ClickInfo = { name: string; index: number } | null;
export type Model = "cubes" | "house";
export type PaintMode = "brush" | "fill";

export type WallMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;

export type PaintWall = {
  mesh: WallMesh;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  name: string;
  idx: number;
};
