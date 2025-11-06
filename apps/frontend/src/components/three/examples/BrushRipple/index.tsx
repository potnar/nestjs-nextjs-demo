"use client";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Controls from "./Controls";
import BrushRippleCanvas, { BrushApi, Mode } from "./Canvas";

export default function BrushRipple() {
  const [mode, setMode] = useState<Mode>("push");
  const [radius, setRadius] = useState(1.2);
  const [strength, setStrength] = useState(0.55);
  const [damping, setDamping] = useState(0.92);
  const [wire, setWire] = useState(false);
  const [fps, setFps] = useState(0);

  const apiRef = useRef<BrushApi | null>(null);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Canvas po lewej */}
      <BrushRippleCanvas
        className="relative col-span-9 h-[520px] rounded-2xl overflow-hidden border bg-black/20"
        mode={mode}
        radius={radius}
        strength={strength}
        damping={damping}
        wire={wire}
        onFps={setFps}
        onReady={(api) => (apiRef.current = api)}
      >
        <div className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-xs px-2 py-1 space-y-0.5">
          <div>FPS: {fps}</div>
          <div>Mode: {mode}</div>
          <div>Promień: {radius.toFixed(2)} m</div>
          <div>Siła: {strength.toFixed(2)}</div>
          <div>Tłumienie: {damping.toFixed(2)}</div>
          <div className="opacity-75">LPM: maluj • PPM/scroll: orbit</div>
        </div>
      </BrushRippleCanvas>

      {/* Panel po prawej */}
      <Card className="col-span-3">
        <CardHeader><CardTitle>Brush & Ripple</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Controls
            mode={mode}
            radius={radius}
            strength={strength}
            damping={damping}
            onMode={setMode}
            onRadius={setRadius}
            onStrength={setStrength}
            onDamping={setDamping}
          />

          <div className="flex gap-2">
            <Button variant={wire ? "default" : "secondary"} onClick={() => setWire(v => !v)}>
              {wire ? "Wireframe ✓" : "Wireframe"}
            </Button>
            <Button variant="secondary" onClick={() => apiRef.current?.reset()}>
              Reset powierzchni
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
            • Pędzel z miękkim falloffem (smoothstep).<br />
            • Falowanie: height-field (laplasjan + tłumienie).<br />
            • Raycasting celuje w płaszczyznę; pierścień pokazuje promień.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
