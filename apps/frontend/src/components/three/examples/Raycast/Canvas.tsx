"use client";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useCallback } from "react";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useThreeCanvas, type ThreeCtx } from "@/components/three/useThreeCanvas";
import { usePropRef } from "@/components/three/usePropRef";
import { disposeGroup, makeEwmaFps } from "@/lib/three";
import { buildCubes } from "./models/cubes";
import { buildHouse } from "./models/house";
import type { Model, ClickInfo, PaintWall, PaintMode } from "./types";
import { paintDot, fillCanvas } from "./painting";

export type CanvasProps = {
  className?: string;
  model: Model;
  rotDeg: number;
  paintMode: PaintMode;
  brushRadius: number;
  targetColor: string;
  showModal: boolean;
  onSelect: (info: ClickInfo) => void;
  onOpenModal: () => void;
  onFps?: (fps: number) => void;
  children?: React.ReactNode;
};

export default function Canvas({
  className,
  model,
  targetColor,
  rotDeg,
  paintMode,
  brushRadius,
  showModal,
  onSelect,
  onOpenModal,
  onFps,
  children,
}: CanvasProps) {
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const isDownRef = useRef(false);
  const startXYRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const groupRef = useRef<THREE.Group | null>(null);
  const pickablesRef = useRef<THREE.Object3D[]>([]);
  const wallsRef = useRef<PaintWall[]>([]);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<ThreeCtx["frame"] | null>(null);

  const targetColorRef = usePropRef(targetColor);
  const showModalRef   = usePropRef(showModal);
  const brushRadiusRef = usePropRef(brushRadius);
  const paintModeRef   = usePropRef(paintMode);
  const kindRef        = useRef<Model>(model);

  const rotDegRef = useRef(rotDeg);
  useEffect(() => {
    rotDegRef.current = rotDeg;
    if (groupRef.current)
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(rotDeg);
  }, [rotDeg]);

  const getIdx = (obj: THREE.Object3D) => {
    const u = obj.userData as { idx?: number } | undefined;
    return typeof u?.idx === "number" ? u.idx : -1;
  };

  const build = useCallback((kind: Model) => {
    const group = groupRef.current;
    if (!group) return;
    while (group.children.length) {
      disposeGroup(group.children.pop()!);
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
  }, []);

  const rebuild = useCallback(() => {
    const kind = kindRef.current;
    build(kind);
    if (frameRef.current && groupRef.current) {
      frameRef.current(groupRef.current, { offset: kind === "house" ? 2.4 : 1.6 });
    }
    if (kind === "house" && groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(rotDegRef.current);
    }
  }, [build]);

  useEffect(() => {
    kindRef.current = model;
    rebuild();
  }, [model, rebuild]);

  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, renderer, controls, frame }: ThreeCtx) => {
      scene.background = new THREE.Color(0x0b1020);
      scene.add(new THREE.GridHelper(60, 60, 0x2a2f3b, 0x1a1e28));
      const amb = new THREE.AmbientLight(0xffffff, 0.6);
      const spot = new THREE.SpotLight(0xffffff, 1);
      spot.position.set(8, 10, 6);
      scene.add(amb, spot);

      camera.position.set(0, 8, 16);
      controls.target.set(0, 0, 0);
      controls.update();
      controlsRef.current = controls;
      frameRef.current = frame;

      const group = new THREE.Group();
      groupRef.current = group;
      scene.add(group);

      build(kindRef.current);
      group.rotation.y = THREE.MathUtils.degToRad(rotDegRef.current);
      frame(group, { offset: kindRef.current === "house" ? 2.4 : 1.6 });

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
          const hit = raycaster.intersectObjects(pickablesRef.current, false)[0];
          if (!hit) return;
          const mesh = hit.object as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          try { mat.color.set(targetColorRef.current); } catch {}
          onSelect({ name: mesh.name || mesh.uuid.slice(0, 8), index: getIdx(mesh) });
          if (showModalRef.current) onOpenModal();
        } else {
          if (paintModeRef.current === "brush") {
            if (controlsRef.current) controlsRef.current.enabled = false;
            paintWallAtRay();
          }
        }
      };

      const onMove = (e: PointerEvent) => {
        updateNDC(e);
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
        if (kindRef.current === "house" && paintModeRef.current === "fill" && !movedRef.current) {
          fillWallAtRay();
        }
        isDownRef.current = false;
        if (controlsRef.current) controlsRef.current.enabled = true;
        startXYRef.current = null;
      };

      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);

      const trackFps = makeEwmaFps(onFps);

      return {
        onFrame: (dt: number) => { trackFps(dt); },
        dispose: () => {
          renderer.domElement.removeEventListener("pointerdown", onDown);
          renderer.domElement.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          if (groupRef.current) {
            disposeGroup(groupRef.current);
            scene.remove(groupRef.current);
            groupRef.current = null;
          }
          scene.remove(amb, spot);
        },
      };
    },
  });

  function paintWallAtRay() {
    const walls = wallsRef.current.map((w) => w.mesh);
    const hit = raycaster.intersectObjects(walls, false)[0];
    if (!hit || !hit.uv) return;
    const wall = wallsRef.current.find((w) => w.mesh === hit.object)!;
    const px = Math.floor(hit.uv.x * wall.canvas.width);
    const py = Math.floor((1 - hit.uv.y) * wall.canvas.height);
    paintDot(wall.ctx, px, py, brushRadiusRef.current, targetColorRef.current);
    wall.tex.needsUpdate = true;
    onSelect({ name: wall.name, index: getIdx(wall.mesh) });
  }

  function fillWallAtRay() {
    const walls = wallsRef.current.map((w) => w.mesh);
    const hit = raycaster.intersectObjects(walls, false)[0];
    if (!hit) return;
    const wall = wallsRef.current.find((w) => w.mesh === hit.object)!;
    fillCanvas(wall.ctx, targetColorRef.current);
    wall.tex.needsUpdate = true;
    onSelect({ name: wall.name, index: getIdx(wall.mesh) });
  }

  return (
    <div className={className} ref={mountRef}>
      {children}
    </div>
  );
}
