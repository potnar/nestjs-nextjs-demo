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
type Build = (ctx: Ctx) => { onFrame?: (dt: number, t: number) => void; dispose?: () => void } | void;

export function useThreeCanvas({ onBuild }: { onBuild: Build }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const state = useRef<{ raf?: number; onFrame?: (dt: number, t: number) => void } | null>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b1020");

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.set(3, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const built = onBuild?.({ scene, camera, renderer, controls }) || {};
    const onFrame = built.onFrame;

    const handleResize = () => {
      const W = mount.clientWidth, H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      controls.update();
      onFrame?.(dt, now / 1000);
      renderer.render(scene, camera);
      state.current!.raf = requestAnimationFrame(loop);
    };
    state.current = { onFrame, raf: requestAnimationFrame(loop) };

    return () => {
      if (state.current?.raf) cancelAnimationFrame(state.current.raf);
      ro.disconnect();
      controls.dispose();
      built.dispose?.();
      scene.traverse((o: any) => {
        o.geometry?.dispose?.();
        if (Array.isArray(o.material)) o.material.forEach((m: any) => m?.dispose?.());
        else o.material?.dispose?.();
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return mountRef;
}
