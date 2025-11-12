"use client";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useThreeCanvas } from "@/components/three/useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { loadFileToObject, inferExt } from "./loaders";
import { exportObject, type ExportFormat } from "./exporters";
import { centerObject, type CenterMode } from "./center";
import { fixMaterialColorSpaces } from "./materials";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type UIChoice = "none" | CenterMode;
type WireframeMat = THREE.Material & { wireframe?: boolean };

export default function ModelConvertViewer() {
  const [fps, setFps] = useState(0);
  const [scale, setScale] = useState(1);
  const [wire, setWire] = useState(false);
  const [exportFmt, setExportFmt] = useState<ExportFormat>("glb");
  const [name, setName] = useState<string>("model");
  const [error, setError] = useState<string | null>(null);
  const [centerChoice, setCenterChoice] = useState<UIChoice>("none");

  const rootRef = useRef<THREE.Group | null>(null);
  const currentRef = useRef<THREE.Object3D | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const pmremRef = useRef<THREE.PMREMGenerator | null>(null);
  const envTexRef = useRef<THREE.Texture | null>(null);
  const hemiRef = useRef<THREE.HemisphereLight | null>(null);

  const fpsAvg = useRef(0);
  const fpsT = useRef(0);

  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, controls, renderer }) => {
      rendererRef.current = renderer;

      // renderer kolory (jeśli nie masz tego w hooku, dodaj)
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      renderer.physicallyCorrectLights = true;
   
      (renderer as unknown as { outputColorSpace: THREE.ColorSpace }).outputColorSpace = THREE.SRGBColorSpace;
      

      scene.background = new THREE.Color(0x0b1020);
      scene.add(new THREE.GridHelper(60, 60, 0x2a2f3b, 0x1a1e28));

      const amb = new THREE.AmbientLight(0xffffff, 0.2);
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(3, 5, 2);
      scene.add(amb, dir);

      // IBL
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;

      // miękkie światło
      const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
      hemi.position.set(0, 1, 0);
      scene.add(hemi);

      pmremRef.current = pmrem;
      envTexRef.current = envTex;
      hemiRef.current = hemi;

      camera.position.set(0, 2.5, 7);
      controls.target.set(0, 1, 0);
      controls.update();

      const root = new THREE.Group();
      rootRef.current = root;
      scene.add(root);

      return {
        onFrame: (dt: number) => {
          const now = 1 / Math.max(1e-6, dt);
          fpsAvg.current = fpsAvg.current ? fpsAvg.current * 0.9 + now * 0.1 : now;
          fpsT.current += dt;
          if (fpsT.current > 0.25) {
            fpsT.current = 0;
            setFps(Math.round(fpsAvg.current));
          }
        },
        dispose: () => {
          if (rootRef.current) {
            scene.remove(rootRef.current);
            rootRef.current = null;
          }
          scene.remove(amb, dir);

          scene.environment = null;
          if (hemiRef.current) {
            scene.remove(hemiRef.current);
            hemiRef.current.dispose?.();
            hemiRef.current = null;
          }
          if (envTexRef.current) {
            envTexRef.current.dispose();
            envTexRef.current = null;
          }
          if (pmremRef.current) {
            pmremRef.current.dispose();
            pmremRef.current = null;
          }
        }
      };
    }
  });

  // Import wielu plików (główny + sidecary)
  async function handleFiles(files: File[]): Promise<void> {
    setError(null);
    try {
      const prio: Record<string, number> = { glb: 1, gltf: 2, obj: 3, fbx: 4, stl: 5, ply: 6 };
      const main = files
        .map((f) => ({ f, ext: inferExt(f.name) }))
        .filter((x) => x.ext)
        .sort((a, b) => prio[a.ext as string] - prio[b.ext as string])[0]?.f;

      if (!main) throw new Error("Nie znaleziono obsługiwanego pliku.");
      const sidecars = files.filter((f) => f !== main);

      const obj = await loadFileToObject(main, sidecars, rendererRef.current ?? undefined);

      // popraw kolor spaces i env intensities
      fixMaterialColorSpaces(obj);
      obj.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;
        const apply = (m: THREE.Material) => {
          if ("envMapIntensity" in m) (m as THREE.MeshStandardMaterial).envMapIntensity = 1.5;
          m.needsUpdate = true;
        };
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(apply);
        } else {
          apply(mesh.material);
        }
      });

      if (rootRef.current) {
        if (currentRef.current) rootRef.current.remove(currentRef.current);
        rootRef.current.add(obj);
        currentRef.current = obj;
      }

      const base = main.name.replace(/\.[^.]+$/, "") || "model";
      setName(base);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Nie udało się wczytać modelu.";
      setError(msg);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) {
      void handleFiles(files);
    }
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  // ręczne centrowanie
  function applyCentering(): void {
    if (!currentRef.current) return;
    if (centerChoice === "center" || centerChoice === "bottom") {
      centerObject(currentRef.current, centerChoice);
    }
  }

  // skala
  useEffect(() => {
    if (rootRef.current) rootRef.current.scale.setScalar(scale);
  }, [scale]);

  // wireframe toggle (bez any)
  useEffect(() => {
    const obj = currentRef.current;
    if (!obj) return;

    const setWF = (m: THREE.Material) => {
      (m as WireframeMat).wireframe = wire;
    };

    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      if (Array.isArray(mesh.material)) mesh.material.forEach(setWF);
      else setWF(mesh.material);
    });
  }, [wire]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div
        className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border"
        ref={mountRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {!currentRef.current && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-xl border bg-black/40 backdrop-blur px-4 py-3 text-white text-sm">
              Przeciągnij tu pliki (główny + sidecary):{" "}
              <code>.gltf .glb .obj .mtl .fbx .stl .ply .png .jpg .ktx2 .bin</code>
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-1">
          FPS: {fps}
        </div>
      </div>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>3D Viewer & Converter (client-only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-xs rounded bg-red-500/15 border border-red-500/40 text-red-300 px-2 py-1">
              {error}
            </div>
          )}

          {/* Import */}
          <div className="space-y-2">
            <div className="text-sm">Wczytaj pliki</div>
            <input
              type="file"
              multiple
              accept=".gltf,.glb,.obj,.mtl,.fbx,.stl,.ply,.png,.jpg,.jpeg,.webp,.ktx2,.bin"
              onChange={(e) => {
                const list = e.target.files ? Array.from(e.target.files) : [];
                if (list.length) void handleFiles(list);
              }}
              className="block w-full text-sm file:mr-2 file:rounded-md file:border file:px-2 file:py-1 file:text-xs file:bg-muted"
            />
            <div className="text-[11px] text-muted-foreground">
              Sidecary (MTL/tekstury/bin) są rozwiązywane przez URL modifier.
            </div>
          </div>

          {/* Skala */}
          <div className="space-y-2">
            <div className="text-sm">Skala: {scale.toFixed(2)}</div>
            <Slider value={[scale]} min={0.2} max={3} step={0.05} onValueChange={(v) => setScale(v[0])} />
          </div>

          {/* Wireframe */}
          <div className="flex items-center gap-2">
            <Button variant={wire ? "default" : "secondary"} onClick={() => setWire((w) => !w)}>
              {wire ? "Wireframe ✓" : "Wireframe"}
            </Button>
          </div>

          {/* Ręczne centrowanie */}
          <div className="space-y-2">
            <div className="text-sm">Centrowanie pivotu</div>
            <Select value={centerChoice} onValueChange={(v: UIChoice) => setCenterChoice(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz tryb" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Brak (ręcznie)</SelectItem>
                <SelectItem value="center">Środek bryły</SelectItem>
                <SelectItem value="bottom">Na ziemi (Y=0)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={applyCentering}>Zastosuj centrowanie</Button>
          </div>

          {/* Eksport */}
          <div className="space-y-2">
            <div className="text-sm">Eksportuj jako</div>
            <Select value={exportFmt} onValueChange={(v: ExportFormat) => setExportFmt(v)}>
              <SelectTrigger>
                <SelectValue placeholder="format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="glb">GLB (binary glTF)</SelectItem>
                <SelectItem value="gltf">GLTF (JSON)</SelectItem>
                <SelectItem value="obj">OBJ</SelectItem>
                <SelectItem value="stl">STL</SelectItem>
                <SelectItem value="ply">PLY</SelectItem>
                <SelectItem value="usdz">USDZ</SelectItem>
              </SelectContent>
            </Select>
            <Button
              disabled={!currentRef.current}
              onClick={() => {
                const obj = currentRef.current;
                if (obj) exportObject(obj, exportFmt, name);
              }}
            >
              Eksportuj
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
