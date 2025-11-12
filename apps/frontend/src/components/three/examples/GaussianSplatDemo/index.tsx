"use client";
import * as THREE from "three";
import { useEffect, useRef, useState, useCallback } from "react";
import { useThreeCanvas } from "@/components/three/useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { DropInViewer } from "@mkkellogg/gaussian-splats-3d";

export default function GaussianSplatDemo() {
  const [fps, setFps] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [path, setPath] = useState("/splats/scene.ksplat");

  const viewerRef = useRef<DropInViewer | null>(null);
  const rootRef = useRef<THREE.Group | null>(null);
  const [viewerReady, setViewerReady] = useState(false);

  // lock do serializacji clear → add
  const loadLockRef = useRef<Promise<void>>(Promise.resolve());

  const fpsAvg = useRef(0);
  const fpsT = useRef(0);

  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, controls }) => {
      scene.background = new THREE.Color(0x0b1020);
      scene.add(new THREE.GridHelper(60, 60, 0x2a2f3b, 0x1a1e28));
      const amb = new THREE.AmbientLight(0xffffff, 0.6);
      const spot = new THREE.SpotLight(0xffffff, 1); spot.position.set(6, 10, 6);
      scene.add(amb, spot);

      camera.position.set(0, 4, 10);
      controls.target.set(0, 1.2, 0); controls.update();

      const root = new THREE.Group();
      root.name = "SplatRoot";
      rootRef.current = root;
      scene.add(root);

      // ⬇️ Dynamiczny import w IIFE (bez await, więc onBuild pozostaje synchroniczny)
      (async () => {
        const GS = await import("@mkkellogg/gaussian-splats-3d");
        const viewer = new GS.DropInViewer({
          gpuAcceleratedSort: true,
          sharedMemoryForWorkers: false, // bez COOP/COEP
        });
        viewerRef.current = viewer;
        root.add(viewer);
        setViewerReady(true); // poinformuj efekty, że viewer jest gotowy
      })();

      return {
        onFrame: (dt: number) => {
          const now = 1 / Math.max(1e-6, dt);
          fpsAvg.current = fpsAvg.current ? fpsAvg.current * 0.9 + now * 0.1 : now;
          fpsT.current += dt;
          if (fpsT.current > 0.25) { fpsT.current = 0; setFps(Math.round(fpsAvg.current)); }
        },
        dispose: () => {
          if (rootRef.current) {
            scene.remove(rootRef.current);
            rootRef.current = null;
          }
          viewerRef.current = null;
          scene.remove(amb, spot);
        }
      };
    }
  });

  const loadSplat = useCallback((p: string) => {
    loadLockRef.current = loadLockRef.current
      .then(async () => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        viewer.clearScenes?.();
        // odczekaj 2 klatki, by zakończyć unload
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
        await viewer.addSplatScene(p, {
          splatAlphaRemovalThreshold: 5,
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          scale: [scale, scale, scale],
          showLoadingUI: true,
        });
      })
      .catch(() => {});
    return loadLockRef.current;
  }, [scale]);

  // Załaduj scenę, gdy viewer się zainicjalizuje lub zmieni się ścieżka
  useEffect(() => {
    if (viewerReady) void loadSplat(path);
  }, [viewerReady, path, loadSplat]);

  // Zmiana skali → skaluj root (bez przeładowania)
  useEffect(() => {
    if (rootRef.current) rootRef.current.scale.setScalar(scale);
  }, [scale]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border" ref={mountRef}>
        <div className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-1">FPS: {fps}</div>
      </div>

      <Card className="col-span-3">
        <CardHeader><CardTitle>Gaussian Splat</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">Plik</div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPath("/splats/scene.ksplat")}>Scene</Button>
            <Button variant="secondary" onClick={() => setPath("/splats/bonsai.splat")}>Bonsai</Button>
          </div>
          <div className="text-sm mt-2">Scale: {scale.toFixed(2)}</div>
          <Slider value={[scale]} min={0.2} max={3} step={0.05} onValueChange={(v)=>setScale(v[0])}/>
        </CardContent>
      </Card>
    </div>
  );
}
