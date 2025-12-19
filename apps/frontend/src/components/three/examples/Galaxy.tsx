"use client";
import * as THREE from "three";
import { useRef, useState } from "react";
import { useThreeCanvas } from "../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function Galaxy() {
  const [count, setCount] = useState(5000);
  const [size, setSize] = useState(0.05);
  const [radius, setRadius] = useState(5);
  const [branches, setBranches] = useState(3);
  const [spin, setSpin] = useState(1);
  const [randomness, setRandomness] = useState(0.2);
  const [randomnessPower, setRandomnessPower] = useState(3);
  const [insideColor, setInsideColor] = useState("#ff6030");
  const [outsideColor, setOutsideColor] = useState("#1b3984");

  const countRef = useRef(count);
  const sizeRef = useRef(size);
  const radiusRef = useRef(radius);
  const branchesRef = useRef(branches);
  const spinRef = useRef(spin);
  const randomnessRef = useRef(randomness);
  const randomnessPowerRef = useRef(randomnessPower);
  const insideColorRef = useRef(insideColor);
  const outsideColorRef = useRef(outsideColor);
  const needsRebuild = useRef(true);

  // Sync refs
  if (countRef.current !== count) { countRef.current = count; needsRebuild.current = true; }
  if (sizeRef.current !== size) { sizeRef.current = size; needsRebuild.current = true; }
  if (radiusRef.current !== radius) { radiusRef.current = radius; needsRebuild.current = true; }
  if (branchesRef.current !== branches) { branchesRef.current = branches; needsRebuild.current = true; }
  if (spinRef.current !== spin) { spinRef.current = spin; needsRebuild.current = true; }
  if (randomnessRef.current !== randomness) { randomnessRef.current = randomness; needsRebuild.current = true; }
  if (randomnessPowerRef.current !== randomnessPower) { randomnessPowerRef.current = randomnessPower; needsRebuild.current = true; }
  if (insideColorRef.current !== insideColor) { insideColorRef.current = insideColor; needsRebuild.current = true; }
  if (outsideColorRef.current !== outsideColor) { outsideColorRef.current = outsideColor; needsRebuild.current = true; }

  const ref = useThreeCanvas({
    onBuild: ({ scene, camera, controls }) => {
      scene.background = new THREE.Color(0x000000);

      let geometry: THREE.BufferGeometry | null = null;
      let material: THREE.PointsMaterial | null = null;
      let points: THREE.Points | null = null;

      camera.position.set(3, 3, 3);
      controls.enableDamping = true;

      const generateGalaxy = () => {
        if (points) {
          geometry!.dispose();
          material!.dispose();
          scene.remove(points);
        }

        geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(countRef.current * 3);
        const colors = new Float32Array(countRef.current * 3);

        const colorInside = new THREE.Color(insideColorRef.current);
        const colorOutside = new THREE.Color(outsideColorRef.current);

        for (let i = 0; i < countRef.current; i++) {
          const i3 = i * 3;

          // Position
          const r = Math.random() * radiusRef.current;
          const spinAngle = r * spinRef.current;
          const branchAngle = (i % branchesRef.current) / branchesRef.current * Math.PI * 2;

          const randomX = Math.pow(Math.random(), randomnessPowerRef.current) * (Math.random() < 0.5 ? 1 : -1) * randomnessRef.current * r;
          const randomY = Math.pow(Math.random(), randomnessPowerRef.current) * (Math.random() < 0.5 ? 1 : -1) * randomnessRef.current * r;
          const randomZ = Math.pow(Math.random(), randomnessPowerRef.current) * (Math.random() < 0.5 ? 1 : -1) * randomnessRef.current * r;

          positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
          positions[i3 + 1] = randomY;
          positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

          // Color
          const mixedColor = colorInside.clone();
          mixedColor.lerp(colorOutside, r / radiusRef.current);

          colors[i3] = mixedColor.r;
          colors[i3 + 1] = mixedColor.g;
          colors[i3 + 2] = mixedColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        material = new THREE.PointsMaterial({
          size: sizeRef.current,
          sizeAttenuation: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexColors: true
        });

        points = new THREE.Points(geometry, material);
        scene.add(points);
      };

      generateGalaxy();

      let time = 0;
      return {
        onFrame: (dt) => {
          time += dt;
          if (needsRebuild.current) {
            generateGalaxy();
            needsRebuild.current = false;
          }
          if (points) {
            points.rotation.y = time * 0.05;
          }
        },
        dispose: () => {
          if (points) {
            geometry?.dispose();
            material?.dispose();
            scene.remove(points);
          }
        }
      };
    }
  });

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="relative col-span-12 lg:col-span-8 h-[500px] rounded-2xl overflow-hidden border" ref={ref} />
      
      <Card className="col-span-12 lg:col-span-4 max-h-[500px] overflow-y-auto">
        <CardHeader>
          <CardTitle>Generator Galaktyki</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Liczba gwiazd: {count}</div>
            <Slider value={[count]} min={100} max={20000} step={100} onValueChange={(v) => setCount(v[0])} />
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Rozmiar: {size}</div>
            <Slider value={[size]} min={0.001} max={0.1} step={0.001} onValueChange={(v) => setSize(v[0])} />
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Promień: {radius}</div>
            <Slider value={[radius]} min={0.01} max={20} step={0.01} onValueChange={(v) => setRadius(v[0])} />
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Ramiona: {branches}</div>
            <Slider value={[branches]} min={2} max={10} step={1} onValueChange={(v) => setBranches(v[0])} />
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Zakręcenie: {spin}</div>
            <Slider value={[spin]} min={-2} max={2} step={0.1} onValueChange={(v) => setSpin(v[0])} />
          </div>
          <div>
            <div className="text-sm font-medium mb-2">Randomness: {randomness}</div>
            <Slider value={[randomness]} min={0} max={2} step={0.01} onValueChange={(v) => setRandomness(v[0])} />
          </div>
           {/* Colors roughly */}
           <div className="flex gap-2 items-center justify-between">
              <span className="text-sm">Kolor wew.</span>
              <input type="color" value={insideColor} onChange={(e) => setInsideColor(e.target.value)} />
           </div>
           <div className="flex gap-2 items-center justify-between">
              <span className="text-sm">Kolor zew.</span>
              <input type="color" value={outsideColor} onChange={(e) => setOutsideColor(e.target.value)} />
           </div>
           
           <div className="pt-4">
             <Button onClick={() => needsRebuild.current = true} className="w-full">Regeneruj</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
