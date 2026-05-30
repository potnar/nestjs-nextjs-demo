"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Canvas from "./Canvas";
import Controls from "./Controls";
import Help from "./Help";
import type { ClickInfo, Model, PaintMode } from "./types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ExampleRaycastAdvanced() {
  const [model, setModel] = useState<Model>("cubes");
  const [targetColor, setTargetColor] = useState("#ff4d4f");
  const [showModal, setShowModal] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // House-only
  const [rotDeg, setRotDeg] = useState(0);
  const [paintMode, setPaintMode] = useState<PaintMode>("fill");
  const [brushRadius, setBrushRadius] = useState(36);

  const [selected, setSelected] = useState<ClickInfo>(null);
  const [fps, setFps] = useState(0);

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        <Canvas
          className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border"
          model={model}
          targetColor={targetColor}
          showModal={showModal}
          rotDeg={rotDeg}
          paintMode={paintMode}
          brushRadius={brushRadius}
          onSelect={setSelected}
          onOpenModal={() => setDialogOpen(true)}
          onFps={setFps}
        >
          <div className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-1 space-y-0.5">
            <div>FPS: {fps}</div>
            <div>Model: {model}</div>
            {model === "house" && (
              <>
                <div>Mode: {paintMode}</div>
                <div>Rotation: {rotDeg}°</div>
              </>
            )}
            <div>
              Zaznaczenie:{" "}
              <span className="inline-block rounded px-1 py-0.5 bg-white/10">
                {selected ? `#${selected.index} (${selected.name})` : "—"}
              </span>
            </div>
            <div className="opacity-75">
              {model === "house"
                ? paintMode === "fill"
                  ? "Kliknij ścianę, aby wypełnić kolor."
                  : "Przytrzymaj i przeciągnij po ścianie (Brush)."
                : "Kliknij sześcian, aby zmienić jego kolor."}
            </div>
          </div>
        </Canvas>

        <Card className="col-span-3">
          <CardHeader><CardTitle>Raycasting</CardTitle></CardHeader>
          <CardContent>
            <Controls
              model={model}
              setModel={setModel}
              targetColor={targetColor}
              setTargetColor={setTargetColor}
              showModal={showModal}
              setShowModal={setShowModal}
              brushRadius={brushRadius}
              setBrushRadius={setBrushRadius}
              rotDeg={rotDeg}
              setRotDeg={setRotDeg}
              paintMode={paintMode}
              setPaintMode={setPaintMode}
              selected={selected}
            />
          </CardContent>
        </Card>
      </div>

      <Help />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kliknięto obiekt</DialogTitle>
            <DialogDescription>
              {selected ? `Wybrano: #${selected.index} (${selected.name}).` : "Brak danych o wyborze."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
