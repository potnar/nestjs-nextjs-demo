"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { Link } from "@/i18n/navigation";

const SAND = "#C9B896";

const rippleVert = /* glsl */ `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rippleFrag = /* glsl */ `
  uniform float u_time;
  varying vec2 v_uv;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float starField(vec2 uv) {
    float scale = 55.0;
    vec2 gv = fract(uv * scale) - 0.5;
    vec2 id = floor(uv * scale);
    float h = hash21(id);
    float size = mix(0.015, 0.0375, hash21(id + 0.5));
    float star = 1.0 - smoothstep(size, size * 2.0, length(gv));
    return star * step(0.82, h);
  }

  void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = length(v_uv - center);

    // maska
    float edge  = 1.0 - smoothstep(0.22, 0.5, dist);
    float inner = smoothstep(0.0, 0.04, dist);
    float mask  = edge * inner;

    // fale
    float wave_phase = dist * 12.0 - u_time * 0.63;
    float f    = abs(fract(wave_phase) - 0.5) * 2.0;
    float ring = 1.0 - smoothstep(0.03, 0.45, f);

    // nachylenie powierzchni = cos(phase) * kierunek_radialny
    // cos = 0 na grzbiecie fali (płasko), ±1 na zboczu (max. refrakcja)
    float slope = cos(wave_phase);
    vec2 radial = dist > 0.001 ? (v_uv - center) / dist : vec2(0.0);
    vec2 refraction = radial * slope * mask * 0.0125;

    // odkształcone UV dla gwiazd
    vec2 refracted_uv = v_uv + refraction;
    float star = starField(refracted_uv) * mask;

    vec3 ring_color = vec3(0.18, 0.35, 0.78);
    vec3 star_color = vec3(0.75, 0.85, 1.0);

    vec3 color = ring_color * ring * mask + star_color * star * 2.0;
    float alpha = ring * mask * 0.42 + star * 0.85;

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

function RipplePlane() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
  }), []);

  useFrame(({ clock }) => {
    const mat = meshRef.current?.material as THREE.ShaderMaterial | undefined;
    if (mat?.uniforms) mat.uniforms.u_time.value = clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
      <planeGeometry args={[9.5, 9.5, 1, 1]} />
      <shaderMaterial
        vertexShader={rippleVert}
        fragmentShader={rippleFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function CameraLookAt() {
  const { camera } = useThree();
  useFrame(() => { camera.lookAt(0, 1.2, 0); });
  return null;
}

function Scene() {
  return (
    <>
      <CameraLookAt />
      <Stars radius={80} depth={50} count={4000} factor={3} fade speed={0.3} />
      <RipplePlane />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 4, 2]} intensity={1.2} color="#7ab8d4" />
    </>
  );
}

type Tile = { href: string; title: string; description: string };

export default function HubScene({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="relative w-full h-[calc(100vh-56px)] overflow-hidden">
      {/* Three.js background */}
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 3, 6], fov: 55 }}
        style={{ background: "#05060f" }}
      >
        <Scene />
      </Canvas>

      {/* Floating card */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: "1200px" }}>
        <div
          className="pointer-events-auto w-full max-w-2xl mx-4"
          style={{
            animation: "float3d 5s ease-in-out infinite",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(201,184,150,0.25)",
              borderRadius: "4px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(201,184,150,0.05)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Card header */}
            <div
              className="px-8 py-5"
              style={{ borderBottom: "1px solid rgba(201,184,150,0.15)" }}
            >
              <h1
                className="text-xs tracking-[0.25em] uppercase font-normal"
                style={{ color: SAND }}
              >
                DevLab Hub
              </h1>
            </div>

            {/* Tiles grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px p-px" style={{ background: "rgba(201,184,150,0.1)", transformStyle: "preserve-3d" }}>
              {tiles.map(({ href, title, description }) => (
                <Link
                  key={href}
                  href={href}
                  className="hub-tile block p-5"
                  style={{
                    background: "rgba(5,6,15,0.9)",
                    border: "1px solid rgba(201,184,150,0.35)",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    className="text-xs mb-1.5 font-medium tracking-wide group-hover:opacity-100 transition-opacity"
                    style={{ color: SAND, opacity: 0.9 }}
                  >
                    {title}
                  </div>
                  <div
                    className="text-[10px] leading-relaxed"
                    style={{ color: SAND, opacity: 0.45 }}
                  >
                    {description}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float3d {
          0%, 100% { transform: rotateY(15deg) rotateX(10deg) translateY(0px); }
          50%       { transform: rotateY(15deg) rotateX(10deg) translateY(-10px); }
        }
        .hub-tile {
          transition: transform 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      box-shadow 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform: translateZ(0px) scale(1);
        }
        .hub-tile:hover {
          transform: translateZ(50px) scale(1.2);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          z-index: 10;
          position: relative;
        }
      `}</style>
    </div>
  );
}
