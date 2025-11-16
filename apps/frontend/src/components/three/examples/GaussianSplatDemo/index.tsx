/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const SPLAT_URL = process.env.NEXT_PUBLIC_GSPLAT_URL;

export default function GaussianSplatDemo() {
  // 🔹 HOOKI – zawsze na górze, bez warunków
  const [path, setPath] = useState<string>(SPLAT_URL ?? "");
  const [scale, setScale] = useState(1.5);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);

  const reloadSplat = (splatPath: string, newScale: number) => {
    const viewer = viewerRef.current;
    if (!viewer || !splatPath) return;

    viewer.clearScenes?.();

    viewer
      .addSplatScene(splatPath, {
        splatAlphaRemovalThreshold: 5,
        showLoadingUI: true,
        position: [0, 1, 0],
        rotation: [0, 0, 0, 1],
        scale: [newScale, newScale, newScale],
      })
      .catch((e: any) => console.error("[GS] reload error:", e));
  };

  useEffect(() => {
    // guard wewnątrz hooka jest OK – nie łamie rules-of-hooks
    if (!containerRef.current || typeof window === "undefined" || !SPLAT_URL) return;

    const viewer = new (GaussianSplats3D as any).Viewer({
      rootElement: containerRef.current,
      cameraUp: [0, -1, -0.6],
      initialCameraPosition: [-1, -4, 6],
      initialCameraLookAt: [0, 4, 0],
    });

    viewerRef.current = viewer;

    // pierwszy load – bierzemy SPLAT_URL z env
    reloadSplat(SPLAT_URL, scale);
    (window as any).gsViewer = viewer;

    viewer.start?.();

    return () => {
      try {
        viewer.dispose?.();
      } catch (e: any) {
        console.warn("[GS] dispose error:", e);
      }
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // tylko mount/unmount, celowo ignorujemy zależności

  // 🔹 TERAZ dopiero wczesny return – poniżej hooków
  if (!SPLAT_URL) {
    return (
      <div className="rounded-2xl border p-4 text-sm text-red-400 bg-red-950/40">
        Missing <code>NEXT_PUBLIC_GSPLAT_URL</code>.  
        Set it in <code>.env.local</code> i w ustawieniach Vercela.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* viewer po lewej */}
      <div
        ref={containerRef}
        className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border bg-black"
      >
        <div className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-1">
          Gaussian Splat Viewer
        </div>
      </div>

      {/* panel sterowania po prawej */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Gaussian Splat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">Plik</div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (!SPLAT_URL) return;
                setPath(SPLAT_URL);
                reloadSplat(SPLAT_URL, scale);
              }}
            >
              Głośnik
            </Button>
          </div>

          <div className="text-sm mt-2">Scale: {scale.toFixed(2)}</div>
          <Slider
            value={[scale]}
            min={0.5}
            max={4}
            step={0.1}
            onValueChange={([v]) => {
              const newScale = v;
              setScale(newScale);
              if (path) {
                reloadSplat(path, newScale);
              }
            }}
          />

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const base = 1.5;
                setScale(base);
                if (path) {
                  reloadSplat(path, base);
                }
              }}
            >
              Reset view
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const next = Math.min(scale + 0.5, 4);
                setScale(next);
                if (path) {
                  reloadSplat(path, next);
                }
              }}
            >
              + scale
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
