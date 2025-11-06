"use client";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useThreeCanvas } from "@/components/three/useThreeCanvas";
import { buildCubes } from "./models/cubes";
import { buildHouse } from "./models/house";
import type { Model, ClickInfo, BuildCtx, PaintWall, HousePaintMode } from "./types";
import { paintDot, fillCanvas } from "./painting";

export type CanvasProps = {
  className?: string;
  model: Model;

  // House controls
  houseRotationDeg: number;           // obrót całego domku (°)
  housePaintMode: HousePaintMode;     // "fill" | "brush"
  brushRadius: number;                // px (dla Brush)

  // Shared
  targetColor: string;
  showModalOnClick: boolean;

  onSelect: (info: ClickInfo) => void;
  onOpenModal: () => void;
  onFps?: (fps: number) => void;

  children?: React.ReactNode; // HUD overlay
};

export default function Canvas({
  className,
  model,
  targetColor,
  houseRotationDeg,
  housePaintMode,
  brushRadius,
  showModalOnClick,
  onSelect,
  onOpenModal,
  onFps,
  children,
}: CanvasProps) {
  // core
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const isDownRef = useRef(false);
  const startXYRef = useRef<{x:number;y:number} | null>(null);
  const movedRef = useRef(false);

  // scene
  const groupRef = useRef<THREE.Group | null>(null);
  const pickablesRef = useRef<THREE.Object3D[]>([]);
  const wallsRef = useRef<PaintWall[]>([]);
  const controlsRef = useRef<any>(null);
  const frameRef = useRef<BuildCtx["frame"] | null>(null); // <— mamy dostęp do frame po buildzie


  const fpsAvgRef = useRef(0);
  const fpsTRef = useRef(0);

  // refs na propsy dla handlerów
  const targetColorRef = useRef(targetColor);
  const showModalRef = useRef(showModalOnClick);
  const kindRef = useRef<Model>(model);
  const brushRadiusRef = useRef(brushRadius);
  const paintModeRef = useRef<HousePaintMode>(housePaintMode);
  const houseRotRef = useRef(houseRotationDeg);

  useEffect(() => { targetColorRef.current = targetColor; }, [targetColor]);
  useEffect(() => { showModalRef.current = showModalOnClick; }, [showModalOnClick]);
  useEffect(() => { kindRef.current = model; rebuild(); }, [model]);
  useEffect(() => { brushRadiusRef.current = brushRadius; }, [brushRadius]);
  useEffect(() => { paintModeRef.current = housePaintMode; }, [housePaintMode]);
  useEffect(() => {
    houseRotRef.current = houseRotationDeg;
    if (groupRef.current) groupRef.current.rotation.y = THREE.MathUtils.degToRad(houseRotationDeg);
  }, [houseRotationDeg]);

  // mount hook
  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, renderer, controls, frame }: BuildCtx) => {
      scene.background = new THREE.Color(0x0b1020);
      scene.add(new THREE.GridHelper(60, 60, 0x2a2f3b, 0x1a1e28));
      const amb = new THREE.AmbientLight(0xffffff, 0.6);
      const spot = new THREE.SpotLight(0xffffff, 1); spot.position.set(8, 10, 6);
      scene.add(amb, spot);

      camera.position.set(0, 8, 16);
      controls.target.set(0, 0, 0); controls.update();
      controlsRef.current = controls;
      frameRef.current = frame;

      const group = new THREE.Group();
      groupRef.current = group; 
      scene.add(group);

      build(kindRef.current);
      // ustaw początkowy obrót domku (jeśli House)
      group.rotation.y = THREE.MathUtils.degToRad(houseRotRef.current);

      frame(group, { offset: 1.6 });

      // pointer handlers
      const updateNDC = (ev: PointerEvent) => {
        const r = (renderer.domElement as HTMLCanvasElement).getBoundingClientRect();
        mouse.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
        mouse.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
      };

      const onDown = (e: PointerEvent) => {
        isDownRef.current = true;
        startXYRef.current = { x: e.clientX, y: e.clientY };
        movedRef.current = false;
        updateNDC(e);

        if (kindRef.current === "cubes") {
          // zwykły click: kolor na sześcianie
          const hit = raycaster.intersectObjects(pickablesRef.current, false)[0];
          if (!hit) return;
          const mesh = hit.object as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          try { mat.color.set(targetColorRef.current); } catch {}
          const idx = typeof (mesh as any).userData?.idx === "number" ? (mesh as any).userData.idx : -1;
          onSelect({ name: mesh.name || mesh.uuid.slice(0, 8), index: idx });
          if (showModalRef.current) onOpenModal();
        } else {
          // House:
          if (paintModeRef.current === "brush") {
            // malowanie „na żywo” -> wyłącz orbit podczas drag
            controlsRef.current.enabled = false;
            paintWallAtRay();
          } else {
            // Fill – nic teraz, poczekaj do pointerup (klik bez ruchu)
            controlsRef.current.enabled = true; // orbit może obracać domek
          }
        }
      };

      const onMove = (e: PointerEvent) => {
        updateNDC(e);
        // wykryj ruch (dla rozróżnienia klik vs drag)
        if (startXYRef.current) {
          const dx = e.clientX - startXYRef.current.x;
          const dy = e.clientY - startXYRef.current.y;
          if (Math.hypot(dx, dy) > 3) movedRef.current = true;
        }
        if (isDownRef.current && kindRef.current === "house" && paintModeRef.current === "brush") {
          paintWallAtRay();
        }
      };

      const onUp = () => {
        if (kindRef.current === "house") {
          // w trybie Fill – klik (bez ruchu) -> wypełnij całą ścianę
          if (paintModeRef.current === "fill" && !movedRef.current) {
            fillWallAtRay();
          }
        }
        isDownRef.current = false;
        controlsRef.current.enabled = true;
        startXYRef.current = null;
      };

      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);

      return {
        onFrame: (dt: number) => {
          const now = 1 / Math.max(1e-6, dt);
          fpsAvgRef.current = fpsAvgRef.current ? fpsAvgRef.current * 0.9 + now * 0.1 : now;
          fpsTRef.current += dt;
          if (fpsTRef.current > 0.25) { fpsTRef.current = 0; onFps?.(Math.round(fpsAvgRef.current)); }
        },
        dispose: () => {
          renderer.domElement.removeEventListener("pointerdown", onDown);
          renderer.domElement.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);

          if (groupRef.current) {
            disposeObject(groupRef.current);
            scene.remove(groupRef.current);
            groupRef.current = null;
          }
          scene.remove(amb, spot);
        }
      };
    }
  });

  // rebuild przy zmianie modelu
  function rebuild() {
    if (!groupRef.current) return;
    build(model);
    frameRef.current?.(groupRef.current, { offset: model === "house" ? 2.4 : 1.6 });
    if (model === "house") {
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(houseRotRef.current);
    }
  }

  function build(kind: Model) {
    const group = groupRef.current; if (!group) return;
    while (group.children.length) {
      const o = group.children.pop()!;
      disposeObject(o);
    }
    pickablesRef.current = [];
    wallsRef.current = [];

    if (kind === "cubes") {
      const { pickables } = buildCubes(group);
      pickablesRef.current = pickables;
    } else {
      const { walls, pickables } = buildHouse(group);
      wallsRef.current = walls;
      pickablesRef.current = pickables;
    }
  }

  function disposeObject(obj: THREE.Object3D) {
    obj.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      }
    });
  }

  function paintWallAtRay() {
    const walls = wallsRef.current.map(w => w.mesh);
    const hit = raycaster.intersectObjects(walls, false)[0];
    if (!hit || !hit.uv) return;

    const wall = wallsRef.current.find(w => w.mesh === hit.object)!;
    const px = Math.floor(hit.uv.x * wall.canvas.width);
    const py = Math.floor((1 - hit.uv.y) * wall.canvas.height);

    paintDot(wall.ctx, px, py, brushRadiusRef.current, targetColorRef.current);
    wall.tex.needsUpdate = true;

    const idx = typeof (wall.mesh as any).userData?.idx === "number" ? (wall.mesh as any).userData.idx : -1;
    onSelect({ name: wall.name, index: idx });
  }

  function fillWallAtRay() {
    const walls = wallsRef.current.map(w => w.mesh);
    const hit = raycaster.intersectObjects(walls, false)[0];
    if (!hit) return;
    const wall = wallsRef.current.find(w => w.mesh === hit.object)!;

    fillCanvas(wall.ctx, targetColorRef.current);
    wall.tex.needsUpdate = true;

    const idx = typeof (wall.mesh as any).userData?.idx === "number" ? (wall.mesh as any).userData.idx : -1;
    onSelect({ name: wall.name, index: idx });
  }

  return (
    <div className={className} ref={mountRef}>
      {children}
    </div>
  );
}
