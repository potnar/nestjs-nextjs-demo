"use client";

import React, { useState, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Float,
  Text,
  Points,
  PointMaterial,
  Stars,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";
import { EXAMPLE_LABELS, type ExampleKey } from "../index";

type SpaceHub3DProps = {
  onSelect: (key: ExampleKey) => void;
};

export default function SpaceHub3D({ onSelect }: SpaceHub3DProps) {
  const exampleEntries = useMemo(() => Object.entries(EXAMPLE_LABELS), []);

  return (
    <div className="relative w-full h-[85vh] bg-[#000105] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
      <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 0, 20], fov: 45 }}>
        <color attach="background" args={["#000105"]} />

        <ambientLight intensity={0.15} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#f472b6" />

        <NebulaCloud />

        <Stars
          radius={100}
          depth={50}
          count={8000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <GalaxyBackground />

        <CentralCore />

        <group>
          {exampleEntries.map(([key, label], index) => (
            <HubNode
              key={key}
              index={index}
              total={exampleEntries.length}
              label={label}
              onClick={() => onSelect(key as ExampleKey)}
            />
          ))}
        </group>

        <OrbitControls
          enablePan={false}
          minDistance={10}
          maxDistance={40}
          autoRotate
          autoRotateSpeed={0.3}
          makeDefault
        />

        <Environment preset="night" />
      </Canvas>

      <div className="absolute bottom-6 left-8 pointer-events-none">
        <h2 className="text-white text-4xl font-black tracking-tighter drop-shadow-2xl">
          Space Hub
        </h2>
        <p className="text-sky-400 text-xs mt-1 uppercase tracking-[0.3em] font-semibold opacity-80">
          Interactive 3D Laboratory
        </p>
      </div>

      <div className="absolute top-6 right-8 p-5 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 text-white text-[10px] hidden lg:block max-w-[200px] shadow-2xl">
        <p className="opacity-70 leading-relaxed">
          Kliknij w orbitujący moduł, aby wejść do konkretnego demo. Użyj myszki
          do rotacji i przybliżania.
        </p>
      </div>
    </div>
  );
}

function NebulaCloud() {
  const count = 30;
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 20 + Math.random() * 15;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      temp.push({
        x,
        y,
        z,
        size: 8 + Math.random() * 12,
        color: i % 2 === 0 ? "#38bdf8" : i % 3 === 0 ? "#818cf8" : "#f472b6",
      });
    }
    return temp;
  }, []);

  return (
    <group>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 16, 16]} />
          <meshStandardMaterial
            color={p.color}
            transparent
            opacity={0.04}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function CentralCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.3;
      coreRef.current.scale.setScalar(1 + Math.sin(time) * 0.05);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.15;
      ringRef.current.rotation.x = Math.sin(time * 0.5) * 0.3;
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[2.5, 10]} />
        <meshStandardMaterial
          color="#f472b6"
          emissive="#f472b6"
          emissiveIntensity={2}
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4, 0.03, 16, 100]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={5}
          />
        </mesh>
      </group>

      <pointLight intensity={3} distance={15} color="#f472b6" />
    </group>
  );
}

function HubNode({
  index,
  total,
  label,
  onClick,
}: {
  index: number;
  total: number;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Group>(null);
  const streakRef = useRef<THREE.Mesh>(null);

  const nodeColor = useMemo(() => {
    const colors = ["#38bdf8", "#818cf8", "#f472b6", "#fbbf24", "#34d399"];
    return colors[index % colors.length];
  }, [index]);

  const orbitRadius = useMemo(() => 8 + (index % 3) * 3, [index]);
  const speed = useMemo(() => 0.1 + (index % 2 === 0 ? 0.05 : -0.1), [index]);
  const angleOffset = (index / total) * Math.PI * 2;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      const angle = time * speed + angleOffset;
      meshRef.current.position.x = Math.cos(angle) * orbitRadius;
      meshRef.current.position.z = Math.sin(angle) * orbitRadius;
      meshRef.current.position.y = Math.sin(time * 0.5 + index) * 1.5;
      meshRef.current.lookAt(0, 0, 0);
    }
    if (streakRef.current) {
      streakRef.current.scale.y = 1 + Math.sin(time * 2 + index) * 0.5;
      const mat = streakRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.opacity = 0.2 + Math.sin(time * 3 + index) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <group
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* Hexagon Frame */}
          <mesh rotation={[0, 0, Math.PI / 6]}>
            <ringGeometry args={[1, 1.1, 6]} />
            <meshStandardMaterial
              color={nodeColor}
              emissive={nodeColor}
              emissiveIntensity={hovered ? 15 : 4}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Outer Soft Glow */}
          <mesh rotation={[0, 0, Math.PI / 6]}>
            <ringGeometry args={[0.9, 1.3, 6]} />
            <meshStandardMaterial
              color={nodeColor}
              emissive={nodeColor}
              emissiveIntensity={2}
              transparent
              opacity={0.1}
            />
          </mesh>

          {/* Central Crystal */}
          <mesh castShadow>
            <icosahedronGeometry args={[0.55, 1]} />
            <meshStandardMaterial
              color={hovered ? "#ffffff" : nodeColor}
              emissive={nodeColor}
              emissiveIntensity={hovered ? 12 : 3}
              metalness={1}
              roughness={0}
            />
          </mesh>

          {/* Light Streak/Ray */}
          <mesh ref={streakRef} position={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.015, 0.015, 6, 8]} />
            <meshStandardMaterial
              color={nodeColor}
              transparent
              opacity={0.2}
              emissive={nodeColor}
              emissiveIntensity={5}
            />
          </mesh>
        </group>

        <Text
          position={[0, -1.8, 0.1]}
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={3}
          textAlign="center"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        >
          {label.split(":")[0]}
          <meshStandardMaterial
            emissive="white"
            emissiveIntensity={hovered ? 2 : 0.3}
          />
        </Text>
      </Float>
    </group>
  );
}

function GalaxyBackground() {
  const count = 8000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random();
      const r = 30 + Math.random() * 30;
      const arms = 4;
      const armIndex = Math.floor(Math.random() * arms);
      const armAngle = (armIndex / arms) * Math.PI * 2 + r * 0.15;
      const spread = (1 / (r * 0.25)) * 6;

      pos[i * 3] = Math.cos(armAngle + (Math.random() - 0.5) * spread) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * (r * 0.15);
      pos[i * 3 + 2] = Math.sin(armAngle + (Math.random() - 0.5) * spread) * r;
    }
    return pos;
  }, []);

  return (
    <Points positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#818cf8"
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.4}
      />
    </Points>
  );
}
