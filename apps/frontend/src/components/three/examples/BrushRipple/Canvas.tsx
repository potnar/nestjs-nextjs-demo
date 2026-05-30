"use client";
import * as THREE from "three";
import { PropsWithChildren, useEffect, useRef } from "react";
import { useThreeCanvas } from "@/components/three/useThreeCanvas";
import { usePropRef } from "@/components/three/usePropRef";
import { makeEwmaFps } from "@/lib/three";
import { HeightField } from "@/lib/heightField";
import { applyBrush } from "@/lib/brush";

export type Mode = "push" | "pull";
export type BrushApi = { reset: () => void };

type Props = PropsWithChildren<{
  className?: string;
  mode: Mode;
  radius: number;
  strength: number;
  damping: number;
  wire: boolean;
  onFps?: (fps: number) => void;
  onReady?: (api: BrushApi) => void;
}>;

export default function BrushRippleCanvas({
  className, children, mode, radius, strength, damping, wire, onFps, onReady
}: Props) {
  const planeRef = useRef<THREE.Mesh | null>(null);
  const ringRef  = useRef<THREE.Mesh | null>(null);
  const hfRef    = useRef<HeightField | null>(null);

  const isDownRef = useRef(false);
  const raycaster = useRef(new THREE.Raycaster());
  const ndc       = useRef(new THREE.Vector2());

  const radiusRef   = usePropRef(radius);
  const strengthRef = usePropRef(strength);
  const dampingRef  = usePropRef(damping);
  const modeRef     = usePropRef(mode);

  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, controls, renderer, frame }) => {
      scene.background = new THREE.Color("#0b1020");
      scene.add(new THREE.GridHelper(60, 60, 0x2a2f3b, 0x1a1e28));
      const amb = new THREE.AmbientLight(0xffffff, 0.5);
      const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(8, 10, 5);
      scene.add(amb, dir);

      camera.position.set(0, 10, 18);
      controls.target.set(0, 0, 0); controls.update();

      const res = 128, size = 30;
      const geom = new THREE.PlaneGeometry(size, size, res, res);
      geom.rotateX(-Math.PI / 2);

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1c4b2a"), roughness: 0.85, metalness: 0.0, wireframe: wire,
      });

      const plane = new THREE.Mesh(geom, mat);
      planeRef.current = plane;
      scene.add(plane);

      const hf = new HeightField(res, size, geom);
      hfRef.current = hf;

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.98, 1.0, 64),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2; ring.visible = false;
      ringRef.current = ring; scene.add(ring);

      const updatePointer = (ev: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        ndc.current.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.current.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.current.setFromCamera(ndc.current, camera);
        const hit = raycaster.current.intersectObject(planeRef.current!, false)[0];
        if (!hit) { ring.visible = false; return; }

        const p = hit.point;
        ring.visible = true; ring.position.set(p.x, 0.02, p.z);
        ring.scale.set(radiusRef.current, radiusRef.current, 1);

        if (isDownRef.current) {
          applyBrush(hf, p.x, p.z, radiusRef.current, strengthRef.current, modeRef.current === "push" ? 1 : -1);
        }
      };
      const onDown = (e: PointerEvent) => { isDownRef.current = true; controls.enabled = false; updatePointer(e); };
      const onUp   = () => { isDownRef.current = false; controls.enabled = true; };

      renderer.domElement.addEventListener("pointermove", updatePointer);
      renderer.domElement.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);

      frame(plane, { offset: 1.45 });
      onReady?.({ reset: () => hf.reset() });

      const trackFps = makeEwmaFps(onFps);

      return {
        onFrame: (dt: number) => {
          hf.step(dt, dampingRef.current);
          trackFps(dt);
        },
        dispose: () => {
          renderer.domElement.removeEventListener("pointermove", updatePointer);
          renderer.domElement.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointerup", onUp);
        },
      };
    },
  });

  useEffect(() => {
    if (planeRef.current)
      (planeRef.current.material as THREE.MeshStandardMaterial).wireframe = wire;
  }, [wire]);

  return (
    <div className={className} ref={mountRef}>
      {children}
    </div>
  );
}
