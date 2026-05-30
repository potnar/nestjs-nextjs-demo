"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { disposeGroup } from "@/lib/three";

type FrameOpts = { offset?: number };

export type ThreeCtx = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  frame: (object: THREE.Object3D, opts?: FrameOpts) => void;
};

type BuildResult = { onFrame?: (dt: number, t: number) => void; dispose?: () => void } | void;
type Build = (ctx: ThreeCtx) => BuildResult;

export function useThreeCanvas({ onBuild }: { onBuild: Build }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const onBuildRef = useRef<Build | null>(null);
  useEffect(() => { onBuildRef.current = onBuild; }, [onBuild]);

  const state = useRef<{ raf?: number; onFrame?: (dt: number, t: number) => void; dispose?: () => void }>({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth || 800;
    const h = mount.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b1020");

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.set(4, 3, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.toneMappingExposure = 1.0;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    (renderer as unknown as { outputColorSpace?: THREE.ColorSpace }).outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.setSize(w, h);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.update();

    const frame = (object: THREE.Object3D, opts?: FrameOpts) => {
      const offset = opts?.offset ?? 1.65;
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxSize = Math.max(size.x, size.y, size.z);
      const fitHeight = maxSize / (2 * Math.tan((camera.fov * Math.PI) / 360));
      const fitWidth = fitHeight / camera.aspect;
      const distance = offset * Math.max(fitHeight, fitWidth);

      const dir = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize()
        .multiplyScalar(distance);

      camera.near = Math.max(0.01, distance / 100);
      camera.far = distance * 100;
      camera.updateProjectionMatrix();

      controls.target.copy(center);
      camera.position.copy(center).add(dir);
      controls.update();
    };

    const built = onBuildRef.current?.({ scene, camera, renderer, controls, frame }) ?? {};
    state.current.onFrame = built.onFrame;
    state.current.dispose = built.dispose;

    const handleResize = () => {
      const W = mount.clientWidth || w;
      const H = mount.clientHeight || h;
      camera.aspect = W / H || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
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

    const rafIdAtMount = state.current.raf;
    const disposeAtMount = state.current.dispose;
    const domAtMount = renderer.domElement;

    return () => {
      if (rafIdAtMount) cancelAnimationFrame(rafIdAtMount);
      ro.disconnect();
      controls.dispose();
      disposeAtMount?.();
      disposeGroup(scene);
      renderer.dispose();
      if (domAtMount.parentElement)
        domAtMount.parentElement.removeChild(domAtMount);
    };
  }, []);

  return mountRef;
}
