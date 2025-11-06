"use client";
import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import type { ExampleKey } from "./examples";

const Minimal = dynamic(() => import("./examples/Minimal"), { ssr: false });
const Raycast  = dynamic(() => import("./examples/Raycast"),  { ssr: false });
const Shader   = dynamic(() => import("./examples/Shader/index"),   { ssr: false });
const Instanced = dynamic(() => import("./examples/Instanced"), { ssr: false });
const LOD = dynamic(() => import("./examples/LOD"), { ssr: false });
const BrushRipple = dynamic(() => import("./examples/BrushRipple"), { ssr: false });

const EXAMPLE_KEYS: ExampleKey[] = ["minimal", "raycast", "shader", "instanced", "LOD", "brushripple"];

export default function ThreeLabShowcase() {
  const t = useTranslations();
  const [key, setKey] = useState<ExampleKey>("minimal");

  const Current = useMemo(() => {
    switch (key) {
      case "raycast": return Raycast;
      case "shader":  return Shader;
      case "instanced": return Instanced;
      case "LOD": return LOD;
      case "brushripple": return BrushRipple;
      default:        return Minimal;
    }
  }, [key]);

  const labelFor = (k: ExampleKey) => t(`example.${k}`);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("lab.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("lab.subtitle")}</p>
        </div>
        <div className="w-72">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {t("lab.examplesLabel")}
        </div>
          <Select value={key} onValueChange={(v) => setKey(v as ExampleKey)}>
            <SelectTrigger className="w-full">
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
