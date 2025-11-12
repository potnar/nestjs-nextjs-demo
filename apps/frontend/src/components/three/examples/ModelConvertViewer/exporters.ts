"use client";
import * as THREE from "three";

const importGLTFExporter = () => import("three/examples/jsm/exporters/GLTFExporter.js");
const importOBJExporter  = () => import("three/examples/jsm/exporters/OBJExporter.js");
const importSTLExporter  = () => import("three/examples/jsm/exporters/STLExporter.js");
const importPLYExporter  = () => import("three/examples/jsm/exporters/PLYExporter.js");
const importUSDZExporter = () => import("three/examples/jsm/exporters/USDZExporter.js");

export type ExportFormat = "glb" | "gltf" | "obj" | "stl" | "ply" | "usdz";
type GLTFJSON = Record<string, unknown>;

function saveBlob(data: BlobPart, mime: string, filename: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Kopiuje ArrayBufferLike (w tym SharedArrayBuffer) do zwykłego ArrayBuffer */
function toArrayBuffer(buf: ArrayBufferLike): ArrayBuffer {
  const out = new ArrayBuffer(buf.byteLength);
  new Uint8Array(out).set(new Uint8Array(buf));
  return out;
}

/** Zwraca *zawsze* zwykły ArrayBuffer (bez SharedArrayBuffer/ArrayBufferLike) */
function ensureArrayBuffer(x: unknown): ArrayBuffer {
  if (x instanceof ArrayBuffer) return x;

  // SharedArrayBuffer (gdy dostępny w środowisku)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - TS zna globalny typ, ale sprawdzamy defensywnie
  if (typeof SharedArrayBuffer !== "undefined" && x instanceof SharedArrayBuffer) {
    return toArrayBuffer(x as unknown as ArrayBufferLike);
  }

  if (x instanceof Uint8Array) return toArrayBuffer(x.buffer);
  if (x instanceof DataView)   return toArrayBuffer(x.buffer);
  if (typeof x === "string")   return new TextEncoder().encode(x).buffer;

  throw new Error("Expected ArrayBuffer-like result");
}

export async function exportObject(
  root: THREE.Object3D,
  fmt: ExportFormat,
  name: string
): Promise<void> {
  switch (fmt) {
    case "glb": {
      const { GLTFExporter } = await importGLTFExporter();
      const exporter = new GLTFExporter();
      await new Promise<void>((resolve, reject) => {
        exporter.parse(
          root,
          (result: ArrayBuffer | GLTFJSON) => {
            const ab = result instanceof ArrayBuffer ? result : ensureArrayBuffer(result);
            saveBlob(ab, "model/gltf-binary", `${name}.glb`);
            resolve();
          },
          (err: unknown) => reject(err),
          { binary: true, onlyVisible: true, includeCustomExtensions: true }
        );
      });
      break;
    }

    case "gltf": {
      const { GLTFExporter } = await importGLTFExporter();
      const exporter = new GLTFExporter();
      await new Promise<void>((resolve, reject) => {
        exporter.parse(
          root,
          (result: ArrayBuffer | GLTFJSON) => {
            const json = result instanceof ArrayBuffer
              ? new TextDecoder().decode(new Uint8Array(result))
              : JSON.stringify(result, null, 2);
            saveBlob(json, "model/gltf+json", `${name}.gltf`);
            resolve();
          },
          (err: unknown) => reject(err),
          { binary: false, onlyVisible: true, includeCustomExtensions: true, embedImages: true }
        );
      });
      break;
    }

    case "obj": {
      const { OBJExporter } = await importOBJExporter();
      const exporter = new OBJExporter();
      const text: string = exporter.parse(root);
      saveBlob(text, "text/plain", `${name}.obj`);
      break;
    }

    case "stl": {
      const { STLExporter } = await importSTLExporter();
      const exporter = new STLExporter();
      const res = exporter.parse(root, { binary: true }); // string | ArrayBuffer
      const ab = ensureArrayBuffer(res);
      saveBlob(ab, "model/stl", `${name}.stl`);
      break;
    }

    case "ply": {
      const { PLYExporter } = await importPLYExporter();
      const exporter = new PLYExporter();
      await new Promise<void>((resolve, reject) => {
        exporter.parse(
          root,
          (res: string | ArrayBuffer) => {
            const ab = ensureArrayBuffer(res);
            saveBlob(ab, "model/ply", `${name}.ply`);
            resolve();
          },
          { binary: true }
        );
      });
      break;
    }

    case "usdz": {
      const { USDZExporter } = await importUSDZExporter();
      const exporter = new USDZExporter();
      await new Promise<void>((resolve, reject) => {
        exporter.parse(
          root,
          (result: Uint8Array<ArrayBuffer>) => {
            saveBlob(result, "model/vnd.usdz+zip", `${name}.usdz`);
            resolve();
          },
          (err: unknown) => reject(err)
        );
      });
      break;
    }
  }
}
