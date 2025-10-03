"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Ctx = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
};
type BuildResult = { onFrame?: (dt: number, t: number) => void; dispose?: () => void } | void;
type Build = (ctx: Ctx) => BuildResult;

export function useThreeCanvas({ onBuild }: { onBuild: Build }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // przechowujemy aktualne onBuild
  const onBuildRef = useRef<Build | null>(null);
  useEffect(() => {
    onBuildRef.current = onBuild;
  }, [onBuild]);

  const state = useRef<{ raf?: number; onFrame?: (dt: number, t: number) => void; dispose?: () => void }>({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b1020");

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.set(3, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.setSize(w, h, false);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const built = onBuildRef.current?.({ scene, camera, renderer, controls }) ?? {};
    state.current.onFrame = built.onFrame;
    state.current.dispose = built.dispose;

    const handleResize = () => {
      const W = mount.clientWidth || w;
      const H = mount.clientHeight || h;
      camera.aspect = W / H || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      controls.update();
      state.current.onFrame?.(dt, now / 1000);
      renderer.render(scene, camera);
      state.current.raf = requestAnimationFrame(loop);
    };
    state.current.raf = requestAnimationFrame(loop);

    // 👇 złap aktualne wartości do lokalnych zmiennych użytych w cleanupie
    const rafIdAtMount = state.current.raf;
    const disposeAtMount = state.current.dispose;
    const domAtMount = renderer.domElement;

    return () => {
      if (rafIdAtMount) cancelAnimationFrame(rafIdAtMount);
      ro.disconnect();
      controls.dispose();
      disposeAtMount?.();

      scene.traverse((obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) mat.forEach((m: THREE.Material) => m.dispose());
          else mat?.dispose?.();
        }
      });

      renderer.dispose();
      if (domAtMount.parentElement) domAtMount.parentElement.removeChild(domAtMount);
    };
  }, []); // nie przebudowujemy sceny przy zmianie onBuild

  return mountRef;
}
