"use client";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useThreeCanvas } from "../../useThreeCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type ClickInfo = { name: string; index: number } | null;
// pomocniczy alias dla kostek
type CubeMesh = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;

export default function ExampleRaycastAdvanced() {
  const [selected, setSelected] = useState<ClickInfo>(null);
  const [targetColor, setTargetColor] = useState<string>("#ff4d4f");
  const [showModalOnClick, setShowModalOnClick] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // aktualne wartości dostępne w handlerach
  const targetColorRef = useRef(targetColor);
  const showModalRef = useRef(showModalOnClick);
  useEffect(() => { targetColorRef.current = targetColor; }, [targetColor]);
  useEffect(() => { showModalRef.current = showModalOnClick; }, [showModalOnClick]);

  const mouse = useMemo(() => new THREE.Vector2(), []);

  // STABILNY onBuild — bez `any`
  const onBuild = useCallback((
    { scene, camera, renderer }: {
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
    }
  ) => {
    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const spot = new THREE.SpotLight(0xffffff, 1);
    spot.position.set(5, 8, 5);
    scene.add(ambient, spot);

    // Grid 3x3
    const cubes: CubeMesh[] = [];
    const geo = new THREE.BoxGeometry(1, 1, 1);
    let idx = 0;
    for (let x = -2; x <= 2; x += 2) {
      for (let z = -2; z <= 2; z += 2) {
        idx++;
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5),
        });
        const m: CubeMesh = new THREE.Mesh(geo, mat);
        m.position.set(x, 0.5, z);
        m.name = `cube_${idx}`;
        // użyj wbudowanego userData zamiast castów any
        m.userData.idx = idx;
        cubes.push(m);
        scene.add(m);
      }
    }

    const raycaster = new THREE.Raycaster();

    const onClick = (event: MouseEvent) => {
      const rect = (renderer.domElement as HTMLCanvasElement).getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(cubes, false);
      if (!hits[0]) return;

      const obj = hits[0].object as CubeMesh;
      const mat = obj.material;
      // aktualny kolor z ref
      try {
        mat.color.set(targetColorRef.current);
      } catch {
        // ignoruj niepoprawny hex
      }

      const idxMaybe = obj.userData?.idx;
      const index = typeof idxMaybe === "number" ? idxMaybe : -1;
      setSelected({ name: obj.name, index });

      if (showModalRef.current) setDialogOpen(true);
    };

    renderer.domElement.addEventListener("click", onClick);

    return {
      dispose: () => {
        renderer.domElement.removeEventListener("click", onClick);
        // sprzątanie: usuń obiekty, nie zwalniaj współdzielonej geo (jest na wielu Meshach)
        for (const m of cubes) {
          scene.remove(m);
          m.material.dispose();
          // geo współdzielona (geo) — nie dispose tutaj, jedno miejsce powinno być właścicielem
        }
        scene.remove(ambient, spot);
      }
    };
  }, [mouse]);

  const canvasOpts = useMemo(() => ({ onBuild }), [onBuild]);
  const ref = useThreeCanvas(canvasOpts);

  // --- Snippety kodu (bez zmian) ---
  const snippetRaycaster = `// Utworzenie raycastera (poza render-loop)
const raycaster = new THREE.Raycaster();
// ...
const hits = raycaster.intersectObjects(cubes, false);
const first = hits[0];`;

  const snippetClickHandler = `function onClick(event: MouseEvent) {
  // ...
  const hits = raycaster.intersectObjects(cubes);
  if (hits[0]) {
    const obj = hits[0].object as THREE.Mesh;
    // ...akcje na klikniętym obiekcie
  }
}`;

  const snippetColoring = `// Ustawienie wcześniej wybranego koloru (hex) na materiale
const mat = obj.material as THREE.MeshStandardMaterial;
mat.color.set(targetColor); // np. "#ff4d4f"`;

  const snippetModal = `// Sterowanie modalem w React
const [dialogOpen, setDialogOpen] = useState(false);
if (showModalOnClick) setDialogOpen(true);`;

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        {/* Canvas */}
        <div className="col-span-9 h-[520px] rounded-2xl overflow-hidden border" ref={ref} />

        {/* Panel sterowania */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Raycasting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">Kliknij sześcian, aby zmienić jego kolor.</div>

            <div className="flex items-center justify-between">
              <Label htmlFor="color">Kolor docelowy</Label>
              <Input
                id="color"
                type="color"
                value={targetColor}
                onChange={(e) => setTargetColor(e.target.value)}
                className="h-8 w-16 p-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="modal">Pokaż modal po kliknięciu</Label>
              <Switch
                id="modal"
                checked={showModalOnClick}
                onCheckedChange={setShowModalOnClick}
              />
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Zaznaczenie:</div>
              <Badge variant={selected ? "default" : "secondary"}>
                {selected ? `#${selected.index} (${selected.name})` : "nic nie wybrano"}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              Pod maską: Raycaster → intersectObjects → pierwszy trafiony mesh.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sekcja pomocy */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Jak to działa?</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="raycaster">
              <AccordionTrigger>1) Ustawienie raycastera i NDC</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-sm">
                  Raycaster potrzebuje współrzędnych myszy w NDC [-1, 1] dla projekcji kamery.
                </p>
                <pre className="rounded-md p-3 bg-muted overflow-x-auto">
                  <code>{snippetRaycaster}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="click">
              <AccordionTrigger>2) Obsługa kliknięcia na canvasie</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-sm">
                  Nasłuch na <code>renderer.domElement</code>, wyznaczenie NDC, strzał raycasterem.
                </p>
                <pre className="rounded-md p-3 bg-muted overflow-x-auto">
                  <code>{snippetClickHandler}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="coloring">
              <AccordionTrigger>3) Zmiana koloru klikniętego obiektu</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-sm">
                  Ustawiamy <code>mat.color</code> na wartość z color pickera (hex).
                </p>
                <pre className="rounded-md p-3 bg-muted overflow-x-auto">
                  <code>{snippetColoring}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="modal">
              <AccordionTrigger>4) Modal z komunikatem (opcjonalny)</AccordionTrigger>
              <AccordionContent className="space-y-2">
                <p className="text-sm">
                  Pokazujemy modal warunkowo na podstawie przełącznika.
                </p>
                <pre className="rounded-md p-3 bg-muted overflow-x-auto">
                  <code>{snippetModal}</code>
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kliknięto sześcian</DialogTitle>
            <DialogDescription>
              {selected
                ? `Wybrano: #${selected.index} (${selected.name}).`
                : "Brak danych o wyborze."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
