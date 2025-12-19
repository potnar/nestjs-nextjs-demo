"use client";

import React, { useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import Image from "next/image";

type ProjectCategory = "3d" | "backend" | "ai" | "iot" | "other";
type FilterCategory = ProjectCategory | "all";

type Project = {
  id: string;
  name: string;
  category: ProjectCategory;
  description: string;
  tech: string[];
  thumbnail: string; // ścieżka do screena / miniatury
  link?: string;
};

const PROJECTS: Project[] = [
  {
    id: "photo2splat",
    name: "photo2splat",
    category: "3d",
    description:
      "Pipeline zamieniający zdjęcia lub wideo w interaktywne sceny 3D (Gaussian Splatting + przeglądarka).",
    tech: ["Three.js", "Gaussian Splatting", "Python", "CUDA"],
    thumbnail: "/three-lab/photo2splat.png", // TODO: podmień na realny plik
  },
  {
    id: "iot-room",
    name: "IoT Room",
    category: "iot",
    description:
      "3D mapa pomieszczenia z maszynami i przenośnikami, gotowa pod podpięcie danych z sensorów w czasie rzeczywistym.",
    tech: ["React Three Fiber", "WebSockets", "Node.js"],
    thumbnail: "/three-lab/iot-room.png",
  },
  {
    id: "minecraft-path",
    name: "Minecraft Pathfinding",
    category: "3d",
    description:
      "Ludzik w stylu Minecrafta, który znajduje drogę po siatce za pomocą A* i wizualizuje całą ścieżkę krok po kroku.",
    tech: ["Three.js", "React Three Fiber", "A* pathfinding"],
    thumbnail: "/three-lab/minecraft-pathfinding.png",
  },
  {
    id: "three-lab",
    name: "Three.js Lab",
    category: "3d",
    description:
      "Playground z instancingiem, LOD, raycastingiem, shaderami i gaussian splatami – baza pod 3D demka dla klientów.",
    tech: ["Next.js", "React", "R3F", "TypeScript"],
    thumbnail: "/three-lab/three-lab-overview.png",
  },
];

type ProjectHub3DProps = {
  initialFilter?: FilterCategory;
};

export default function ProjectHub3D({
  initialFilter = "all",
}: ProjectHub3DProps) {
  const [activeCategory, setActiveCategory] =
    useState<FilterCategory>(initialFilter);

  const visibleProjects = useMemo(
    () =>
      activeCategory === "all"
        ? PROJECTS
        : PROJECTS.filter((p) => p.category === activeCategory),
    [activeCategory]
  );

  const [selectedProject, setSelectedProject] = useState<Project | null>(
    PROJECTS[0] ?? null
  );

  return (
    <div className="relative flex w-full h-[80vh] bg-[#020617] text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
      {/* 3D scena z „holograficznym” ekranem */}
      <div className="flex-1">
        <Canvas
          camera={{ position: [0, 2.8, 9], fov: 50 }}
          shadows
          gl={{ antialias: true }}
        >
          <Scene selectedProject={selectedProject} />
          <OrbitControls enableDamping />
        </Canvas>
      </div>

      {/* Panel boczny – grafiki + opisy */}
      <div className="w-full max-w-xs border-l border-slate-800 bg-[#020617]/95 p-4 flex flex-col gap-4">
        <header className="space-y-1">
          <h2 className="text-sm font-semibold tracking-wide text-sky-400 uppercase">
            3D Project Hub
          </h2>
          <p className="text-xs text-slate-400">
            Mini galeria Twoich 3D / IoT dem – po lewej „hologram” w scenie, po
            prawej grafiki, opisy i stack.
          </p>
        </header>

        <Filters active={activeCategory} onChange={setActiveCategory} />

        <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800/80 bg-black/30 p-3 space-y-3">
          {selectedProject ? (
            <>
              <ProjectThumbnail project={selectedProject} />
              <ProjectDetails project={selectedProject} />
              <OtherThumbnails
                projects={visibleProjects}
                selectedId={selectedProject.id}
                onSelect={(p) => setSelectedProject(p)}
              />
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Wybierz projekt z listy, aby zobaczyć jego grafikę i szczegóły.
            </p>
          )}
        </div>

        <footer className="text-[10px] text-slate-500">
          Ten widok jest uniwersalny – można tu zamiast dem 3D wrzucić np.
          moduły systemu, produkty albo klientów.
        </footer>
      </div>
    </div>
  );
}

/* --- 3D scena: tło + core + „hologram” z miniaturą --- */

function Scene({ selectedProject }: { selectedProject: Project | null }) {
  return (
    <>
      {/* Tło i mgła */}
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 6, 18]} />

      {/* Światła */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[-5, 4, -3]} intensity={0.7} />
      <pointLight position={[3, 3, -5]} intensity={0.4} />

      {/* Podłoga / podest */}
      <mesh
        receiveShadow
        rotation-x={-Math.PI / 2}
        position={[0, -1.2, 0]}
      >
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial
          color="#020617"
          roughness={0.95}
          metalness={0.1}
        />
      </mesh>

      {/* Podświetlony ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.15, 0]} receiveShadow>
        <torusGeometry args={[2.4, 0.06, 32, 128]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive="#0ea5e9"
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.85}
        />
      </mesh>

      {/* Centralny „core” */}
      <SpinningCore />

      {/* Holograficzny ekran z miniaturą wybranego projektu */}
      <ProjectScreen project={selectedProject} />
    </>
  );
}

function SpinningCore() {
  const coreRef = React.useRef<THREE.Mesh | null>(null);

  useFrame((_, delta) => {
    if (!coreRef.current) return;
    coreRef.current.rotation.y += delta * 0.6;
    coreRef.current.rotation.x += delta * 0.2;
  });

  return (
    <group position={[0, 0.3, 0]}>
      <mesh ref={coreRef} castShadow>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

function ProjectScreen({ project }: { project: Project | null }) {
  // Hologram pojawia się nad core
  return (
    <Html
      distanceFactor={8}
      position={[0, 2.0, 0]}
      transform
      occlude
      style={{ pointerEvents: "none" }}
    >
      <div className="relative w-[260px] md:w-[320px] rounded-xl overflow-hidden border border-sky-500/60 bg-slate-900/80 shadow-[0_0_40px_rgba(56,189,248,0.4)] backdrop-blur-md">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-sky-500/20 via-transparent to-sky-500/10" />
        {project ? (
          <Image
            src={project.thumbnail}
            alt={project.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-[180px] flex items-center justify-center text-xs text-slate-400">
            Wybierz projekt, aby zobaczyć jego podgląd.
          </div>
        )}
        <div className="relative px-3 py-2 text-[11px]">
          <p className="font-semibold truncate">{project?.name ?? "Brak projektu"}</p>
          {project && (
            <p className="text-[10px] text-sky-300 mt-1">
              {labelForCategory(project.category)}
            </p>
          )}
        </div>
      </div>
    </Html>
  );
}

/* --- Sidebar: filtry + grafiki + opisy --- */

function colorForCategory(cat: ProjectCategory) {
  switch (cat) {
    case "3d":
      return "#38bdf8"; // cyan
    case "backend":
      return "#a855f7"; // fiolet
    case "ai":
      return "#22c55e"; // zielony
    case "iot":
      return "#f97316"; // pomarańcz
    case "other":
    default:
      return "#e5e7eb"; // szary
  }
}

type FiltersProps = {
  active: FilterCategory;
  onChange: (c: FilterCategory) => void;
};

function Filters({ active, onChange }: FiltersProps) {
  const filters: { id: FilterCategory; label: string }[] = [
    { id: "all", label: "Wszystko" },
    { id: "3d", label: "3D / grafika" },
    { id: "iot", label: "IoT / monitoring" },
    { id: "backend", label: "Backend / systemy" },
    { id: "ai", label: "AI / narzędzia" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`px-3 py-1 rounded-full text-[11px] border transition
            ${
              active === f.id
                ? "bg-sky-500 text-white border-sky-400 shadow-sm"
                : "bg-transparent text-slate-300 border-slate-600 hover:border-sky-500 hover:text-sky-300"
            }
          `}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function ProjectThumbnail({ project }: { project: Project }) {
  return (
    <div className="w-full">
      <div className="relative w-full aspect-video overflow-hidden rounded-md border border-slate-700 bg-slate-900/70">
        <Image
          src={project.thumbnail}
          alt={project.name}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>
    </div>
  );
}

function OtherThumbnails({
  projects,
  selectedId,
  onSelect,
}: {
  projects: Project[];
  selectedId: string;
  onSelect: (p: Project) => void;
}) {
  if (projects.length <= 1) return null;

  return (
    <div className="space-y-1">
      <p className="text-[11px] text-slate-400">Pozostałe demka:</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {projects.map((p) => {
          if (p.id === selectedId) return null;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className="relative w-16 h-12 rounded-md overflow-hidden border border-slate-700 hover:border-sky-500 transition flex-shrink-0"
              title={p.name}
            >
              <Image
                src={p.thumbnail}
                alt={p.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
              <span className="absolute bottom-0 left-0 right-0 text-[9px] px-1 pb-0.5 text-slate-100 truncate bg-black/60">
                {p.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProjectDetails({ project }: { project: Project }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">{project.name}</h3>
        <p
          className="text-[11px] uppercase tracking-wide"
          style={{ color: colorForCategory(project.category) }}
        >
          {labelForCategory(project.category)}
        </p>
      </div>

      <p className="text-sm text-slate-200 leading-relaxed">
        {project.description}
      </p>

      <div>
        <p className="text-[11px] text-slate-400 mb-1">Tech stack:</p>
        <div className="flex flex-wrap gap-1.5">
          {project.tech.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-100 border border-slate-600"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center px-3 py-1.5 text-xs rounded-md bg-sky-500 hover:bg-sky-400 text-white transition border border-sky-400"
        >
          Zobacz demo / więcej
        </a>
      )}
    </div>
  );
}

function labelForCategory(cat: ProjectCategory): string {
  switch (cat) {
    case "3d":
      return "3D / grafika";
    case "backend":
      return "Backend / systemy";
    case "ai":
      return "AI / narzędzia";
    case "iot":
      return "IoT / monitoring";
    case "other":
    default:
      return "Inny projekt";
  }
}
