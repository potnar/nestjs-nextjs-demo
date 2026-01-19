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
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

type HubNodeData = {
  id: string;
  label: string;
  href: string;
  color: string;
  category: "core" | "lab" | "tool";
};

const HUB_NODES: HubNodeData[] = [
  // CORE
  { id: "hub", label: "Hub", href: "/", color: "#38bdf8", category: "core" },
  {
    id: "3d-lab",
    label: "3D Lab",
    href: "/threejs",
    color: "#818cf8",
    category: "core",
  },

  // LABS
  {
    id: "sso",
    label: "SSO PKCE",
    href: "/login-sso",
    color: "#f472b6",
    category: "lab",
  },
  {
    id: "recursion",
    label: "Recursion",
    href: "/tree-demo",
    color: "#fb7185",
    category: "lab",
  },
  {
    id: "filesystem",
    label: "Filesystem",
    href: "/filesystem",
    category: "lab",
    color: "#fbbf24",
  },

  // TOOLS
  {
    id: "ts-faq",
    label: "TS FAQ",
    href: "/typescript/faq",
    color: "#34d399",
    category: "tool",
  },
  {
    id: "weight",
    label: "Weight",
    href: "/weight",
    color: "#a78bfa",
    category: "tool",
  },
  {
    id: "storage",
    label: "Storage",
    href: "/web-storage",
    color: "#60a5fa",
    category: "tool",
  },
  {
    id: "abort",
    label: "Abort Fetch",
    href: "/abortable-search",
    color: "#f87171",
    category: "tool",
  },
];

export default function Global3DHub() {
  const router = useRouter();
  const locale = useLocale();

  const handleNavigate = (href: string) => {
    // Basic navigation for now, can add camera zoom later
    router.push(`/${locale}${href}`);
  };

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden">
      <Canvas dpr={[1, 2]} shadows>
        <color attach="background" args={["#020617"]} />
        <PerspectiveCamera makeDefault position={[0, 10, 30]} fov={50} />

        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#38bdf8" />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color="#818cf8"
        />

        <Stars
          radius={100}
          depth={50}
          count={7000}
          factor={4}
          saturation={0}
          fade
          speed={1.5}
        />

        <GalaxyBackground />

        <CentralCore />

        <group>
          {HUB_NODES.map((node, index) => (
            <HubNode
              key={node.id}
              node={node}
              index={index}
              total={HUB_NODES.length}
              onSelect={() => handleNavigate(node.href)}
            />
          ))}
        </group>

        <OrbitControls
          enablePan={false}
          minDistance={15}
          maxDistance={50}
          autoRotate
          autoRotateSpeed={0.3}
          makeDefault
        />

        <Environment preset="city" />
      </Canvas>

      {/* Overlay UI */}
      <div className="absolute top-10 left-10 pointer-events-none z-10">
        <h1 className="text-white text-5xl font-black tracking-tighter sm:text-7xl bg-clip-text text-transparent bg-gradient-to-br from-white via-sky-200 to-sky-500">
          DEVLAB
        </h1>
        <p className="text-sky-400/60 text-sm mt-2 uppercase tracking-[0.3em] font-medium">
          Interactive Galactic Navigation
        </p>
      </div>

      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-2 text-right pointer-events-none">
        <div className="px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white/50 text-[10px] uppercase tracking-widest">
          System Status: Operational
        </div>
        <div className="text-white/20 text-[9px] max-w-[200px]">
          Use your mouse to explore the network. Click on any orbiting node to
          enter a specific laboratory.
        </div>
      </div>
    </div>
  );
}

function CentralCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.5;
      coreRef.current.rotation.z = time * 0.3;
      coreRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = -time * 0.2;
      outerRef.current.rotation.x = time * 0.1;
    }
  });

  return (
    <group>
      {/* Glow effect simplified */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[2, 15]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={2}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
      <mesh ref={outerRef}>
        <torusKnotGeometry args={[4, 0.02, 128, 16]} />
        <meshStandardMaterial
          color="#818cf8"
          emissive="#818cf8"
          emissiveIntensity={5}
        />
      </mesh>
      <pointLight intensity={2} distance={20} color="#38bdf8" />
    </group>
  );
}

function HubNode({
  node,
  index,
  total,
  onSelect,
}: {
  node: HubNodeData;
  index: number;
  total: number;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  // Create orbits based on category
  const orbitRadius = useMemo(() => {
    if (node.category === "core") return 8;
    if (node.category === "lab") return 14;
    return 20;
  }, [node.category]);

  const speed = useMemo(() => {
    if (node.category === "core") return 0.2;
    if (node.category === "lab") return -0.15;
    return 0.1;
  }, [node.category]);

  const angleOffset = (index / total) * Math.PI * 2;

  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      const angle = time * speed + angleOffset;
      meshRef.current.position.x = Math.cos(angle) * orbitRadius;
      meshRef.current.position.z = Math.sin(angle) * orbitRadius;
      meshRef.current.position.y = Math.sin(time * 0.5 + index) * 0.5;
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color={hovered ? "#ffffff" : node.color}
            emissive={node.color}
            emissiveIntensity={hovered ? 10 : 2}
            metalness={1}
            roughness={0}
          />
        </mesh>

        {/* Glow Ring */}
        {hovered && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.8, 0.02, 16, 64]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={10}
            />
          </mesh>
        )}

        <Text
          position={[0, -1.2, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
          textAlign="center"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        >
          {node.label}
          <meshStandardMaterial
            emissive="white"
            emissiveIntensity={hovered ? 2 : 0.2}
          />
        </Text>
      </Float>
    </group>
  );
}

function GalaxyBackground() {
  const count = 15000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 50 + Math.random() * 30;
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
        color="#38bdf8"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}
