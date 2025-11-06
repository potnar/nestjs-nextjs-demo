"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Canvas from "./Canvas";
import Controls from "./Controls";
import Help from "./Help";
import type { ClickInfo, Model, HousePaintMode } from "./types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ExampleRaycastAdvanced() {
  const [model, setModel] = useState<Model>("cubes");
  const [targetColor, setTargetColor] = useState<string>("#ff4d4f");
  const [showModalOnClick, setShowModalOnClick] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // House-only
  const [houseRotationDeg, setHouseRotationDeg] = useState<number>(0);
  const [housePaintMode, setHousePaintMode] = useState<HousePaintMode>("fill");
  const [brushRadius, setBrushRadius] = useState<number>(36);

  const [selected, setSelected] = useState<ClickInfo>(null);
  const [fps, setFps] = useState(0);

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        {/* Canvas */}
        <Canvas
          className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border"
          model={model}
          targetColor={targetColor}
          showModalOnClick={showModalOnClick}
          // house
          houseRotationDeg={houseRotationDeg}
          housePaintMode={housePaintMode}
          brushRadius={brushRadius}
          // callbacks
          onSelect={setSelected}
          onOpenModal={() => setDialogOpen(true)}
          onFps={setFps}
        >
          {/* HUD */}
          <div className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-1 space-y-0.5">
            <div>FPS: {fps}</div>
            <div>Model: {model}</div>
            {model === "house" && (
              <>
                <div>Mode: {housePaintMode}</div>
                <div>Rotation: {houseRotationDeg}°</div>
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
                ? housePaintMode === "fill"
                  ? "Kliknij ścianę, aby wypełnić kolor."
                  : "Przytrzymaj i przeciągnij po ścianie (Brush)."
                : "Kliknij sześcian, aby zmienić jego kolor."}
            </div>
          </div>
        </Canvas>

        {/* Panel */}
        <Card className="col-span-3">
          <CardHeader><CardTitle>Raycasting</CardTitle></CardHeader>
          <CardContent>
            <Controls
              model={model}
              setModel={setModel}
              targetColor={targetColor}
              setTargetColor={setTargetColor}
              showModalOnClick={showModalOnClick}
              setShowModalOnClick={setShowModalOnClick}
              // house only
              brushRadius={brushRadius}
              setBrushRadius={setBrushRadius}
              houseRotationDeg={houseRotationDeg}
              setHouseRotationDeg={setHouseRotationDeg}
              housePaintMode={housePaintMode}
              setHousePaintMode={setHousePaintMode}
              selected={selected}
            />
          </CardContent>
        </Card>
      </div>

      {/* Help */}
      <Help />

      {/* Modal */}
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
