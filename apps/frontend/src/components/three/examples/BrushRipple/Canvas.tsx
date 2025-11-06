"use client";
import * as THREE from "three";
import { PropsWithChildren, useEffect, useRef } from "react";
import { useThreeCanvas } from "../../useThreeCanvas";
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
  const ndc = useRef(new THREE.Vector2());
  const fpsAvgRef = useRef(0); const fpsTRef = useRef(0);

  const radiusRef = useRef(radius);
  const strengthRef = useRef(strength);
  const dampingRef = useRef(damping);
  const modeRef = useRef<Mode>(mode);
  useEffect(()=>{ radiusRef.current = radius; }, [radius]);
  useEffect(()=>{ strengthRef.current = strength; }, [strength]);
  useEffect(()=>{ dampingRef.current = damping; }, [damping]);
  useEffect(()=>{ modeRef.current = mode; }, [mode]);

  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, controls, renderer, frame }) => {
      scene.background = new THREE.Color("#0b1020");
      scene.add(new THREE.GridHelper(60, 60, 0x2a2f3b, 0x1a1e28));
      const amb = new THREE.AmbientLight(0xffffff, 0.5);
      const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(8, 10, 5);
      scene.add(amb, dir);

      camera.position.set(0, 10, 18);
      controls.target.set(0, 0, 0); controls.update();

      // Plane + HeightField
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

      // Ring (podgląd promienia)
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.98, 1.0, 64),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2; ring.visible = false;
      ringRef.current = ring; scene.add(ring);

      // Pointer → raycast + pędzel
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
      const onUp = () => { isDownRef.current = false; controls.enabled = true; };

      renderer.domElement.addEventListener("pointermove", updatePointer);
      renderer.domElement.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);

      frame(plane, { offset: 1.45 });

      onReady?.({ reset: () => hf.reset() });

      return {
        onFrame: (dt: number) => {
          hf.step(dt, dampingRef.current); // fizyka + aktualizacja geometrii

          // FPS
          const now = 1 / Math.max(1e-6, dt);
          fpsAvgRef.current = fpsAvgRef.current ? fpsAvgRef.current * 0.9 + now * 0.1 : now;
          fpsTRef.current += dt;
          if (fpsTRef.current > 0.25) { fpsTRef.current = 0; onFps?.(Math.round(fpsAvgRef.current)); }
        },
        dispose: () => {
          renderer.domElement.removeEventListener("pointermove", updatePointer);
          renderer.domElement.removeEventListener("pointerdown", onDown);
          window.removeEventListener("pointerup", onUp);
        },
      };
    },
  });

  // UI → wireframe
  useEffect(() => {
    if (planeRef.current) {
      (planeRef.current.material as THREE.MeshStandardMaterial).wireframe = wire;
    }
  }, [wire]);

  return (
    <div className={className} ref={mountRef}>
      {children /* HUD overlay z rodzica */}
    </div>
  );
}
