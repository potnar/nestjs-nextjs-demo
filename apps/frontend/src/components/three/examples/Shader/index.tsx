"use client";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// --- rejestr przykładów (łatwo dodać kolejne) ---
const EXAMPLES = [
  {
    id: "showcase",
    label: "Showcase: Hologram / Toon / Dissolve",
    // Uwaga: zadbaj, żeby plik istniał
    Comp: lazy(() => import("./Showcase")),
  },
  {
    id: "animation",
  label: "Animowany gradient (fragment shader • u_time • scanlines)",
  Comp: lazy(() => import("./Animation")),
  },
  {
    id: "wavy",
    label: "Falująca siatka (vertex shader)",
    Comp: lazy(() => import("./WavyPlane")),
  },
  // { id: "twoj-nowy", label: "Mój shader", Comp: lazy(() => import("./MojNowyShader")) },
] as const;

type ExampleId = typeof EXAMPLES[number]["id"];
const STORAGE_KEY = "three-shader-selected";

export default function ShaderIndex() {
  const [selected, setSelected] = useState<ExampleId>("showcase");

  // wczytaj ostatni wybór
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as ExampleId | null) : null;
    if (saved && EXAMPLES.some(e => e.id === saved)) setSelected(saved);
  }, []);
  // zapisz wybór
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, selected);
  }, [selected]);

  const active = useMemo(() => EXAMPLES.find(e => e.id === selected)!, [selected]);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* górny panel z selektorem */}sas
      <Card className="col-span-12">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Shaders — przykłady</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={selected} onValueChange={(v: ExampleId) => setSelected(v)}>
              <SelectTrigger className="w-[360px]">
                <SelectValue placeholder="Wybierz przykład shadera" />
              </SelectTrigger>
              <SelectContent>
                {EXAMPLES.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={() => setSelected("showcase")}>Reset</Button>
          </div>
        </CardHeader>
        <CardContent className="pb-2 text-sm text-muted-foreground">
          <p>Przełączaj między przykładami – każdy komponent ma własny canvas i panel sterowania.</p>
        </CardContent>
      </Card>

      {/* wybrany przykład */}
      <div className="col-span-12">
        <Suspense
          fallback={
            <div className="flex h-[560px] items-center justify-center rounded-2xl border bg-black/10">
              Ładowanie przykładu…
            </div>
          }
        >
          {/* key wymusza pełny unmount/remount — stary canvas i GL zasoby zostaną poprawnie sprzątnięte */}
          <active.Comp key={selected} />
        </Suspense>
      </div>
    </div>
  );
}
