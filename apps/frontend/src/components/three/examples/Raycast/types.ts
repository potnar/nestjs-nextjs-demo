import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"; 

export type ClickInfo = { name: string; index: number } | null;
export type Model = "cubes" | "house";
export type HousePaintMode = "brush" | "fill";

export type BuildCtx = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;  // OrbitControls z hooka
  frame: (o: THREE.Object3D, opts?: { offset?: number }) => void;
};

export type WallMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;

export type PaintWall = {
  mesh: WallMesh;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  name: string;
  idx: number;
};
