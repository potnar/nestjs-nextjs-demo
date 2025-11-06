"use client";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { Mode } from "./Canvas";

type Props = {
  mode: Mode;
  radius: number;
  strength: number;
  damping: number;
  onMode: (m: Mode) => void;
  onRadius: (v: number) => void;
  onStrength: (v: number) => void;
  onDamping: (v: number) => void;
};

export default function Controls({
  mode, radius, strength, damping,
  onMode, onRadius, onStrength, onDamping
}: Props) {
  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => onMode("push")} variant={mode === "push" ? "default" : "secondary"}>
          Push (w górę)
        </Button>
        <Button onClick={() => onMode("pull")} variant={mode === "pull" ? "default" : "secondary"}>
          Pull (w dół)
        </Button>
      </div>

      <div className="text-sm mt-2">Promień: {radius.toFixed(2)} m</div>
      <Slider value={[radius]} min={0.3} max={5} step={0.05} onValueChange={(v) => onRadius(v[0])} />

      <div className="text-sm">Siła: {strength.toFixed(2)}</div>
      <Slider value={[strength]} min={0.1} max={2.0} step={0.05} onValueChange={(v) => onStrength(v[0])} />

      <div className="text-sm">Tłumienie: {damping.toFixed(2)}</div>
      <Slider value={[damping]} min={0.80} max={0.99} step={0.005} onValueChange={(v) => onDamping(v[0])} />
    </>
  );
}
