"use client";
import * as THREE from "three";

function setTexSRGB(tex: THREE.Texture) {
  if (!tex) return;
  if ("colorSpace" in tex) (tex as any).colorSpace = THREE.SRGBColorSpace;
  else (tex as any).encoding = THREE.sRGBEncoding;
}
function setTexLinear(tex: THREE.Texture) {
  if (!tex) return;
  if ("colorSpace" in tex) (tex as any).colorSpace = THREE.LinearSRGBColorSpace;
  else (tex as any).encoding = THREE.LinearEncoding;
}

/** Ustaw właściwe colorSpace dla popularnych map i odśwież materiały. */
export function fixMaterialColorSpaces(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;

    const apply = (m: THREE.Material) => {
      const mat = m as any;

      // sRGB — „kolorowe” mapy
      ["map", "emissiveMap"].forEach((k) => mat[k]?.isTexture && setTexSRGB(mat[k]));
      // Linear — mapy danych
      ["metalnessMap","roughnessMap","normalMap","displacementMap","aoMap","specularMap","bumpMap"]
        .forEach((k) => mat[k]?.isTexture && setTexLinear(mat[k]));

      mat.needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else apply(mesh.material);
  });
}
