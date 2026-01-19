"use client";

import React, { useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Float,
  Text,
  Points,
  PointMaterial,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";
import { EXAMPLE_LABELS, type ExampleKey } from "../index";

type SpaceHub3DProps = {
  onSelect: (key: ExampleKey) => void;
};

export default function SpaceHub3D({ onSelect }: SpaceHub3DProps) {
  return (
    <div className="relative w-full h-[80vh] bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 15], fov: 45 }}>
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        <GalaxyBackground />
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <group>
          {Object.entries(EXAMPLE_LABELS).map(([key, label], index) => (
            <HubNode
              key={key}
              index={index}
              total={Object.keys(EXAMPLE_LABELS).length}
              label={label}
              onClick={() => onSelect(key as ExampleKey)}
            />
          ))}
        </group>

        <OrbitControls
          enablePan={false}
          minDistance={10}
          maxDistance={30}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>

      <div className="absolute bottom-6 left-6 pointer-events-none">
        <h2 className="text-white text-3xl font-bold tracking-tighter sm:text-4xl">
          Space Hub
        </h2>
        <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest">
          Interactive 3D Laboratory
        </p>
      </div>

      <div className="absolute top-6 right-6 p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-white text-[10px] hidden md:block max-w-[200px]">
        Kliknij w orbitujący moduł, aby wejść do konkretnego demo. Użyj myszki
        do rotacji i przybliżania.
      </div>
    </div>
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

  // Arrange in a ring/sphere
  const phi = Math.acos(-1 + (2 * index) / total);
  const theta = Math.sqrt(total * Math.PI) * phi;

  const radius = 8;
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  const nodeColor = useMemo(() => {
    const colors = ["#0ea5e9", "#22d3ee", "#818cf8", "#f472b6", "#fb7185"];
    return colors[index % colors.length];
  }, [index]);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={[x, y, z]}>
        <mesh
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <icosahedronGeometry args={[0.6, 1]} />
          <meshStandardMaterial
            color={hovered ? "#ffffff" : nodeColor}
            emissive={nodeColor}
            emissiveIntensity={hovered ? 2 : 0.5}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        <Text
          position={[0, -1, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
          textAlign="center"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        >
          {label.split(":")[0]}
          <meshStandardMaterial
            emissive="white"
            emissiveIntensity={hovered ? 1 : 0}
          />
        </Text>
      </group>
    </Float>
  );
}

function GalaxyBackground() {
  const count = 10000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 40 + Math.random() * 20;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <Points positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#818cf8"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}
