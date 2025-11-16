"use client";

import { useEffect, useRef, useState } from "react";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const SPLAT_URL = process.env.NEXT_PUBLIC_GSPLAT_URL;

export default function GaussianSplatDemo() {
  // jeśli env nie ustawione – nie renderuj komponentu
  if (!SPLAT_URL) {
    if (typeof window !== "undefined") {
      console.error("Missing NEXT_PUBLIC_GSPLAT_URL");
    }
    return null;
  }

  const [path, setPath] = useState(SPLAT_URL);
  const [scale, setScale] = useState(1.5);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);

  const reloadSplat = (splatPath: string, newScale: number) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

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
    if (!containerRef.current || typeof window === "undefined") return;

    const viewer = new (GaussianSplats3D as any).Viewer({
      rootElement: containerRef.current,
      cameraUp: [0, -1, -0.6],
      initialCameraPosition: [-1, -4, 6],
      initialCameraLookAt: [0, 4, 0],
    });

    viewerRef.current = viewer;

    // pierwszy load
    reloadSplat(path, scale);
    (window as any).gsViewer = viewer;

    viewer.start?.();

    return () => {
      try {
        viewer.dispose?.();
      } catch (e) {
        console.warn("[GS] dispose error:", e);
      }
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // tylko mount/unmount

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
              reloadSplat(path, newScale);
            }}
          />

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const base = 1.5;
                setScale(base);
                reloadSplat(path, base);
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
                reloadSplat(path, next);
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
