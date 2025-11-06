"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Help() {
  return (
    <Card className="mt-4">
      <CardHeader><CardTitle>Jak to działa?</CardTitle></CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="raycaster">
            <AccordionTrigger>1) Raycaster i NDC</AccordionTrigger>
            <AccordionContent>
              <pre className="rounded-md p-3 bg-muted overflow-x-auto">
{`const raycaster = new THREE.Raycaster();
const rect = renderer.domElement.getBoundingClientRect();
mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
raycaster.setFromCamera(mouse, camera);`}
              </pre>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cubes">
            <AccordionTrigger>2) Cubes – zmiana koloru</AccordionTrigger>
            <AccordionContent>
              <pre className="rounded-md p-3 bg-muted overflow-x-auto">
{`const hit = raycaster.intersectObjects(cubes, false)[0];
if (hit) (hit.object as THREE.Mesh).material.color.set(targetHex);`}
              </pre>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="house">
            <AccordionTrigger>3) House – Fill i Brush</AccordionTrigger>
            <AccordionContent>
              <pre className="rounded-md p-3 bg-muted overflow-x-auto">
{`// Fill (cała ściana jednym kliknięciem)
const hit = raycaster.intersectObjects(walls, false)[0];
if (hit) {
  const wall = wallsRef.find(w => w.mesh === hit.object)!;
  fillCanvas(wall.ctx, targetHex);
  wall.tex.needsUpdate = true;
}

// Brush (ciągły drag po UV)
if (hit && hit.uv) {
  const x = Math.floor(hit.uv.x * canvas.width);
  const y = Math.floor((1 - hit.uv.y) * canvas.height);
  paintDot(ctx, x, y, brushRadius, targetHex);
  texture.needsUpdate = true;
}`}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
