"use client";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useThreeCanvas } from "../../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

type Effect = "hologram" | "toon" | "dissolve";

// wspólny vertex: światowe pozycje i normale
const VERT = /* glsl */`
  uniform float uTime;
  varying vec3 vWP;
  varying vec3 vWN;
  varying vec2 vUv;
  mat3 m3(mat4 m){ return mat3(m[0].xyz, m[1].xyz, m[2].xyz); }
  void main(){
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position,1.0);
    vWP = wp.xyz;
    vWN = normalize(m3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Hologram
const FRAG_HOLOGRAM = /* glsl */`
  precision highp float;
  uniform float uTime, uLineSpeed, uLineDensity, uRimPower;
  uniform vec3 uColorA, uColorB;
  varying vec3 vWP, vWN;
  void main(){
    vec3 V = normalize(cameraPosition - vWP);
    float fres = pow(1.0 - max(dot(normalize(vWN), V), 0.0), uRimPower);
    float stripes = 0.5 + 0.5 * sin(vWP.y * uLineDensity + uTime * uLineSpeed);
    vec3 base = mix(uColorA, uColorB, stripes);
    vec3 col = base + vec3(0.9,1.0,1.0)*fres*0.7;
    gl_FragColor = vec4(col, 0.9);
  }
`;
// Toon
const FRAG_TOON = /* glsl */`
  precision highp float;
  uniform vec3 uLightDir, uBaseColor;
  uniform int uBands;
  uniform float uRimPower;
  varying vec3 vWP, vWN;
  void main(){
    vec3 N = normalize(vWN), L = normalize(uLightDir);
    float ndl = max(dot(N,L),0.0);
    float q = floor(ndl*float(uBands))/float(uBands);
    vec3 V = normalize(cameraPosition - vWP);
    float rim = pow(1.0 - max(dot(N,V),0.0), uRimPower);
    vec3 col = uBaseColor * (0.25 + 0.75*q) + rim*0.6;
    gl_FragColor = vec4(col,1.0);
  }
`;
// Dissolve
const FRAG_DISSOLVE = /* glsl */`
  precision highp float;
  uniform float uTime, uThreshold, uEdge, uFreq;
  uniform vec3 uColorIn, uColorEdge;
  varying vec3 vWP;
  float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
  void main(){
    float n = hash(floor(vWP * uFreq + vec3(0.0, uTime*0.7, 0.0)));
    if (n < uThreshold) discard;
    float e = smoothstep(uThreshold + uEdge, uThreshold, n);
    vec3 col = mix(uColorIn, uColorEdge, e);
    gl_FragColor = vec4(col,1.0);
  }
`;

export default function Showcase() {
  const [effect, setEffect] = useState<Effect>("hologram");
  const [wire, setWire] = useState(false);
  const [fps, setFps] = useState(0);

  // holo
  const [lineSpeed, setLineSpeed] = useState(2.0);
  const [lineDensity, setLineDensity] = useState(12.0);
  const [rimHolo, setRimHolo] = useState(2.0);
  // toon
  const [bands, setBands] = useState(4);
  const [rimToon, setRimToon] = useState(3.0);
  // dissolve
  const [thr, setThr] = useState(0.4);
  const [edge, setEdge] = useState(0.08);
  const [freq, setFreq] = useState(2.5);

  const meshRef = useRef<THREE.Mesh | null>(null);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const fpsAvgRef = useRef(0);
  const hudRef = useRef(0);

  const makeMaterial = (eff: Effect) => {
    if (eff === "hologram") {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uLineSpeed:  { value: lineSpeed },
          uLineDensity:{ value: lineDensity },
          uRimPower:   { value: rimHolo },
          uColorA:     { value: new THREE.Color("#00d1ff") },
          uColorB:     { value: new THREE.Color("#10b981") },
        },
        vertexShader: VERT, fragmentShader: FRAG_HOLOGRAM,
        transparent: true, wireframe: wire,
      });
    }
    if (eff === "toon") {
      return new THREE.ShaderMaterial({
        uniforms: {
          uLightDir: { value: new THREE.Vector3(0.4,1,0.2).normalize() },
          uBands:    { value: bands },
          uRimPower: { value: rimToon },
          uBaseColor:{ value: new THREE.Color("#4f46e5") },
        },
        vertexShader: VERT, fragmentShader: FRAG_TOON,
        wireframe: wire,
      });
    }
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uThreshold: { value: thr }, uEdge: { value: edge }, uFreq: { value: freq },
        uColorIn: { value: new THREE.Color("#f59e0b") }, uColorEdge: { value: new THREE.Color("#ffffff") },
      },
      vertexShader: VERT, fragmentShader: FRAG_DISSOLVE,
      transparent: true, wireframe: wire,
    });
  };

  const mountRef = useThreeCanvas({
    onBuild: ({ scene, camera, controls, frame }) => {
      scene.background = new THREE.Color(0x0b1020);
      scene.add(new THREE.GridHelper(40,40), new THREE.AxesHelper(3));
      camera.position.set(0, 6, 14);
      camera.far = 1000; camera.updateProjectionMatrix();
      controls.target.set(0,0,0); controls.update();

      const geom = new THREE.SphereGeometry(4.5, 128, 64);
      const mat = makeMaterial(effect);
      const mesh = new THREE.Mesh(geom, mat);
      meshRef.current = mesh; 
      matRef.current = mat;
      scene.add(mesh);
      scene.updateMatrixWorld(true);
      frame(mesh, { offset: 1.65 });

      return {
        onFrame: (dt: number) => {
          const m = matRef.current;
          if (m?.uniforms.uTime) m.uniforms.uTime.value += dt;
          const now = 1/Math.max(1e-6, dt);
          fpsAvgRef.current = fpsAvgRef.current ? fpsAvgRef.current*0.9 + now*0.1 : now;
          hudRef.current += dt; if (hudRef.current > .25) { hudRef.current = 0; setFps(Math.round(fpsAvgRef.current)); }
        }
      };
    }
  });

  // podmiana materiału przy zmianie efektu
  useEffect(() => {
    if (!meshRef.current) return;
    const old = meshRef.current.material as THREE.Material;
    const mat = makeMaterial(effect);
    meshRef.current.material = mat; matRef.current = mat;
    setTimeout(()=>old.dispose(),0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect]);

  // UI -> uniforms
  useEffect(() => { if (matRef.current) matRef.current.wireframe = wire; }, [wire]);
  useEffect(() => { const m=matRef.current; if (m && effect==="hologram"){ m.uniforms.uLineSpeed.value=lineSpeed; m.uniforms.uLineDensity.value=lineDensity; m.uniforms.uRimPower.value=rimHolo;} }, [lineSpeed,lineDensity,rimHolo,effect]);
  useEffect(() => { const m=matRef.current; if (m && effect==="toon"){ m.uniforms.uBands.value=bands; m.uniforms.uRimPower.value=rimToon;} }, [bands,rimToon,effect]);
  useEffect(() => { const m=matRef.current; if (m && effect==="dissolve"){ m.uniforms.uThreshold.value=thr; m.uniforms.uEdge.value=edge; m.uniforms.uFreq.value=freq;} }, [thr,edge,freq,effect]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border bg-black/20" ref={mountRef}>
        <div className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-1 space-y-0.5">
          <div>FPS: {fps}</div>
          <div>Effect: {effect}</div>
        </div>
      </div>
      <Card className="col-span-3">
        <CardHeader><CardTitle>Shader Showcase</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={()=>setEffect("hologram")} variant={effect==="hologram"?"default":"secondary"}>Hologram</Button>
            <Button onClick={()=>setEffect("toon")} variant={effect==="toon"?"default":"secondary"}>Toon</Button>
            <Button onClick={()=>setEffect("dissolve")} variant={effect==="dissolve"?"default":"secondary"}>Dissolve</Button>
          </div>

          {effect==="hologram" && <>
            <div className="text-sm mt-2">Line speed: {lineSpeed.toFixed(2)}</div>
            <Slider value={[lineSpeed]} min={0} max={6} step={0.05} onValueChange={v=>setLineSpeed(v[0])}/>
            <div className="text-sm">Line density: {lineDensity.toFixed(1)}</div>
            <Slider value={[lineDensity]} min={1} max={30} step={0.5} onValueChange={v=>setLineDensity(v[0])}/>
            <div className="text-sm">Rim power: {rimHolo.toFixed(1)}</div>
            <Slider value={[rimHolo]} min={0.5} max={6} step={0.1} onValueChange={v=>setRimHolo(v[0])}/>
          </>}

          {effect==="toon" && <>
            <div className="text-sm mt-2">Bands: {bands}</div>
            <Slider value={[bands]} min={2} max={8} step={1} onValueChange={v=>setBands(v[0])}/>
            <div className="text-sm">Rim power: {rimToon.toFixed(1)}</div>
            <Slider value={[rimToon]} min={0.5} max={6} step={0.1} onValueChange={v=>setRimToon(v[0])}/>
          </>}

          {effect==="dissolve" && <>
            <div className="text-sm mt-2">Threshold: {thr.toFixed(2)}</div>
            <Slider value={[thr]} min={0} max={1} step={0.01} onValueChange={v=>setThr(v[0])}/>
            <div className="text-sm">Edge width: {edge.toFixed(2)}</div>
            <Slider value={[edge]} min={0} max={0.3} step={0.01} onValueChange={v=>setEdge(v[0])}/>
            <div className="text-sm">Noise freq: {freq.toFixed(2)}</div>
            <Slider value={[freq]} min={0.5} max={6} step={0.05} onValueChange={v=>setFreq(v[0])}/>
          </>}
          <Button variant={wire ? "default" : "secondary"} onClick={()=>setWire(w=>!w)}>{wire ? "Wireframe ✓" : "Wireframe"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
