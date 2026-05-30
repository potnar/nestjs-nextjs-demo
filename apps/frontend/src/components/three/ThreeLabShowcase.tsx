"use client";
import dynamic from "next/dynamic";
import { useMemo, useCallback, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { EXAMPLE_LABELS, type ExampleKey } from "./examples";

const Minimal      = dynamic(() => import("./examples/Minimal"),                  { ssr: false });
const Raycast      = dynamic(() => import("./examples/Raycast"),                  { ssr: false });
const Shader       = dynamic(() => import("./examples/Shader/index"),             { ssr: false });
const Instanced    = dynamic(() => import("./examples/Instanced"),                { ssr: false });
const LOD          = dynamic(() => import("./examples/LOD"),                      { ssr: false });
const BrushRipple  = dynamic(() => import("./examples/BrushRipple"),             { ssr: false });
const GaussianSplat = dynamic(() => import("./examples/GaussianSplatDemo"),      { ssr: false });
const Converter    = dynamic(() => import("./examples/ModelConvertViewer"),       { ssr: false });
const Minecraft    = dynamic(() => import("./examples/MinecraftDude"),            { ssr: false });
const Pathfinding  = dynamic(() => import("./examples/MinecraftPathfindingDemo"), { ssr: false });
const IoTRoom      = dynamic(() => import("./examples/IoTRoomScene"),             { ssr: false });
const ProjectHub3D = dynamic(() => import("./examples/ProjectHub3D"),             { ssr: false });
const Galaxy       = dynamic(() => import("./examples/Galaxy"),                   { ssr: false });
const SpaceHub3D   = dynamic(() => import("./examples/SpaceHub3D"),              { ssr: false });

const EXAMPLE_KEYS: ExampleKey[] = [
  "spaceHub", "projectHub", "galaxy", "raycast", "shader", "instanced",
  "LOD", "brushripple", "gaussianSplat", "converter", "minecraft",
  "pathfinding", "iotRoom", "minimal",
];

type Cmp = React.ComponentType;
const COMPONENTS: Partial<Record<ExampleKey, Cmp>> = {
  projectHub: ProjectHub3D,
  galaxy:     Galaxy,
  raycast:    Raycast,
  shader:     Shader,
  instanced:  Instanced,
  LOD,
  brushripple:   BrushRipple,
  gaussianSplat: GaussianSplat,
  converter:     Converter,
  minecraft:     Minecraft,
  pathfinding:   Pathfinding,
  iotRoom:       IoTRoom,
  minimal:       Minimal,
};

function isValidKey(v: string | null): v is ExampleKey {
  return !!v && EXAMPLE_KEYS.includes(v as ExampleKey);
}

const SAND = "var(--sand)";
const GLASS_BG = "var(--card-glass)";
const GLASS_BORDER = "var(--card-glass-border)";

function ExampleDrawer({
  current,
  onSelect,
  onClose,
}: {
  current: ExampleKey;
  onSelect: (k: ExampleKey) => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const labelFor = (k: ExampleKey) => {
    const trans = t(`example.${k}`);
    if (trans && trans !== `example.${k}`) return trans;
    return EXAMPLE_LABELS[k] || k;
  };

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      {/* drawer */}
      <motion.div
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col py-8 px-6 overflow-y-auto"
        style={{
          width: "280px",
          background: "rgba(8,10,20,0.97)",
          borderRight: `1px solid ${GLASS_BORDER}`,
        }}
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ duration: 0.35, ease: [0.32, 0, 0.67, 0] }}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs tracking-widest uppercase" style={{ color: SAND }}>
            {locale === "pl" ? "Przykłady" : "Examples"}
          </span>
          <button onClick={onClose} style={{ color: SAND, opacity: 0.6 }} className="hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <ul className="flex flex-col gap-1">
          {EXAMPLE_KEYS.map((k) => (
            <li key={k}>
              <button
                onClick={() => { onSelect(k); onClose(); }}
                className="w-full text-left px-3 py-2 text-xs tracking-wider uppercase transition-all"
                style={{
                  color: SAND,
                  opacity: k === current ? 1 : 0.5,
                  borderLeft: k === current ? `2px solid ${SAND}` : "2px solid transparent",
                  borderRadius: "0 4px 4px 0",
                  background: k === current ? GLASS_BG : "transparent",
                }}
              >
                {labelFor(k)}
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </>
  );
}

function ThreeLabInner() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const raw = searchParams.get("e");
  const key: ExampleKey = isValidKey(raw) ? raw : "spaceHub";

  const setKey = useCallback((next: ExampleKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "spaceHub") params.delete("e");
    else params.set("e", next);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const Current = useMemo<Cmp>(
    () => key === "spaceHub"
      ? () => <SpaceHub3D onSelect={setKey} />
      : (COMPONENTS[key] ?? Minimal),
    [key, setKey],
  );

  const labelFor = (k: ExampleKey) => {
    const trans = t(`example.${k}`);
    if (trans && trans !== `example.${k}`) return trans;
    return EXAMPLE_LABELS[k] || k;
  };

  return (
    <div className="relative flex h-[calc(100vh-56px)] overflow-hidden">

      {/* Przycisk otwierający drawer */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center gap-1 py-4 px-2 transition-opacity hover:opacity-80"
        style={{
          background: GLASS_BG,
          border: `1px solid ${GLASS_BORDER}`,
          borderLeft: "none",
          borderRadius: "0 4px 4px 0",
          color: SAND,
        }}
        aria-label="Open examples"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        <span className="text-[9px] tracking-widest uppercase" style={{ writingMode: "vertical-rl" }}>
          {locale === "pl" ? "Przykłady" : "Examples"}
        </span>
      </button>

      {/* Drawer overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <ExampleDrawer
            current={key}
            onSelect={setKey}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Główna zawartość — canvas */}
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0, 0.67, 0] }}
        >
          <Current />
        </motion.div>
      </AnimatePresence>

      {/* Prawy panel — info + nawigacja wstecz */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3 p-3"
        style={{
          background: GLASS_BG,
          border: `1px solid ${GLASS_BORDER}`,
          borderRight: "none",
          borderRadius: "4px 0 0 4px",
          minWidth: "120px",
        }}
      >
        <div className="text-[9px] tracking-widest uppercase mb-1" style={{ color: SAND, opacity: 0.5 }}>
          {locale === "pl" ? "Aktywny" : "Active"}
        </div>
        <div className="text-xs" style={{ color: SAND }}>
          {labelFor(key)}
        </div>

        {key !== "spaceHub" && (
          <button
            onClick={() => setKey("spaceHub")}
            className="text-[9px] tracking-widest uppercase transition-opacity hover:opacity-100 text-left"
            style={{ color: SAND, opacity: 0.5 }}
          >
            ← Hub
          </button>
        )}
      </div>
    </div>
  );
}

export default function ThreeLabShowcase() {
  return (
    <Suspense>
      <ThreeLabInner />
    </Suspense>
  );
}
