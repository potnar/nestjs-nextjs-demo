"use client";
import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EXAMPLE_LABELS, type ExampleKey } from "./examples";

const Minimal = dynamic(() => import("./examples/Minimal"), { ssr: false });
const Raycast = dynamic(() => import("./examples/Raycast"), { ssr: false });
const Shader = dynamic(() => import("./examples/Shader/index"), { ssr: false });
const Instanced = dynamic(() => import("./examples/Instanced"), { ssr: false });
const LOD = dynamic(() => import("./examples/LOD"), { ssr: false });
const BrushRipple = dynamic(() => import("./examples/BrushRipple"), {
  ssr: false,
});
const GaussianSplatDemo = dynamic(
  () => import("./examples/GaussianSplatDemo"),
  { ssr: false },
);
const ModelConvertViewer = dynamic(
  () => import("./examples/ModelConvertViewer"),
  { ssr: false },
);
const MinecraftDudeExample = dynamic(() => import("./examples/MinecraftDude"), {
  ssr: false,
});
const MinecraftPathfindingDemo = dynamic(
  () => import("./examples/MinecraftPathfindingDemo"),
  { ssr: false },
);
const IoTRoomScene = dynamic(() => import("./examples/IoTRoomScene"), {
  ssr: false,
});
const ProjectHub3D = dynamic(() => import("./examples/ProjectHub3D"), {
  ssr: false,
});
const Galaxy = dynamic(() => import("./examples/Galaxy"), { ssr: false });
const SpaceHub3D = dynamic(() => import("./examples/SpaceHub3D"), {
  ssr: false,
});

const EXAMPLE_KEYS: ExampleKey[] = [
  "spaceHub",
  "projectHub",
  "galaxy",
  "raycast",
  "shader",
  "instanced",
  "LOD",
  "brushripple",
  "gaussianSplatDemo",
  "modelConvertViewer",
  "minecraftDudeExample",
  "minecraftPathfinding",
  "IoTRoomScene",
  "minimal",
];

export default function ThreeLabShowcase() {
  const locale = useLocale();
  const t = useTranslations();
  const [key, setKey] = useState<ExampleKey>("spaceHub");

  const Current = useMemo(() => {
    switch (key) {
      case "spaceHub":
        return () => <SpaceHub3D onSelect={setKey} />;
      case "projectHub":
        return ProjectHub3D;
      case "galaxy":
        return Galaxy;
      case "raycast":
        return Raycast;
      case "shader":
        return Shader;
      case "instanced":
        return Instanced;
      case "LOD":
        return LOD;
      case "brushripple":
        return BrushRipple;
      case "gaussianSplatDemo":
        return GaussianSplatDemo;
      case "modelConvertViewer":
        return ModelConvertViewer;
      case "minecraftDudeExample":
        return MinecraftDudeExample;
      case "minecraftPathfinding":
        return MinecraftPathfindingDemo;
      case "IoTRoomScene":
        return IoTRoomScene;
      default:
        return Minimal;
    }
  }, [key]);

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
              {t("lab.backToHub") ||
                (locale === "pl" ? "Wróć do Hubu" : "Back to Hub")}
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

      {/* <Card>
        <CardHeader>
          <CardTitle>{t("tips.extend")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <ul className="list-disc ml-6">
            <li><b>glTF</b>: loader GLTFLoader + public/model.gltf</li>
            <li><b>Postprocessing</b>: EffectComposer + Bloom</li>
            <li><b>Fizyka</b>: cannon-es</li>
          </ul>
        </CardContent>
      </Card> */}
    </div>
  );
}
