"use client";
import * as THREE from "three";
import { useState } from "react";
import { useThreeCanvas } from "../../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const frag = `
precision highp float;
uniform float u_time;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  float stripe = smoothstep(0.45, 0.55, sin(uv.x*10.0 + u_time*2.0)*0.5+0.5);
  vec3 col = mix(vec3(0.1,0.2,0.6), vec3(0.9,0.2,0.5), stripe);
  gl_FragColor = vec4(col, 1.0);
}`;

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;


export default function Animation() {
  const [speed, setSpeed] = useState<number>(1.0);

  const ref = useThreeCanvas({
    onBuild: ({ scene }) => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 3, 1, 1),
        new THREE.ShaderMaterial({
          vertexShader: vert,
          fragmentShader: frag,
          uniforms: { u_time: { value: 0 } },
        })
      );
      scene.add(plane);

      return {
        onFrame: (dt, t) => {
          (plane.material as THREE.ShaderMaterial).uniforms.u_time.value = t * speed;
        },
      };
    },
  });

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-9 h-[520px] rounded-2xl overflow-hidden border" ref={ref} />
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Shader – animowany gradient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-2 text-sm">Prędkość: {speed.toFixed(2)}x</div>
            <Slider value={[speed]} step={0.1} min={0} max={3} onValueChange={(v) => setSpeed(v[0])} />
          </div>
          <div className="text-xs text-muted-foreground">
            Minimalny vertex/fragment shader z uniformem <code>u_time</code>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
