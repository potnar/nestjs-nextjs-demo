"use client";
import * as THREE from "three";

type Maps = {
  map?: THREE.Texture;
  emissiveMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  normalMap?: THREE.Texture;
  displacementMap?: THREE.Texture;
  aoMap?: THREE.Texture;
  specularMap?: THREE.Texture;
  bumpMap?: THREE.Texture;
};

type KnownMat =
  | (THREE.MeshStandardMaterial & Maps)
  | (THREE.MeshPhysicalMaterial & Maps)
  | (THREE.Material & Maps);

// r152+: ustawiamy colorSpace na teksturach (zero importów LinearEncoding/sRGBEncoding)
function setTexSRGB(tex?: THREE.Texture) {
  if (!tex) return;
  if ("colorSpace" in tex) {
    (tex as THREE.Texture & { colorSpace: THREE.ColorSpace }).colorSpace = THREE.SRGBColorSpace;
  }
}
function setTexLinear(tex?: THREE.Texture) {
  if (!tex) return;
  if ("colorSpace" in tex) {
    (tex as THREE.Texture & { colorSpace: THREE.ColorSpace }).colorSpace = THREE.LinearSRGBColorSpace;
  }
}

export function fixMaterialColorSpaces(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    const apply = (m: THREE.Material) => {
      const mat = m as KnownMat;

      // sRGB — kolorowe
      setTexSRGB(mat.map);
      setTexSRGB(mat.emissiveMap);

      // Linear — mapy danych
      setTexLinear(mat.metalnessMap);
      setTexLinear(mat.roughnessMap);
      setTexLinear(mat.normalMap);
      setTexLinear(mat.displacementMap);
      setTexLinear(mat.aoMap);
      setTexLinear(mat.specularMap);
      setTexLinear(mat.bumpMap);

      mat.needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(apply);
    } else {
      apply(mesh.material);
    }

  });
}
