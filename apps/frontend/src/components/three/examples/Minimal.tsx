"use client";
import * as THREE from "three";
import { useThreeCanvas } from "../useThreeCanvas";

export default function Minimal() {
  const ref = useThreeCanvas({
    onBuild: ({ scene, camera }) => {
      scene.background = new THREE.Color(0x101214);

      const amb = new THREE.AmbientLight(0xffffff, 0.4);
      const dir = new THREE.DirectionalLight(0xffffff, 1.0);

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
      );

      scene.add(amb, dir, box);

      camera.position.set(4, 3, 6);
      camera.lookAt(0, 0, 0);

      let t = 0;
      return {
        onFrame: (dt: number) => {
          t += dt;
          box.rotation.y = t * 0.8;
          box.rotation.x = t * 0.3;
        },
        dispose: () => {
          // Zwolnij geometrie/materiały wszystkich Meshy
          scene.traverse((obj: THREE.Object3D) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              mesh.geometry?.dispose();
              const mat = mesh.material;
              if (Array.isArray(mat)) {
                mat.forEach((m: THREE.Material) => m.dispose());
              } else {
                (mat as THREE.Material)?.dispose?.();
              }
            }
          });

          // Usuń obiekty ze sceny
          scene.remove(amb, dir, box);
        }
      };
    },
  });

  return <div ref={ref} className="h-[320px] rounded-2xl border" />;
}
