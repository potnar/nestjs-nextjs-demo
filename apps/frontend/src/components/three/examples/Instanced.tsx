"use client";
import * as THREE from "three";
import { useRef, useState } from "react";
import { useThreeCanvas } from "../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import HelpTip from "@/components/ui/help-tip";

type Mode = "instanced" | "naive";

export default function InstancedExample() {
  // --- UI state ---
  const [mode, setMode] = useState<Mode>("instanced");
  const [count, setCount] = useState(500);
  const [spread, setSpread] = useState(40);
  const [wind, setWind] = useState(0.6);
  const [wireframe, setWireframe] = useState(false);
  const [culling, setCulling] = useState(true);
  const [instanceColors, setInstanceColors] = useState(false);

  // --- live refs for onFrame ---
  const modeRef = useRef(mode);
  const countRef = useRef(count);
  const spreadRef = useRef(spread);
  const windRef = useRef(wind);
  const wireRef = useRef(wireframe);
  const cullRef = useRef(culling);
  const colorsRef = useRef(instanceColors);
  const needsRebuild = useRef(true);

  // --- FPS (smoothed) + panel stats ---
  const [fps, setFps] = useState(0);
  const fpsAvgRef = useRef(0);
  const fpsTimerRef = useRef(0);
  const [estCalls, setEstCalls] = useState(0);
  const [estTriangles, setEstTriangles] = useState(0);

  const updateCount = (v: number) => { setCount(v); countRef.current = v; needsRebuild.current = true; };
  const updateSpread = (v: number) => { setSpread(v); spreadRef.current = v; needsRebuild.current = true; };

  const ref = useThreeCanvas({
    onBuild: ({ scene, camera }) => {
      // --- scene baseline ---
      scene.background = new THREE.Color(0x0e0e10);
      const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 1.1);
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(8, 14, 6);
      scene.add(hemi, dir);
      const grid = new THREE.GridHelper(80, 40, 0x444444, 0x222222);
      scene.add(grid);

      camera.position.set(0, 18, 46);
      camera.lookAt(0, 4, 0);

      // --- state for current build ---
      let instanced: THREE.InstancedMesh<THREE.BufferGeometry, THREE.Material> | null = null;
      let naiveMeshes: THREE.Mesh[] = [];
      let geometry: THREE.ConeGeometry | null = null;
      let material: THREE.MeshStandardMaterial | null = null;

      const dummy = new THREE.Object3D();
      let basePos = new Float32Array(0);
      let baseRotY = new Float32Array(0);
      let baseScaleY = new Float32Array(0);
      let phase = new Float32Array(0);

      function disposeAll() {
        if (instanced) {
          scene.remove(instanced);
          instanced.geometry.dispose();
          (instanced.material as THREE.Material).dispose?.();
          instanced = null;
        }
        if (naiveMeshes.length) {
          for (const m of naiveMeshes) {
            scene.remove(m);
            // współdzielimy geo/material, nie dispose tutaj
          }
          naiveMeshes = [];
        }
        geometry?.dispose(); geometry = null;
        material?.dispose(); material = null;
      }

      function rebuild() {
        disposeAll();

        const N = Math.max(1, Math.floor(countRef.current));
        const S = Math.max(4, spreadRef.current);

        // wspólne geo/material (również dla naive — mniejsze zużycie pamięci)
        geometry = new THREE.ConeGeometry(0.5, 2, 8);
        material = new THREE.MeshStandardMaterial({
          color: 0x2ea043,
          wireframe: wireRef.current,
          vertexColors: colorsRef.current, // dla InstancedMesh z instanceColor
        });

        basePos = new Float32Array(N * 3);
        baseRotY = new Float32Array(N);
        baseScaleY = new Float32Array(N);
        phase = new Float32Array(N);

        for (let i = 0; i < N; i++) {
          const x = (Math.random() - 0.5) * S;
          const z = (Math.random() - 0.5) * S;
          const y = 0;

          basePos[i * 3 + 0] = x;
          basePos[i * 3 + 1] = y;
          basePos[i * 3 + 2] = z;

          baseRotY[i] = Math.random() * Math.PI * 2;
          baseScaleY[i] = 0.8 + Math.random() * 1.6;
          phase[i] = Math.random() * Math.PI * 2;
        }

        if (modeRef.current === "instanced") {
          instanced = new THREE.InstancedMesh(geometry, material, N);
          instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          instanced.frustumCulled = cullRef.current;
          scene.add(instanced);

          // opcjonalne: per-instance colors
          if (colorsRef.current) {
            const c = new THREE.Color();
            for (let i = 0; i < N; i++) {
              c.setHSL((i / N) * 0.33 + 0.33, 0.55, 0.45);
              instanced.setColorAt(i, c);
            }
            if (instanced.instanceColor) {
              instanced.instanceColor.needsUpdate = true; // ✅ bez any
            }
          }

          for (let i = 0; i < N; i++) {
            dummy.position.set(basePos[i * 3], basePos[i * 3 + 1], basePos[i * 3 + 2]);
            dummy.rotation.set(0, baseRotY[i], 0);
            dummy.scale.set(1, baseScaleY[i], 1);
            dummy.updateMatrix();
            instanced.setMatrixAt(i, dummy.matrix);
          }
          instanced.instanceMatrix.needsUpdate = true;
        } else {
          // "naive": N osobnych Mesh — jeden draw call na każdy
          naiveMeshes = new Array(N);
          for (let i = 0; i < N; i++) {
            const m = new THREE.Mesh(geometry, material);
            m.position.set(basePos[i * 3], basePos[i * 3 + 1], basePos[i * 3 + 2]);
            m.rotation.set(0, baseRotY[i], 0);
            m.scale.set(1, baseScaleY[i], 1);
            m.frustumCulled = cullRef.current;
            naiveMeshes[i] = m;
          }
          scene.add(...naiveMeshes);
        }

        // szacunek trójkątów (orientacyjnie) + draw calls
        const trianglesPerConeApprox = 128;
        setEstTriangles(trianglesPerConeApprox * N + 2000 /* grid, itp. */);
        setEstCalls(
          (modeRef.current === "instanced" ? 1 : N) // główne
          + 2 // światła i grid (w praktyce bywa różnie)
        );
      }

      rebuild();
      needsRebuild.current = false;

      let t = 0;
      return {
        onFrame: (dt: number) => {
          t += dt;

          // FPS (EMA) i throttling aktualizacji UI co 250ms
          const nowFps = 1 / Math.max(1e-6, dt);
          fpsAvgRef.current = fpsAvgRef.current ? (fpsAvgRef.current * 0.9 + nowFps * 0.1) : nowFps;
          fpsTimerRef.current += dt;
          if (fpsTimerRef.current >= 0.25) {
            fpsTimerRef.current = 0;
            setFps(Math.round(fpsAvgRef.current));
          }

          if (needsRebuild.current) {
            rebuild();
            needsRebuild.current = false;
          }

          // animacja „wiatru”
          const amp = 0.12 * windRef.current;
          if (instanced) {
            for (let i = 0; i < instanced.count; i++) {
              dummy.position.set(basePos[i * 3], basePos[i * 3 + 1], basePos[i * 3 + 2]);
              dummy.rotation.set(Math.sin(t * 1.2 + phase[i]) * amp, baseRotY[i], 0);
              dummy.scale.set(1, baseScaleY[i], 1);
              dummy.updateMatrix();
              instanced.setMatrixAt(i, dummy.matrix);
            }
            instanced.instanceMatrix.needsUpdate = true;
            instanced.frustumCulled = cullRef.current;
          } else if (naiveMeshes.length) {
            for (let i = 0; i < naiveMeshes.length; i++) {
              const m = naiveMeshes[i];
              m.rotation.x = Math.sin(t * 1.2 + phase[i]) * amp;
              m.rotation.y = baseRotY[i];
              m.frustumCulled = cullRef.current;
            }
          }
        },
      };
    },
  });

  // sync refs with state (bez „gołych” wyrażeń)
  if (modeRef.current !== mode) { modeRef.current = mode; needsRebuild.current = true; }
  if (windRef.current !== wind) { windRef.current = wind; }
  if (wireRef.current !== wireframe) { wireRef.current = wireframe; }
  if (cullRef.current !== culling) { cullRef.current = culling; }
  if (colorsRef.current !== instanceColors) { colorsRef.current = instanceColors; needsRebuild.current = true; }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border" ref={ref}>
        {/* Overlay FPS + tryb + szac. draw calls */}
        <div className="absolute top-2 left-2 rounded-md bg-black/50 text-white text-xs px-2 py-1">
          <div>FPS: <span className="tabular-nums">{fps}</span></div>
          <div>Mode: {mode === "instanced" ? "Instanced" : "Naive"}</div>
          <div>~Draw calls: {estCalls}</div>
          <div>~Triangles: {estTriangles.toLocaleString()}</div>
        </div>
      </div>

      <Card className="col-span-3">
        <CardHeader><CardTitle>Wydajność & ustawienia</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant={mode === "instanced" ? "default" : "secondary"}
                onClick={() => { setMode("instanced"); modeRef.current = "instanced"; needsRebuild.current = true; }}
              >
                Instanced
              </Button>
              <HelpTip tKey="tooltips.mode_instanced" />
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={mode === "naive" ? "default" : "secondary"}
                onClick={() => { setMode("naive"); modeRef.current = "naive"; needsRebuild.current = true; }}
              >
                Naive
              </Button>
              <HelpTip tKey="tooltips.mode_naive" />
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm">Liczba drzew: {count}</div>
            <Slider value={[count]} step={50} min={50} max={2000} onValueChange={(v)=>updateCount(Math.round(v[0]))} />
          </div>

          <div>
            <div className="mb-2 text-sm">Obszar (spread): {spread.toFixed(0)} m</div>
            <Slider value={[spread]} step={2} min={10} max={120} onValueChange={(v)=>updateSpread(v[0])} />
          </div>

          <div>
            <div className="mb-2 text-sm">Wiatr: {wind.toFixed(2)}</div>
            <Slider value={[wind]} step={0.01} min={0} max={1} onValueChange={(v)=>setWind(v[0])} />
          </div>
          <hr className="my-2" />
          <div className="flex gap-2">
            <Button variant={wireframe ? "default" : "secondary"} onClick={()=>setWireframe(w=>!w)}>
              {wireframe ? "Wyłącz wireframe" : "Włącz wireframe"}
            </Button>
            <Button variant={culling ? "default" : "secondary"} onClick={()=>setCulling(c=>!c)}>
              {culling ? "Culling: ON" : "Culling: OFF"}
            </Button>
          </div>

          <Button
            variant={instanceColors ? "default" : "secondary"}
            onClick={()=>setInstanceColors(v=>!v)}
            disabled={mode !== "instanced"}
            title={mode !== "instanced" ? "Dostępne tylko dla Instanced" : ""}
          >
            {instanceColors ? "Kolory per instancja ✓" : "Kolory per instancja"}
          </Button>
          <HelpTip tKey="tooltips.instanceColors" />
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <p className="font-semibold">Dlaczego Instanced?</p>
            <ul className="list-disc ml-4 space-y-1">
              <li><b>Mniej draw calls</b>: 1 vs N modeli → mniejszy narzut CPU.</li>
              <li>Wspólne <code>geometry</code> i <code>material</code> → oszczędność pamięci.</li>
              <li>Aktualizacje macierzy: <code>setMatrixAt</code> + <code>instanceMatrix.needsUpdate</code>.</li>
              <li><code>DynamicDrawUsage</code> dla częstych zmian transformacji.</li>
              <li><code>frustumCulled</code> = mniej pracy poza kadrem.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
