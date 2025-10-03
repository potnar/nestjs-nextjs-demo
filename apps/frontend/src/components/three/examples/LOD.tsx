"use client";
import * as THREE from "three";
import { useRef, useState } from "react";
import { useThreeCanvas } from "../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function LODExample() {
  // --- UI state ---
  const [count, setCount] = useState(120);
  const [spread, setSpread] = useState(80);
  const [wireframe, setWireframe] = useState(false);
  // progi LOD (im większa wartość, tym dalej przełącza na niższy detal)
  const [nearDist, setNearDist] = useState(15);
  const [midDist, setMidDist] = useState(35);
  const [farDist, setFarDist] = useState(65);

  // --- refs do synchronizacji wewnątrz onFrame/onBuild ---
  const countRef = useRef(count);
  const spreadRef = useRef(spread);
  const wireRef = useRef(wireframe);
  const nearRef = useRef(nearDist);
  const midRef = useRef(midDist);
  const farRef = useRef(farDist);
  const needsRebuild = useRef(true);

  // statystyki
  const [estMeshes, setEstMeshes] = useState(0);

  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, controls, renderer }) => {
      // scena
      scene.background = new THREE.Color(0x0e0e10);
      scene.add(new THREE.GridHelper(120, 60, 0x444444, 0x222222));
      camera.position.set(0, 40, 90);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();

      // współdzielone geometrie dla poziomów detali
      let geoHigh: THREE.BufferGeometry | null = null;
      let geoMid: THREE.BufferGeometry | null = null;
      let geoLow: THREE.BufferGeometry | null = null;

      // współdzielony materiał – zmieniamy tylko wireframe
      let mat: THREE.MeshStandardMaterial | null = null;

      // światła
      const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 1.0);
      const dir = new THREE.DirectionalLight(0xffffff, 1.0);
      dir.position.set(30, 50, 10);
      scene.add(hemi, dir);

      // aktualny zestaw LOD-ów
      let lods: THREE.LOD[] = [];

      function disposeAll() {
        // usuwamy LOD-y ze sceny (geometrie/materiał współdzielone – zwalniamy niżej)
        for (const lod of lods) scene.remove(lod);
        lods = [];

        // zwolnij zasoby
        geoHigh?.dispose(); geoHigh = null;
        geoMid?.dispose();  geoMid  = null;
        geoLow?.dispose();  geoLow  = null;
        mat?.dispose();     mat     = null;
      }

      function rebuild() {
        disposeAll();

        // wejście z UI
        const N = Math.max(1, Math.floor(countRef.current));
        const S = Math.max(10, spreadRef.current);

        // geometrie (różne subdivision)
        geoHigh = new THREE.IcosahedronGeometry(1.4, 3);
        geoMid  = new THREE.IcosahedronGeometry(1.4, 2);
        geoLow  = new THREE.IcosahedronGeometry(1.4, 0);

        mat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          roughness: 0.45,
          metalness: 0.05,
          wireframe: wireRef.current,
        });

        // ułóż N obiektów z LOD
        for (let i = 0; i < N; i++) {
          const lod = new THREE.LOD();

          // trzy poziomy: high, mid, low
          const meshHigh = new THREE.Mesh(geoHigh, mat);
          const meshMid  = new THREE.Mesh(geoMid,  mat);
          const meshLow  = new THREE.Mesh(geoLow,  mat);

          // odległości przełączania – korzystamy z refs (wartości z UI)
          lod.addLevel(meshHigh, nearRef.current);
          lod.addLevel(meshMid,  midRef.current);
          lod.addLevel(meshLow,  farRef.current);

          // pozycja obiektu w scenie
          const x = (Math.random() - 0.5) * S;
          const z = (Math.random() - 0.5) * S;
          const y = 0;
          lod.position.set(x, y, z);

          // mniej migotania — losowy obrót
          lod.rotation.y = Math.random() * Math.PI;

          scene.add(lod);
          lods.push(lod);
        }

        // statystyka (mniej więcej — realnie widoczny poziom zależy od kamery)
        setEstMeshes(lods.length * 3);
      }

      rebuild();
      needsRebuild.current = false;

      return {
        onFrame: () => {
          // rebuild na życzenie
          if (needsRebuild.current) {
            rebuild();
            needsRebuild.current = false;
          }

          // aktualizacja LOD-ów pod kamerę
          for (const lod of lods) {
            lod.update(camera);
          }

          // lekki obrót całej sceny dla efektu (opcjonalnie)
          // scene.rotation.y += 0.0008; // zostaw zakomentowane jeśli nie chcesz
          renderer.render(scene, camera);
        },
        dispose: () => {
          disposeAll();
          // usuń światła
          scene.remove(hemi, dir);
        }
      };
    },
  });

  // sync UI -> refs
  if (countRef.current !== count) { countRef.current = count; needsRebuild.current = true; }
  if (spreadRef.current !== spread) { spreadRef.current = spread; needsRebuild.current = true; }
  if (wireRef.current !== wireframe) { wireRef.current = wireframe; needsRebuild.current = true; }
  if (nearRef.current !== nearDist) { nearRef.current = nearDist; needsRebuild.current = true; }
  if (midRef.current  !== midDist)  { midRef.current  = midDist;  needsRebuild.current = true; }
  if (farRef.current  !== farDist)  { farRef.current  = farDist;  needsRebuild.current = true; }

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border" ref={mountRef}>
        <div className="absolute top-2 left-2 rounded-md bg-black/50 text-white text-xs px-2 py-1">
          ~Meshes (3 per LOD): {estMeshes}
        </div>
      </div>

      <Card className="col-span-3">
        <CardHeader><CardTitle>LOD – ustawienia</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 text-sm">Ilość obiektów: {count}</div>
            <Slider value={[count]} min={20} max={400} step={10}
              onValueChange={(v) => setCount(Math.round(v[0]))} />
          </div>

          <div>
            <div className="mb-1 text-sm">Obszar (spread): {spread} m</div>
            <Slider value={[spread]} min={20} max={160} step={5}
              onValueChange={(v) => setSpread(Math.round(v[0]))} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="mb-1 text-xs">Near</div>
              <Slider value={[nearDist]} min={5} max={40} step={1}
                onValueChange={(v) => setNearDist(Math.round(v[0]))} />
            </div>
            <div>
              <div className="mb-1 text-xs">Mid</div>
              <Slider value={[midDist]} min={15} max={80} step={1}
                onValueChange={(v) => setMidDist(Math.round(v[0]))} />
            </div>
            <div>
              <div className="mb-1 text-xs">Far</div>
              <Slider value={[farDist]} min={30} max={140} step={1}
                onValueChange={(v) => setFarDist(Math.round(v[0]))} />
            </div>
          </div>

          <Button
            variant={wireframe ? "default" : "secondary"}
            onClick={() => setWireframe((w) => !w)}
          >
            {wireframe ? "Wireframe ✓" : "Wireframe"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
