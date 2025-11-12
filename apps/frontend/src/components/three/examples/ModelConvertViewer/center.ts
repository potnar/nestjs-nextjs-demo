"use client";
import * as THREE from "three";

export type CenterMode = "center" | "bottom";

/**
 * Ustaw pivot modelu w środku (center) lub postaw na ziemi (bottom).
 * Działa poprawnie nawet gdy rodzic obiektu ma skalę ≠ 1 (np. rootRef.setScalar(scale)).
 */
export function centerObject(object: THREE.Object3D, mode: CenterMode = "center") {
  if (!object.parent) return;

  // Upewnij się, że macierze są aktualne
  object.updateWorldMatrix(true, true);

  const parent = object.parent;

  // 1) BOX w świecie
  const boxWorld = new THREE.Box3().setFromObject(object);
  if (!isFinite(boxWorld.min.x) || !isFinite(boxWorld.max.x)) return;

  // 2) Środek boxa w świecie -> do układu RODZICA
  const centerWorld = boxWorld.getCenter(new THREE.Vector3());
  const centerInParent = parent.worldToLocal(centerWorld.clone());

  // 3) Przesuń tak, aby środek wypadł w (0,0,0) rodzica
  object.position.sub(centerInParent);
  object.updateWorldMatrix(true, true);

  if (mode === "bottom") {
    // 4) Po wycentrowaniu – postaw na ziemi (Y=0)
    const boxAfter = new THREE.Box3().setFromObject(object);
    const minWorldY = boxAfter.min.y; // ile w świecie jest poniżej 0

    // Konwersja przesunięcia światowego na układ rodzica
    // (jeśli rodzic ma skalę s, to dystans lokalny = światowy / s)
    const parentScale = new THREE.Vector3();
    parent.getWorldScale(parentScale);

    if (parentScale.y !== 0) {
      object.position.y += -minWorldY / parentScale.y;
      object.updateWorldMatrix(true, true);
    }
  }
}
