"use client";
import * as THREE from "three";

// Ładowarki dynamiczne (nie obciążają bundla na starcie)
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

// ————————————————— helpers: sidecary/manager —————————————————
type FileMap = Record<string, string>; // nazwa pliku (lowercase) -> blobURL

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


// ————————————————— główna funkcja —————————————————
export async function loadFileToObject(file: File, sidecars: File[] = []): Promise<THREE.Object3D> {
  const ext = inferExt(file.name);
  if (!ext) {
    throw new Error("Nieobsługiwane rozszerzenie. Obsługuję: gltf, glb, obj, fbx, stl, ply.");
  }

  const buf = await file.arrayBuffer();
  const name = file.name;

  switch (ext) {
    case "gltf":
    case "glb": {
      const [{ GLTFLoader }, { DRACOLoader }, { MeshoptDecoder }] = await Promise.all([
        importGLTFLoader(),
        importDRACO(),
        importMeshopt(),
      ]);

      const loader = new GLTFLoader();

      // --- DRACO: fallback lokalny -> CDN ---
      const draco = new DRACOLoader();
      const BASE = (process.env.NEXT_PUBLIC_BASE_PATH as string) || "";
      const DRACO_LOCAL = `${BASE}/libs/draco/`;
      const DRACO_CDN = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";
      let decoderPath = DRACO_LOCAL;
      try {
        const head = await fetch(`${DRACO_LOCAL}draco_decoder.wasm`, { method: "HEAD", cache: "no-store" });
        if (!head.ok) decoderPath = DRACO_CDN;
      } catch {
        decoderPath = DRACO_CDN;
      }
      draco.setDecoderPath(decoderPath);
      loader.setDRACOLoader(draco);

      // Meshopt (nazwany eksport)
      loader.setMeshoptDecoder(MeshoptDecoder);

      const gltf = await new Promise<any>((res, rej) => loader.parse(buf as ArrayBuffer, "", res, rej));
      const root: THREE.Object3D | undefined = (gltf.scene || gltf.scenes?.[0]) as THREE.Object3D | undefined;
      if (!root) throw new Error("GLTF nie zawiera sceny.");
      root.name ||= name;
      return root;
    }

   // ———————————————— OBJ (+MTL/tekstury) ————————————————
    case "obj": {
      const [{ OBJLoader }, { MTLLoader }] = await Promise.all([importOBJLoader(), importMTLLoader()]);
      const text = new TextDecoder().decode(new Uint8Array(buf));
      const objLoader = new OBJLoader(manager);

      // spróbuj znaleźć pasujący MTL
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

    // ———————————————— FBX ————————————————
    case "fbx": {
      const { FBXLoader } = await importFBXLoader();
      const loader = new FBXLoader(manager);
      const obj = loader.parse(buf as ArrayBuffer, "");
      obj.name ||= name;
      return obj;
    }

      // ———————————————— STL ————————————————
    case "stl": {
      const { STLLoader } = await importSTLLoader();
      const loader = new STLLoader();
      const geom = loader.parse(buf as ArrayBuffer);
      const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0, roughness: 0.9 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name ||= name;
      return mesh;
    }

   // ———————————————— PLY (vertexColors) ————————————————
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
