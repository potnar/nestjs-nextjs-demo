"use client";
import * as THREE from "three";
import { useState, useMemo } from "react";
import { useThreeCanvas } from "../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ExampleRaycast() {
  const [selected, setSelected] = useState<string | null>(null);
  const mouse = useMemo(() => new THREE.Vector2(), []);

  const ref = useThreeCanvas({
    onBuild: ({ scene, camera, renderer }) => {
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);
      const spot = new THREE.SpotLight(0xffffff, 1);
      spot.position.set(5, 8, 5);
      scene.add(spot);

      const cubes: THREE.Mesh[] = [];
      const geo = new THREE.BoxGeometry(1, 1, 1);
      for (let x = -2; x <= 2; x += 2) {
        for (let z = -2; z <= 2; z += 2) {
          const mat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5),
          });
          const m = new THREE.Mesh(geo, mat);
          m.position.set(x, 0.5, z);
          m.name = `cube_${x}_${z}`;
          cubes.push(m);
          scene.add(m);
        }
      }

      const raycaster = new THREE.Raycaster();
      const onClick = (event: MouseEvent) => {
        const rect = (renderer.domElement as HTMLCanvasElement).getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(cubes);
        if (hits[0]) {
          const obj = hits[0].object as THREE.Mesh;
          setSelected(obj.name);
          (obj.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x333333);
          (obj.material as THREE.MeshStandardMaterial).color.offsetHSL(0, 0, 0.1);
        }
      };
      renderer.domElement.addEventListener("click", onClick);

      return {
        dispose: () => renderer.domElement.removeEventListener("click", onClick),
      };
    },
  });

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-9 h-[520px] rounded-2xl overflow-hidden border" ref={ref} />
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Raycasting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">Kliknij sześcian, aby go zaznaczyć.</div>
          <div>
            <Badge variant={selected ? "default" : "secondary"}>{selected ?? "nic nie wybrano"}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Pod maską: Raycaster → intersectObjects → pierwszy trafiony mesh.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
