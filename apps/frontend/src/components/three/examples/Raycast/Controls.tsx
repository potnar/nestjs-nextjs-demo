"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import type { Model, ClickInfo, HousePaintMode } from "./types";

export type ControlsProps = {
  model: Model;
  setModel: (m: Model) => void;

  targetColor: string;
  setTargetColor: (c: string) => void;

  showModalOnClick: boolean;
  setShowModalOnClick: (v: boolean) => void;

  // House only
  brushRadius: number;
  setBrushRadius: (n: number) => void;
  houseRotationDeg: number;
  setHouseRotationDeg: (deg: number) => void;
  housePaintMode: HousePaintMode;
  setHousePaintMode: (m: HousePaintMode) => void;

  selected: ClickInfo;
};

export default function Controls({
  model, setModel,
  targetColor, setTargetColor,
  showModalOnClick, setShowModalOnClick,
  brushRadius, setBrushRadius,
  houseRotationDeg, setHouseRotationDeg,
  housePaintMode, setHousePaintMode,
  selected,
}: ControlsProps) {

  // Popover z potwierdzeniem koloru
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftColor, setDraftColor] = useState(targetColor);

  const applyColor = () => {
    setTargetColor(draftColor);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm">Kliknij obiekt (albo maluj/wypełnij ścianę w trybie House).</div>

      <div className="flex items-center gap-2">
        <Button onClick={() => setModel("cubes")} variant={model === "cubes" ? "default" : "secondary"}>Cubes</Button>
        <Button onClick={() => setModel("house")} variant={model === "house" ? "default" : "secondary"}>House</Button>
      </div>

      {/* Kolor z przyciskiem Zastosuj */}
      <div className="flex items-center justify-between">
        <Label>Kolor</Label>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-8 px-2">
              <span className="mr-2 text-xs">Wybierz</span>
              <span className="inline-block h-4 w-6 rounded border" style={{ background: targetColor }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[220px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Podgląd</span>
              <span className="inline-block h-4 w-6 rounded border" style={{ background: draftColor }} />
            </div>
            {/* prosto i bez zależności – natywne color input */}
            <input
              type="color"
              value={draftColor}
              onChange={(e) => setDraftColor(e.target.value)}
              className="h-10 w-full rounded-md border p-1"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setDraftColor(targetColor); setPickerOpen(false); }}>Anuluj</Button>
              <Button onClick={applyColor}>Zastosuj</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {model === "house" && (
        <>
          {/* Paint mode */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setHousePaintMode("fill")}
              variant={housePaintMode === "fill" ? "default" : "secondary"}
            >
              Fill (cała ściana)
            </Button>
            <Button
              onClick={() => setHousePaintMode("brush")}
              variant={housePaintMode === "brush" ? "default" : "secondary"}
            >
              Brush
            </Button>
          </div>

          {/* Rotation */}
          <div>
            <div className="text-sm mb-1">Rotation (°): {houseRotationDeg}</div>
            <Slider value={[houseRotationDeg]} min={0} max={360} step={1} onValueChange={(v) => setHouseRotationDeg(v[0])} />
          </div>

          {/* Brush radius only for Brush mode */}
          {housePaintMode === "brush" && (
            <div>
              <div className="text-sm mb-1">Brush radius: {brushRadius}px</div>
              <Slider value={[brushRadius]} min={4} max={128} step={2} onValueChange={(v) => setBrushRadius(v[0])} />
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="modal">Pokaż modal po kliknięciu</Label>
        <Switch id="modal" checked={showModalOnClick} onCheckedChange={setShowModalOnClick} />
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1">Zaznaczenie:</div>
        <Badge variant={selected ? "default" : "secondary"}>
          {selected ? `#${selected.index} (${selected.name})` : "nic nie wybrano"}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground">
        House/Fill: klik = wypełnij tylko wskazaną ścianę. House/Brush: maluj pędzlem po UV; przy drag wyłączamy orbit.
      </div>
    </div>
  );
}
