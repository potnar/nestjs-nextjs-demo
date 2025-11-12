"use client";
import * as THREE from "three";

type KnownMat =
  | THREE.MeshStandardMaterial
  | THREE.MeshPhysicalMaterial
  | (THREE.Material & Partial<Record<"map" | "emissiveMap" | "metalnessMap" | "roughnessMap" | "normalMap" | "displacementMap" | "aoMap" | "specularMap" | "bumpMap", THREE.Texture>>);

/** zgodność z r151- i r152+ */
function setTexSRGB(tex: THREE.Texture | undefined) {
  if (!tex) return;
  if ("colorSpace" in tex) (tex as THREE.Texture & { colorSpace?: THREE.ColorSpace }).colorSpace = THREE.SRGBColorSpace;
  else (tex as unknown as { encoding?: THREE.TextureEncoding }).encoding = THREE.sRGBEncoding;
}
function setTexLinear(tex: THREE.Texture | undefined) {
  if (!tex) return;
  if ("colorSpace" in tex) (tex as THREE.Texture & { colorSpace?: THREE.ColorSpace }).colorSpace = THREE.LinearSRGBColorSpace;
  else (tex as unknown as { encoding?: THREE.TextureEncoding }).encoding = THREE.LinearEncoding;
}

export function fixMaterialColorSpaces(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    const apply = (m: THREE.Material) => {
      const mat = m as KnownMat;

      // sRGB — kolorowe
      setTexSRGB((mat as any).map);
      setTexSRGB((mat as any).emissiveMap);
      // Linear — mapy danych
      setTexLinear((mat as any).metalnessMap);
      setTexLinear((mat as any).roughnessMap);
      setTexLinear((mat as any).normalMap);
      setTexLinear((mat as any).displacementMap);
      setTexLinear((mat as any).aoMap);
      setTexLinear((mat as any).specularMap);
      setTexLinear((mat as any).bumpMap);

      (mat as THREE.Material).needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) mesh.material.forEach(apply);
    else apply(mesh.material);
  });
}
