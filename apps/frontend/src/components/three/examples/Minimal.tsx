"use client";
import * as THREE from "three";
import { useState } from "react";
import { useThreeCanvas } from "../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function ExampleMinimal() {
  const [metalness, setMetalness] = useState(0.1);
  const [roughness, setRoughness] = useState(0.5);
  const [wireframe, setWireframe] = useState(false);

  const ref = useThreeCanvas({
    onBuild: ({ scene, camera }) => {
      scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.1));
      const dir = new THREE.DirectionalLight(0xffffff, 1);
      dir.position.set(5, 5, 5);
      scene.add(dir);
      scene.add(new THREE.GridHelper(20, 20, 0x444444, 0x222222));

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x66ccff, metalness, roughness, wireframe })
      );
      box.position.y = 0.5;
      scene.add(box);

      const ring = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.6, 0.2, 200, 32),
        new THREE.MeshStandardMaterial({ color: 0xff6699, metalness: 0.8, roughness: 0.2 })
      );
      ring.position.set(-2, 1, 0);
      scene.add(ring);

      camera.lookAt(box.position);

      return {
        onFrame: (dt) => {
          ring.rotation.x += dt * 0.5;
          ring.rotation.y += dt * 0.8;
          const m = box.material as THREE.MeshStandardMaterial;
          m.metalness = metalness;
          m.roughness = roughness;
          (m as any).wireframe = wireframe;
        },
      };
    },
  });

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-9 h-[520px] rounded-2xl overflow-hidden border" ref={ref} />
      <Card className="col-span-3">
        <CardHeader><CardTitle>Ustawienia materiału</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 text-sm">Metalness: {metalness.toFixed(2)}</div>
            <Slider value={[metalness]} step={0.01} min={0} max={1} onValueChange={(v)=>setMetalness(v[0])} />
          </div>
          <div>
            <div className="mb-2 text-sm">Roughness: {roughness.toFixed(2)}</div>
            <Slider value={[roughness]} step={0.01} min={0} max={1} onValueChange={(v)=>setRoughness(v[0])} />
          </div>
          <Button variant={wireframe? "default":"secondary"} onClick={()=>setWireframe(!wireframe)}>
            {wireframe? "Wyłącz wireframe":"Włącz wireframe"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
