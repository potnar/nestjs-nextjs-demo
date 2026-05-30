"use client";
import dynamic from "next/dynamic";
import { useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
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

function ThreeLabInner() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();

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
    <div className="p-6 space-y-6 min-h-[90vh] bg-transparent">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500">
            {t("lab.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("lab.subtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          {key !== "spaceHub" && (
            <button
              onClick={() => setKey("spaceHub")}
              className="px-4 py-2 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20 hover:bg-sky-500 hover:text-white transition-all text-sm font-medium"
            >
              ←{" "}
              {t("lab.backToHub") || (locale === "pl" ? "Wróć do Hubu" : "Back to Hub")}
            </button>
          )}
          <div className="w-64">
            <Select value={key} onValueChange={(v) => setKey(v as ExampleKey)}>
              <SelectTrigger className="w-full bg-background/50 backdrop-blur-sm border-white/10 shadow-xl">
                <SelectValue placeholder="Wybierz przykład" />
              </SelectTrigger>
              <SelectContent>
                {EXAMPLE_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {labelFor(k)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <Current />
        </motion.div>
      </AnimatePresence>
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
