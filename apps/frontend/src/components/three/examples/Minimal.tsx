"use client";
import * as THREE from "three";
import { useThreeCanvas } from "../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type FrameFn = (object: THREE.Object3D, opts?: { offset?: number }) => void;

export default function Minimal() {
  const ref = useThreeCanvas({
    onBuild: ({
      scene,
      camera,
      controls,
      frame
    }: {
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      controls: OrbitControls;
      /** opcjonalnie: dostarczane przez hook */
      frame?: FrameFn;
    }) => {
      scene.background = new THREE.Color(0x101214);

      // lights
      const amb = new THREE.AmbientLight(0xffffff, 0.4);
      const dir = new THREE.DirectionalLight(0xffffff, 1.0);
      scene.add(amb, dir);

      // box
      const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
      const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      scene.add(box);

      // centrowanie kadru:
      if (typeof frame === "function") {
        // ✨ użyj helpera z hooka – idealne wyśrodkowanie i dopasowanie odległości
        frame(box, { offset: 1.35 });
      } else {
        // 🔙 fallback, jeśli jeszcze nie masz frame() w hooku
        camera.position.set(4, 3, 6);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      let t = 0;
      return {
        onFrame: (dt: number) => {
          t += dt;
          box.rotation.y = t * 0.8;
          box.rotation.x = t * 0.3;
        },
        dispose: () => {
          scene.remove(amb, dir, box);
          boxGeometry.dispose();
          boxMaterial.dispose();
        }
      };
    },
  });

  return (
    <section className="py-8">
      <div className="mx-auto max-w-5xl lg:max-w-6xl px-4">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Canvas */}
          <div className="rounded-2xl border bg-neutral-900/80">
            <div ref={ref} className="h-[360px] md:h-[460px] w-full rounded-2xl overflow-hidden" />
          </div>

          {/* Panel informacyjny */}
          <Card>
            <CardHeader>
              <CardTitle>Minimal – scena</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Najprostszy przykład Three.js:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Światła: Ambient + Directional</li>
                <li>
                  Mesh: <code>BoxGeometry</code> + <code>MeshStandardMaterial</code>
                </li>
                <li>Animacja rotacji w <code>onFrame</code></li>
                <li>Cleanup: <code>dispose()</code> geometrii i materiału</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
