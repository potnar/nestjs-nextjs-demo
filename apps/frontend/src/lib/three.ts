import * as THREE from "three";

export function disposeGroup(obj: THREE.Object3D) {
  obj.traverse((node) => {
    if (!(node as THREE.Mesh).isMesh) return;
    const m = node as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[];
    Array.isArray(mat) ? mat.forEach((x) => x.dispose()) : mat?.dispose?.();
  });
}

export function makeEwmaFps(onFps?: (fps: number) => void) {
  let avg = 0, t = 0;
  return (dt: number) => {
    const inst = 1 / Math.max(1e-6, dt);
    avg = avg ? avg * 0.9 + inst * 0.1 : inst;
    if ((t += dt) > 0.25) { t = 0; onFps?.(Math.round(avg)); }
  };
}
