"use client";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useThreeCanvas } from "../../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

// GLSL
const VERT = /* glsl */`
  uniform float uTime;
  uniform float uAmp;
  uniform vec2  uFreq;
  varying vec2  vUv;
  varying float vH;
  void main() {
    vUv = uv;
    vec3 p = position;
    float w = sin(p.x * uFreq.x + uTime) * cos(p.y * uFreq.y + uTime * 0.8);
    p.z += w * uAmp;
    vH = p.z;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const FRAG = /* glsl */`
  precision highp float;
  uniform vec3 uColorA, uColorB;
  varying vec2 vUv; varying float vH;
  void main() {
    float t = smoothstep(-1.0, 1.0, vH);
    vec3 col = mix(uColorA, uColorB, t);
    float vign = smoothstep(0.9, 0.0, distance(vUv, vec2(0.5)));
    gl_FragColor = vec4(col * mix(0.7,1.0,vign), 1.0);
  }
`;

export default function WavyPlane() {
  const [amp, setAmp] = useState(0.8);
  const [fx, setFx] = useState(4);
  const [fy, setFy] = useState(3);
  const [speed, setSpeed] = useState(1.0);
  const [wire, setWire] = useState(false);
  const [fps, setFps] = useState(0);

  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const fpsAvgRef = useRef(0);
  const hudRef = useRef(0);

  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, controls }) => {
      scene.background = new THREE.Color(0x0b1020);
      scene.add(new THREE.GridHelper(100, 50), new THREE.AxesHelper(5));
      camera.position.set(0, 10, 22);
      camera.far = 1000; camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0); controls.update();

      const geom = new THREE.PlaneGeometry(30, 30, 200, 200);
      geom.rotateX(-Math.PI / 2);

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:   { value: 0 },
          uAmp:    { value: amp },
          uFreq:   { value: new THREE.Vector2(fx, fy) },
          uColorA: { value: new THREE.Color("#3b82f6") },
          uColorB: { value: new THREE.Color("#10b981") },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
        wireframe: wire,
      });
      matRef.current = mat;

      const mesh = new THREE.Mesh(geom, mat);
      scene.add(mesh);

      return {
        onFrame: (dt: number) => {
          // time
          if (matRef.current) matRef.current.uniforms.uTime.value += dt * speed;

          // fps hud
          const now = 1 / Math.max(1e-6, dt);
          fpsAvgRef.current = fpsAvgRef.current ? fpsAvgRef.current * 0.9 + now * 0.1 : now;
          hudRef.current += dt;
          if (hudRef.current > 0.25) { hudRef.current = 0; setFps(Math.round(fpsAvgRef.current)); }
        },
      };
    },
  });

  // UI -> uniforms
  useEffect(() => { matRef.current && (matRef.current.wireframe = wire); }, [wire]);
  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uAmp.value = amp;
    (matRef.current.uniforms.uFreq.value as THREE.Vector2).set(fx, fy);
  }, [amp, fx, fy]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border bg-black/20" ref={mountRef}>
        <div className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-1 space-y-0.5">
          <div>FPS: {fps}</div>
        </div>
      </div>
      <Card className="col-span-3">
        <CardHeader><CardTitle>Falująca siatka</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><div className="text-sm mb-1">Amplituda</div><Slider value={[amp]} min={0} max={2} step={0.05} onValueChange={v=>setAmp(v[0])}/></div>
          <div><div className="text-sm mb-1">Freq X</div><Slider value={[fx]} min={0} max={10} step={0.1} onValueChange={v=>setFx(v[0])}/></div>
          <div><div className="text-sm mb-1">Freq Y</div><Slider value={[fy]} min={0} max={10} step={0.1} onValueChange={v=>setFy(v[0])}/></div>
          <div><div className="text-sm mb-1">Speed</div><Slider value={[speed]} min={0} max={3} step={0.05} onValueChange={v=>setSpeed(v[0])}/></div>
          <Button variant={wire ? "default" : "secondary"} onClick={()=>setWire(w=>!w)}>{wire ? "Wireframe ✓" : "Wireframe"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
