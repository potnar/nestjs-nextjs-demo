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
    router.push(`/${locale}${href}`);
  };

  return (
    <div className="relative w-full h-screen bg-[#000105] overflow-hidden">
      <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 10, 30], fov: 45 }}>
        <color attach="background" args={["#000105"]} />

        <ambientLight intensity={0.1} />
        <pointLight position={[20, 20, 20]} intensity={1} color="#38bdf8" />
        <pointLight
          position={[-20, -20, -20]}
          intensity={0.5}
          color="#f472b6"
        />

        <Stars
          radius={120}
          depth={60}
          count={10000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />

        <NebulaCloud />
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
          minDistance={10}
          maxDistance={60}
          autoRotate
          autoRotateSpeed={0.2}
          makeDefault
        />

        <Environment preset="night" />
      </Canvas>

      {/* Overlay UI */}
      <div className="absolute top-10 left-10 pointer-events-none z-10">
        <h1 className="text-white text-5xl font-black tracking-tighter sm:text-7xl bg-clip-text text-transparent bg-gradient-to-br from-white via-sky-200 to-sky-500 opacity-90">
          DevLab
        </h1>
        <p className="text-sky-300/40 text-xs mt-2 uppercase tracking-[0.5em] font-light">
          Quantum Network Interface
        </p>
      </div>

      <div className="absolute bottom-10 left-10 pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="text-[40px] font-bold text-white leading-none">
            Space Hub
          </div>
          <div className="text-sky-400 text-xs tracking-[0.2em] uppercase font-medium">
            Interactive 3D Laboratory
          </div>
        </div>
      </div>

      <div className="absolute top-10 right-10 p-5 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 text-white text-[11px] hidden md:block max-w-[220px] shadow-2xl">
        <p className="opacity-70 leading-relaxed font-light">
          Kliknij w orbitujący moduł, aby wejść do konkretnego demo. Użyj myszki
          do rotacji i przybliżania.
        </p>
      </div>
    </div>
  );
}

function NebulaCloud() {
  const count = 40;
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 30 + Math.random() * 20;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      temp.push({
        x,
        y,
        z,
        size: 10 + Math.random() * 20,
        color: i % 2 === 0 ? "#38bdf8" : "#f472b6",
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
            opacity={0.03}
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
      coreRef.current.scale.setScalar(1 + Math.sin(time) * 0.02);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.1;
      ringRef.current.rotation.x = Math.sin(time * 0.5) * 0.2;
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[3, 20]} />
        <meshStandardMaterial
          color="#f472b6"
          emissive="#f472b6"
          emissiveIntensity={2}
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[5, 0.05, 16, 100]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={5}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, Math.PI / 4, 0]}>
          <torusGeometry args={[5.5, 0.02, 16, 100]} />
          <meshStandardMaterial
            color="#818cf8"
            emissive="#818cf8"
            emissiveIntensity={3}
          />
        </mesh>
      </group>

      <pointLight intensity={5} distance={15} color="#f472b6" />
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
  const meshRef = useRef<THREE.Group>(null);
  const streakRef = useRef<THREE.Mesh>(null);

  const orbitRadius = useMemo(() => {
    if (node.category === "core") return 10;
    if (node.category === "lab") return 18;
    return 26;
  }, [node.category]);

  const speed = useMemo(
    () =>
      node.category === "core" ? 0.15 : node.category === "lab" ? -0.1 : 0.05,
    [node.category],
  );
  const angleOffset = (index / total) * Math.PI * 2;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      const angle = time * speed + angleOffset;
      meshRef.current.position.x = Math.cos(angle) * orbitRadius;
      meshRef.current.position.z = Math.sin(angle) * orbitRadius;
      meshRef.current.position.y = Math.sin(time * 0.7 + index) * 0.8;
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
            onSelect();
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {/* Hexagon Frame */}
          <mesh rotation={[0, 0, Math.PI / 6]}>
            <ringGeometry args={[1.2, 1.3, 6]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={hovered ? 15 : 5}
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Outer Soft Glow */}
          <mesh rotation={[0, 0, Math.PI / 6]}>
            <ringGeometry args={[1.1, 1.5, 6]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={2}
              transparent
              opacity={0.1}
            />
          </mesh>

          {/* Central Crystal */}
          <mesh castShadow>
            <icosahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial
              color={hovered ? "#ffffff" : node.color}
              emissive={node.color}
              emissiveIntensity={hovered ? 12 : 3}
              metalness={1}
              roughness={0}
            />
          </mesh>

          {/* Light Streak/Ray */}
          <mesh ref={streakRef} position={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 8, 8]} />
            <meshStandardMaterial
              color={node.color}
              transparent
              opacity={0.2}
              emissive={node.color}
              emissiveIntensity={5}
            />
          </mesh>
        </group>

        <Text
          position={[0, -2, 0.1]}
          fontSize={0.45}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={4}
          textAlign="center"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        >
          {node.label}
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
  const count = 12000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random();
      const r = 40 + Math.random() * 40;
      const arms = 3;
      const armIndex = Math.floor(Math.random() * arms);
      const armAngle = (armIndex / arms) * Math.PI * 2 + r * 0.1;
      const spread = (1 / (r * 0.2)) * 5;

      pos[i * 3] = Math.cos(armAngle + (Math.random() - 0.5) * spread) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * (r * 0.1);
      pos[i * 3 + 2] = Math.sin(armAngle + (Math.random() - 0.5) * spread) * r;
    }
    return pos;
  }, []);

  return (
    <Points positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#818cf8"
        size={0.12}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}
