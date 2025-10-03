"use client";
import * as THREE from "three";
import { useRef, useState, useEffect } from "react";
import { useThreeCanvas } from "../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import HelpTip from "@/components/ui/help-tip";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SimplifyModifier } from "three/examples/jsm/modifiers/SimplifyModifier.js";

type LevelName = "High" | "Mid" | "Low" | "-";

function setWireframeRecursive(root: THREE.Object3D, on: boolean) {
  root.traverse((o: any) => {
    if (o?.isMesh) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) if (m && "wireframe" in m) (m as any).wireframe = on;
    }
  });
}

function fitLODToModel(
  tree: THREE.Object3D,
  lod: THREE.LOD,
  camera: THREE.PerspectiveCamera,
  controls: any,
  targetH = 40
): number {
  const box1 = new THREE.Box3().setFromObject(tree);
  const size1 = new THREE.Vector3(); box1.getSize(size1);
  if (size1.y > 0) tree.scale.setScalar(targetH / size1.y);

  const box2 = new THREE.Box3().setFromObject(tree);
  const sphere = new THREE.Sphere(); box2.getBoundingSphere(sphere);

  lod.position.copy(sphere.center);
  tree.position.sub(sphere.center);

  camera.position.set(sphere.center.x, sphere.center.y + sphere.radius * 1.5, sphere.center.z + sphere.radius * 3);
  camera.lookAt(lod.position);
  controls.target.copy(lod.position);
  controls.update();

  return sphere.radius;
}

// --- cooperative yielding (bez freeza) ---
function yieldToMain() {
  return new Promise<void>(r => (window as any).requestIdleCallback ? (window as any).requestIdleCallback(() => r(), { timeout: 50 }) : setTimeout(r, 0));
}

// buduje uproszczone kopie drzewa asynchronicznie
async function buildSimplifiedCopy(
  src: THREE.Object3D,
  ratio: number,
  { perMeshVertexBudget = 60000, maxMeshes = 80 } = {},
  cancelRef?: { cancelled: boolean }
): Promise<THREE.Group> {
  const modifier = new SimplifyModifier();
  const group = new THREE.Group();
  const meshes: THREE.Mesh[] = [];
  src.traverse((o: any) => { if (o?.isMesh && o.geometry) meshes.push(o as THREE.Mesh); });
  const list = meshes.slice(0, maxMeshes);

  for (const m of list) {
    if (cancelRef?.cancelled) break;

    const srcGeo = m.geometry as THREE.BufferGeometry;
    const pos = srcGeo.attributes?.position;
    if (!pos) { await yieldToMain(); continue; }

    const verts = pos.count;
    const target = Math.max(3, Math.floor(verts * ratio));
    let out = srcGeo.clone();

    if (srcGeo.index && verts <= perMeshVertexBudget) {
      try { out = modifier.modify(srcGeo.clone(), target); out.computeVertexNormals(); }
      catch { /* zostaw klon */ }
    }

    const baseMat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material | undefined;
    const mat = baseMat?.clone?.() ?? new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const copy = new THREE.Mesh(out, mat);
    copy.position.copy(m.position);
    copy.quaternion.copy(m.quaternion);
    copy.scale.copy(m.scale);
    group.add(copy);

    await yieldToMain();
  }
  return group;
}

export default function LODExample() {
  const [distance, setDistance] = useState(30); // 30 => 1.0x
  const [wireframe, setWireframe] = useState(false);

  const lodRef = useRef<THREE.LOD | null>(null);
  const highRef = useRef<THREE.Object3D | null>(null);
  const midRef  = useRef<THREE.Object3D | null>(null);
  const lowRef  = useRef<THREE.Object3D | null>(null);
  const boxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const radiusRef = useRef<number>(20);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const [fps, setFps] = useState(0);
  const fpsAvgRef = useRef(0);
  const fpsTimerRef = useRef(0);
  const [activeLevel, setActiveLevel] = useState<LevelName>("-");

  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, controls }) => {
      scene.background = new THREE.Color(0x0c1019);
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 1.1);
      const dirLight = new THREE.DirectionalLight(0xffffff, 2);
      dirLight.position.set(0, 200, 200);
      scene.add(ambient, hemi, dirLight);
      scene.add(new THREE.GridHelper(500, 50));
      scene.add(new THREE.AxesHelper(200));
      scene.add(new THREE.DirectionalLightHelper(dirLight, 10));

      camera.position.set(0, 150, 200);
      camera.far = 10000; camera.updateProjectionMatrix();

      const lod = new THREE.LOD();
      lodRef.current = lod;
      scene.add(lod);

      // High
      const loader = new GLTFLoader();
      loader.load(
        "/models/island_tree_01_4k.gltf",
        async (gltf) => {
          const tree = gltf.scene;
          lod.addLevel(tree, 0);  // High
          highRef.current = tree;

          const R = fitLODToModel(tree, lod, camera, controls, 40);
          radiusRef.current = R;

          // --- zbuduj Mid/Low z GLTF (bez fallback kulek) ---
          const k = distance / 30;
          const [midObj, lowObj] = await Promise.all([
            buildSimplifiedCopy(tree, 0.35, { perMeshVertexBudget: 60000, maxMeshes: 80 }, cancelRef.current),
            buildSimplifiedCopy(tree, 0.15, { perMeshVertexBudget: 60000, maxMeshes: 80 }, cancelRef.current),
          ]);
          if (cancelRef.current.cancelled) return;

          lod.addLevel(midObj, R * 2 * k); midRef.current = midObj;
          lod.addLevel(lowObj, R * 4 * k); lowRef.current = lowObj;

          // posortuj (ważne dla poprawnego wyboru)
          lod.levels.sort((a, b) => a.distance - b.distance);

          // helper (opcjonalnie)
          const helper = new THREE.BoxHelper(tree, 0xff0000);
          lod.add(helper);
          boxHelperRef.current = helper;
        },
        undefined,
        (err) => console.error("❌ GLTF load error:", err)
      );

      return {
        onFrame: (dt: number, t: number) => {
          // FPS (wygładzenie)
          const nowFps = 1 / Math.max(1e-6, dt);
          fpsAvgRef.current = fpsAvgRef.current ? fpsAvgRef.current * 0.9 + nowFps * 0.1 : nowFps;
          fpsTimerRef.current += dt;
          if (fpsTimerRef.current >= 0.25) {
            fpsTimerRef.current = 0;
            setFps(Math.round(fpsAvgRef.current));

            const lod = lodRef.current;
            if (lod) {
              // aktualizuj wybór poziomu pod kamerę
              lod.update(camera);
              // odczytaj realnie widoczny poziom
              let level: LevelName = "-";
              for (const { object, distance } of lod.levels) {
                if (object.visible) {
                  if (object === highRef.current) level = "High";
                  else if (object === midRef.current) level = "Mid";
                  else if (object === lowRef.current) level = "Low";
                  break;
                }
              }
              setActiveLevel(level);
            }
          }

          // obrót + helper
          if (lodRef.current) lodRef.current.rotation.y = Math.sin(t * 0.5) * 0.5;
          boxHelperRef.current?.update();
        },
        dispose: () => { cancelRef.current.cancelled = true; }
      };
    },
  });

  // wireframe + aktualizacja progów przy zmianie suwaka
  useEffect(() => {
    const lod = lodRef.current;
    if (!lod) return;

    if (highRef.current) setWireframeRecursive(highRef.current, wireframe);
    if (midRef.current)  setWireframeRecursive(midRef.current,  wireframe);
    if (lowRef.current)  setWireframeRecursive(lowRef.current,  wireframe);

    const k = distance / 30;
    const R = radiusRef.current;

    const setDist = (obj: THREE.Object3D | null | undefined, d: number) => {
      const lvl = lod.levels.find(l => l.object === obj);
      if (lvl) lvl.distance = d;
    };
    setDist(midRef.current, R * 2 * k);
    setDist(lowRef.current, R * 4 * k);

    // ważne: po zmianie progów posortuj i zaktualizuj
    lod.levels.sort((a, b) => a.distance - b.distance);
  }, [distance, wireframe]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border bg-black/20" ref={mountRef}>
        <div className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-1 space-y-0.5">
          <div>FPS: <span className="tabular-nums">{fps}</span></div>
          <div>LOD distance: {distance} <span className="opacity-60">(×{(distance/30).toFixed(2)})</span></div>
          <div>Active: {activeLevel}</div>
        </div>
      </div>

      <Card className="col-span-3">
        <CardHeader><CardTitle>Level of Detail</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="mb-2 text-sm">Odległość przełączania: {distance}</div>
            <Slider value={[distance]} step={5} min={10} max={100} onValueChange={(v) => setDistance(v[0])} />
            <HelpTip tKey="tooltips.lod_distance" />
          </div>
          <Button variant={wireframe ? "default" : "secondary"} onClick={() => setWireframe(w => !w)}>
            {wireframe ? "Wireframe ✓" : "Wireframe"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
