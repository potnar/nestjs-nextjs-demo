"use client";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

const importGLTFLoader = () => import("three/examples/jsm/loaders/GLTFLoader.js");
const importDRACO      = () => import("three/examples/jsm/loaders/DRACOLoader.js");
const importMeshopt    = () => import("three/examples/jsm/libs/meshopt_decoder.module.js");
const importKTX2       = () => import("three/examples/jsm/loaders/KTX2Loader.js");
const importOBJLoader  = () => import("three/examples/jsm/loaders/OBJLoader.js");
const importMTLLoader  = () => import("three/examples/jsm/loaders/MTLLoader.js");
const importFBXLoader  = () => import("three/examples/jsm/loaders/FBXLoader.js");
const importSTLLoader  = () => import("three/examples/jsm/loaders/STLLoader.js");
const importPLYLoader  = () => import("three/examples/jsm/loaders/PLYLoader.js");

export type SupportedExt = "gltf" | "glb" | "obj" | "fbx" | "stl" | "ply";

export function inferExt(name: string): SupportedExt | null {
  const m = name.toLowerCase().match(/\.(gltf|glb|obj|fbx|stl|ply)$/i);
  return (m?.[1] as SupportedExt) ?? null;
}

// --- helpers for sidecars ---
type FileMap = Record<string, string>; // filename(lowercase) -> blobURL

function buildFileMap(files: File[] = []): FileMap {
  const map: FileMap = {};
  for (const f of files) map[f.name.toLowerCase()] = URL.createObjectURL(f);
  return map;
}

function makeManager(map: FileMap): THREE.LoadingManager {
  const manager = new THREE.LoadingManager();
  if (Object.keys(map).length) {
    manager.setURLModifier((url) => {
      const key = url.split(/[\\/]/).pop()?.toLowerCase() ?? url.toLowerCase();
      return map[key] ?? url;
    });
  }
  return manager;
}

export async function loadFileToObject(
  file: File,
  sidecars: File[] = [],
  renderer?: THREE.WebGLRenderer
): Promise<THREE.Object3D> {
  const ext = inferExt(file.name);
  if (!ext) throw new Error("Nieobsługiwane rozszerzenie. Obsługuję: gltf, glb, obj, fbx, stl, ply.");

  const buf = await file.arrayBuffer();
  const name = file.name;
  const map = buildFileMap(sidecars);
  const manager = makeManager(map);
  const BASE = (process.env.NEXT_PUBLIC_BASE_PATH as string) || "";

  switch (ext) {
    case "glb":
    case "gltf": {
      const [{ GLTFLoader }, { DRACOLoader }, { MeshoptDecoder }, { KTX2Loader }] = await Promise.all([
        importGLTFLoader(), importDRACO(), importMeshopt(), importKTX2()
      ]);

      const loader = new GLTFLoader(manager);

      // DRACO (local -> CDN)
      const draco = new DRACOLoader(manager);
      const DRACO_LOCAL = `${BASE}/libs/draco/`;
      const DRACO_CDN   = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";
      let dracoPath = DRACO_LOCAL;
      try {
        const head = await fetch(`${DRACO_LOCAL}draco_decoder.wasm`, { method: "HEAD", cache: "no-store" });
        if (!head.ok) dracoPath = DRACO_CDN;
      } catch { dracoPath = DRACO_CDN; }
      draco.setDecoderPath(dracoPath);
      loader.setDRACOLoader(draco);

      // KTX2 (local -> CDN)
      const ktx2 = new KTX2Loader(manager);
      const BASIS_LOCAL = `${BASE}/libs/basis/`;
      const BASIS_CDN   = "https://unpkg.com/three@0.164.0/examples/jsm/libs/basis/";
      let basisPath = BASIS_LOCAL;
      try {
        const head = await fetch(`${BASIS_LOCAL}basis_transcoder.wasm`, { method: "HEAD", cache: "no-store" });
        if (!head.ok) basisPath = BASIS_CDN;
      } catch { basisPath = BASIS_CDN; }
      ktx2.setTranscoderPath(basisPath);
      if (renderer) ktx2.detectSupport(renderer);
      loader.setKTX2Loader(ktx2);

      // Meshopt
      loader.setMeshoptDecoder(MeshoptDecoder);

      if (ext === "glb") {
        const gltf: GLTF = await new Promise<GLTF>((res, rej) =>
          loader.parse(buf as ArrayBuffer, "", res, rej)
        );
        const root = (gltf.scene || gltf.scenes?.[0]) as THREE.Object3D | undefined;
        if (!root) throw new Error("GLB nie zawiera sceny.");
        root.name ||= name;
        return root;
      } else {
        const url = URL.createObjectURL(file);
        try {
          const gltf: GLTF = await new Promise<GLTF>((res, rej) => loader.load(url, res, undefined, rej));
          const root = (gltf.scene || gltf.scenes?.[0]) as THREE.Object3D | undefined;
          if (!root) throw new Error("GLTF nie zawiera sceny.");
          root.name ||= name;
          return root;
        } finally {
          URL.revokeObjectURL(url);
        }
      }
    }

    case "obj": {
      const [{ OBJLoader }, { MTLLoader }] = await Promise.all([importOBJLoader(), importMTLLoader()]);
      const text = new TextDecoder().decode(new Uint8Array(buf));
      const objLoader = new OBJLoader(manager);

      // spróbuj dopasować MTL
      const mtlKey = file.name.replace(/\.[^.]+$/i, ".mtl").toLowerCase();
      const mtlUrl = map[mtlKey];
      if (mtlUrl) {
        const mtlTxt = await (await fetch(mtlUrl)).text();
        const mtlLoader = new MTLLoader(manager);
        const materials = mtlLoader.parse(mtlTxt, "");
        materials.preload();
        objLoader.setMaterials(materials);
      }

      const obj = objLoader.parse(text);
      obj.name ||= name;
      return obj;
    }

    case "fbx": {
      const { FBXLoader } = await importFBXLoader();
      const loader = new FBXLoader(manager);
      const obj = loader.parse(buf as ArrayBuffer, "");
      obj.name ||= name;
      return obj;
    }

    case "stl": {
      const { STLLoader } = await importSTLLoader();
      const loader = new STLLoader();
      const geom = loader.parse(buf as ArrayBuffer);
      const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0, roughness: 0.9 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name ||= name;
      return mesh;
    }

    case "ply": {
      const { PLYLoader } = await importPLYLoader();
      const loader = new PLYLoader();
      const geom = loader.parse(buf as ArrayBuffer);
      const hasVC = !!geom.getAttribute("color");
      if (!geom.getAttribute("normal")) geom.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        metalness: 0, roughness: 0.9,
        color: hasVC ? undefined : 0xcccccc,
        vertexColors: hasVC
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.name ||= name;
      return mesh;
    }
  }
}
