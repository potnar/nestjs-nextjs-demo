"use client";

import React, { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Float,
  Text,
} from "@react-three/drei";
import * as THREE from "three";

// --- TYPY I DANE ---

type Status = "ok" | "warn" | "critical";
type DeviceType = "server" | "engine" | "conveyor";

type Device = {
  id: string;
  type: DeviceType;
  x: number;
  z: number;
  rotation?: number;
  name: string;
  status: Status;
  load: number; // 0.0 - 1.0
};

const INITIAL_DEVICES: Device[] = [
  { id: "srv-1", type: "server", x: -3, z: -2, name: "Baza Danych A", status: "ok", load: 0.2 },
  { id: "srv-2", type: "server", x: -3, z: 0, name: "Baza Danych B", status: "warn", load: 0.6 },
  { id: "srv-3", type: "server", x: -3, z: 2, name: "Backup Unit", status: "ok", load: 0.1 },
  { id: "eng-1", type: "engine", x: 3, z: -2, rotation: -Math.PI/4, name: "Turbina Chłodzenia 1", status: "ok", load: 0.4 },
  { id: "eng-2", type: "engine", x: 3, z: 2, rotation: -Math.PI/4, name: "Turbina Chłodzenia 2", status: "critical", load: 0.95 },
  { id: "conv-1", type: "conveyor", x: 0, z: 0, rotation: 0, name: "Magistrala Danych", status: "ok", load: 0.5 },
];

// --- KOLORY I POMOCNIKI ---

function getStatusColor(status: Status): THREE.Color {
  switch (status) {
    case "ok": return new THREE.Color("#22c55e");
    case "warn": return new THREE.Color("#f59e0b");
    case "critical": return new THREE.Color("#ef4444");
    default: return new THREE.Color("#ffffff");
  }
}
  
  /**
   * Wspólny materiał do pulsujących elementów (słupki, diody, ramiona "X")
   */
  function PulsatingMaterial({
    color,
    intensity = 0.3,
  }: {
    color: string | THREE.Color;
    intensity?: number;
  }) {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
    const baseColor = useMemo(
      () => (typeof color === "string" ? new THREE.Color(color) : color),
      [color]
    );
  
    useFrame(({ clock }) => {
      if (!materialRef.current) return;
      const t = clock.getElapsedTime();
      const pulse = Math.sin(t * 3) * intensity + (1 - intensity);
      materialRef.current.emissive = baseColor.clone().multiplyScalar(
        pulse * 0.6
      );
    });
  
    return (
      <meshStandardMaterial
        ref={materialRef}
        color={baseColor}
        metalness={0.05}
        roughness={0.4}
        emissive={baseColor.clone().multiplyScalar(0)}
        toneMapped={false}
      />
    );
  }
  

// --- KOMPONENTY SCENY ---

function Room() {
  return (
    <group>
      {/* Główna podłoga */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.05, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Platforma robocza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[10, 8, 0.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.5} />
      </mesh>
      
      {/* Siatka techniczna */}
      <gridHelper args={[10, 10, "#94a3b8", "#cbd5e1"]} position={[0, 0.11, 0]} />

      {/* Dekoracyjne ramy boczne */}
      <mesh position={[0, 0.2, -4.1]}>
         <boxGeometry args={[10.2, 0.4, 0.2]} />
         <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh position={[0, 0.2, 4.1]}>
         <boxGeometry args={[10.2, 0.4, 0.2]} />
         <meshStandardMaterial color="#64748b" />
      </mesh>
    </group>
  );
}

function ServerRack({ device }: { device: Device }) {
    const color = useMemo(
      () => getStatusColor(device.status),
      [device.status]
    );
    const barRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);
  
    const baseHeight = 1.8; // wysokość czarnej kolumny
  
    useFrame((state) => {
      if (!barRef.current) return;
  
      const time = state.clock.elapsedTime;
      const speed = 2 + device.load * 5;
      const heightBase = 0.6 + device.load * 1.5; // bazowa wysokość słupka
      const pulse = Math.sin(time * speed) * 0.15 * device.load;
  
      // słupek rośnie/kurczy się
      const finalScaleY = heightBase + pulse;
      barRef.current.scale.y = THREE.MathUtils.lerp(
        barRef.current.scale.y || 1,
        finalScaleY,
        0.2
      );
  
      // utrzymujemy dół słupka tuż nad kolumną
      const topOfRack = baseHeight; // kolumna stoi na y=0, ma 1.8 wysokości
      const margin = 0.08;
      barRef.current.position.y =
        topOfRack + margin + 0.5 * (barRef.current.scale.y || 1);
  
      // migotanie światła przy critical
      if (lightRef.current && device.status === "critical") {
        const flicker = (Math.sin(time * 10) + 1) / 2; // 0..1
        lightRef.current.intensity = 1 + flicker * 2;
      } else if (lightRef.current) {
        lightRef.current.intensity = 0.6;
      }
    });
  
    return (
      <group position={[device.x, 0, device.z]}>
        {/* cień */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshBasicMaterial
            color="black"
            transparent
            opacity={0.12}
          />
        </mesh>
  
        {/* Obudowa */}
        <mesh position={[0, baseHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, baseHeight, 0.8]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>
  
        {/* Szyba frontowa */}
        <mesh position={[0, baseHeight / 2, 0.41]}>
          <planeGeometry args={[0.7, 1.6]} />
          <meshStandardMaterial
            color="#020617"
            roughness={0.2}
            metalness={0.9}
            transparent
            opacity={0.8}
          />
        </mesh>
  
        {/* Dioda na panelu */}
        <mesh position={[0.18, 0.35, 0.43]}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <PulsatingMaterial
            color={color}
            intensity={device.status === "critical" ? 0.7 : 0.4}
          />
        </mesh>
  
        {/* Słupek statusu NAD kolumną */}
        <mesh ref={barRef} position={[0, baseHeight + 0.5, 0]}>
          <boxGeometry args={[0.3, 1, 0.3]} />
          <PulsatingMaterial color={color} intensity={0.5} />
        </mesh>
  
        {/* lokalne światło nad serwerem */}
        <pointLight
          ref={lightRef}
          position={[0, baseHeight + 1.4, 0]}
          distance={3.5}
          color={color}
          decay={2}
          intensity={0.6}
        />
  
        {/* label */}
        <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
          <Text
            position={[0, baseHeight + 2 + device.load, 0]}
            fontSize={0.25}
            color="#334155"
            anchorX="center"
            anchorY="middle"
          >
            {device.name}
          </Text>
        </Float>
      </group>
    );
  }
  
  function Engine({ device }: { device: Device }) {
    const rotorRef = useRef<THREE.Group>(null);
    const groupRef = useRef<THREE.Group>(null);
    const alarmLightRef = useRef<THREE.PointLight>(null);
    const color = useMemo(
      () => getStatusColor(device.status),
      [device.status]
    );
  
    useFrame((state) => {
      if (!rotorRef.current || !groupRef.current) return;
  
      const time = state.clock.elapsedTime;
      const speed = 2 + device.load * 15;
      rotorRef.current.rotation.z -= speed * 0.01;
  
      // Gładkie drgania zamiast losowych skoków
      const jitterAmount =
        device.status === "critical" ? 0.03 : device.status === "warn" ? 0.015 : 0;
  
      if (jitterAmount > 0) {
        const phase = time * (device.status === "critical" ? 12 : 6);
        groupRef.current.position.x = device.x + Math.sin(phase) * jitterAmount;
        groupRef.current.position.z = device.z + Math.cos(phase) * jitterAmount;
      } else {
        groupRef.current.position.x = device.x;
        groupRef.current.position.z = device.z;
      }
  
      // Pulsujące światło alarmowe
      if (alarmLightRef.current) {
        if (device.status === "critical") {
          const wave = (Math.sin(time * 6) + 1) / 2; // 0..1
          alarmLightRef.current.intensity = 1 + wave * 4; // 1..5
        } else if (device.status === "warn") {
          const wave = (Math.sin(time * 3) + 1) / 2;
          alarmLightRef.current.intensity = 0.5 + wave; // delikatny puls
        } else {
          alarmLightRef.current.intensity = 0;
        }
      }
    });
  
    return (
      <group
        ref={groupRef}
        position={[device.x, 0, device.z]}
        rotation={[0, device.rotation || 0, 0]} // <- tu używamy rotation z device
      >
        {/* Podstawa */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.4, 1.2]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
  
        {/* Obudowa wirnika */}
        <mesh
          position={[0, 1, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.6, 0.6, 0.5, 32]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
  
        {/* Wirnik */}
        <group ref={rotorRef} position={[0, 1, 0.26]}>
          <mesh>
            <boxGeometry args={[1, 0.1, 0.05]} />
            <PulsatingMaterial color={color} intensity={0.6} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[1, 0.1, 0.05]} />
            <PulsatingMaterial color={color} intensity={0.6} />
          </mesh>
        </group>
  
        {/* Światło alarmowe */}
        <pointLight
          ref={alarmLightRef}
          position={[0, 1.5, 0]}
          color="red"
          distance={5}
          decay={1}
          intensity={0}
        />
      </group>
    );
  }
  
  

function ConveyorBelt({ device }: { device: Device }) {
    const itemsCount = 6;
    const itemRefs = useRef<THREE.Mesh[]>([]);
    const color = useMemo(() => getStatusColor(device.status), [device.status]);

    useFrame((state) => {
        const speed = 1 + device.load * 4;
        const time = state.clock.elapsedTime * speed;
        
        itemRefs.current.forEach((mesh, i) => {
            if(!mesh) return;
            // Zapętlona pozycja od -2.5 do 2.5
            const offset = (i / itemsCount) * 5; 
            const zPos = ((time + offset) % 5) - 2.5;
            mesh.position.z = zPos;
            
            // Lekkie unoszenie
            mesh.position.y = 0.25 + Math.sin(time * 5 + i) * 0.05;
        });
    });

    return (
        <group position={[device.x, 0, device.z]}>
            {/* Szyna */}
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
                <planeGeometry args={[1, 6]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            
            {/* Linie prowadzące (świecące) */}
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[-0.4, 0.03, 0]}>
                 <planeGeometry args={[0.05, 6]} />
                 <meshBasicMaterial color="#3b82f6" />
            </mesh>
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0.4, 0.03, 0]}>
                 <planeGeometry args={[0.05, 6]} />
                 <meshBasicMaterial color="#3b82f6" />
            </mesh>

            {/* Pakiety danych */}
            {Array.from({ length: itemsCount }).map((_, i) => (
                <mesh 
                    key={i} 
                    ref={(el) => { if (el) itemRefs.current[i] = el; }}
                    castShadow
                >
                    <boxGeometry args={[0.4, 0.4, 0.4]} />
                    <meshStandardMaterial 
                        color={color} 
                        emissive={color}
                        emissiveIntensity={0.5 + device.load}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    )
}

// --- SCENA ---

function SceneContent({ devices }: { devices: Device[] }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
      </directionalLight>

      <Room />

      {devices.map((device) => {
        if (device.type === 'server') return <ServerRack key={device.id} device={device} />;
        if (device.type === 'engine') return <Engine key={device.id} device={device} />;
        if (device.type === 'conveyor') return <ConveyorBelt key={device.id} device={device} />;
        return null;
      })}

      <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.25} far={10} color="#1e293b" />
      
      <OrbitControls 
        makeDefault 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={15}
      />
    </>
  );
}

// --- PANEL STEROWANIA ---

function DashboardUI({ 
  devices, 
  onUpdateDevice 
}: { 
  devices: Device[], 
  onUpdateDevice: (id: string, updates: Partial<Device>) => void 
}) {
  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white/90 backdrop-blur-md shadow-xl p-4 overflow-y-auto border-l border-gray-200 z-10 transition-transform">
      <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
        🎛️ Panel Sterowania
      </h2>
      
      <div className="space-y-6">
        {devices.map(device => (
          <div key={device.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm text-slate-700">{device.name}</span>
              <div className={`w-2 h-2 rounded-full ${
                  device.status === 'ok' ? 'bg-green-500' : 
                  device.status === 'warn' ? 'bg-amber-500' : 'bg-red-500'
              } animate-pulse`} />
            </div>

            {/* Suwak Obciążenia */}
            <div className="mb-3">
               <label className="text-xs text-slate-500 flex justify-between">
                 <span>Obciążenie / Prędkość</span>
                 <span>{(device.load * 100).toFixed(0)}%</span>
               </label>
               <input 
                 type="range" 
                 min="0" max="1" step="0.05"
                 value={device.load}
                 onChange={(e) => onUpdateDevice(device.id, { load: parseFloat(e.target.value) })}
                 className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-1"
               />
            </div>

            {/* Przyciski Statusu */}
            <div className="grid grid-cols-3 gap-1">
              {(['ok', 'warn', 'critical'] as Status[]).map(s => (
                <button
                  key={s}
                  onClick={() => onUpdateDevice(device.id, { status: s })}
                  className={`text-xs py-1 px-1 rounded border capitalize transition-all ${
                    device.status === s 
                      ? s === 'ok' ? 'bg-green-100 border-green-500 text-green-700 font-bold' 
                      : s === 'warn' ? 'bg-amber-100 border-amber-500 text-amber-700 font-bold'
                      : 'bg-red-100 border-red-500 text-red-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 text-xs text-slate-400 text-center">
         Wizualizacja IoT Lab v2.0 <br/>
         Powered by React Three Fiber
      </div>
    </div>
  );
}

// --- ROOT KOMPONENT ---

const IoTRoomScene: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  
    const handleUpdateDevice = (id: string, updates: Partial<Device>) => {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id !== id) return d;
  
          let next: Device = { ...d, ...updates };
  
          // jeśli zmieniamy load suwakiem, a nie klikamy przycisku statusu –
          // automatycznie wylicz status na podstawie progu
          if (updates.load !== undefined && updates.status === undefined) {
            const load = updates.load;
            let autoStatus: Status;
            if (load < 0.45) autoStatus = "ok";
            else if (load < 0.8) autoStatus = "warn";
            else autoStatus = "critical";
            next.status = autoStatus;
          }
  
          if (updates.status !== undefined && updates.load === undefined) {
            let targetLoad: number;
            switch (updates.status) {
              case "ok":
                targetLoad = 0.25;
                break;
              case "warn":
                targetLoad = 0.6;
                break;
              case "critical":
                targetLoad = 0.9;
                break;
            }
            next.load = targetLoad!;
          }

          return next;
        })
      );
    };
  
    return (
      <div className="relative w-full h-[600px] bg-slate-50 overflow-hidden rounded-xl border border-slate-200 shadow-2xl">
        <Canvas
          shadows
          camera={{ position: [8, 8, 8], fov: 40 }}
          dpr={1}
          gl={{ powerPreference: "high-performance", antialias: true }}
        >
          <color attach="background" args={["#f1f5f9"]} />
          <Suspense fallback={null}>
            <SceneContent devices={devices} />
          </Suspense>
        </Canvas>
  
        <DashboardUI
          devices={devices}
          onUpdateDevice={handleUpdateDevice}
        />
  
        <div className="absolute top-4 left-4 pointer-events-none">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            SYSTEM MONITORINGU
          </h1>
          <p className="text-slate-500 font-medium">
            Widok na żywo hali produkcyjnej
          </p>
        </div>
      </div>
    );
  };
  

export default IoTRoomScene;