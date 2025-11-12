"use client";
import * as THREE from "three";

const importGLTFExporter = () => import("three/examples/jsm/exporters/GLTFExporter.js");
const importOBJExporter  = () => import("three/examples/jsm/exporters/OBJExporter.js");
const importSTLExporter  = () => import("three/examples/jsm/exporters/STLExporter.js");
const importPLYExporter  = () => import("three/examples/jsm/exporters/PLYExporter.js");
const importUSDZExporter = () => import("three/examples/jsm/exporters/USDZExporter.js");

export type ExportFormat = "glb" | "gltf" | "obj" | "stl" | "ply" | "usdz";

/** Normalizuje wynik eksportera do prawdziwego ArrayBuffer (obsługa Uint8Array/SharedArrayBuffer). */
function ensureArrayBuffer(result: unknown): ArrayBuffer {
  if (result instanceof ArrayBuffer) return result;
  if (result instanceof Uint8Array) {
    return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
  }
  const u8 = new Uint8Array(result as ArrayBufferLike);
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

/** Pobiera blob jako plik. */
function download(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }, 0);
}

export async function exportObject(object: THREE.Object3D, format: ExportFormat, fileBase = "model") {
  switch (format) {
    case "glb": {
      const { GLTFExporter } = await importGLTFExporter();
      const exp = new GLTFExporter();

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        try {
          const parseAny = exp.parse as unknown as (
            input: any,
            onDone: (result: unknown) => void,
            options?: any
          ) => void;

          parseAny(
            object,
            (result) => resolve(ensureArrayBuffer(result)),
            { binary: true }
          );
        } catch (e) {
          reject(e as Error);
        }
      });

      return download(new Blob([arrayBuffer], { type: "model/gltf-binary" }), `${fileBase}.glb`);
    }

    case "gltf": {
      const { GLTFExporter } = await importGLTFExporter();
      const exp = new GLTFExporter();

      const json = await new Promise<Record<string, unknown>>((resolve, reject) => {
        try {
          const parseAny = exp.parse as unknown as (
            input: any,
            onDone: (result: unknown) => void,
            options?: any
          ) => void;

          parseAny(
            object,
            (result) => resolve(result as Record<string, unknown>),
            { binary: false }
          );
        } catch (e) {
          reject(e as Error);
        }
      });

      return download(new Blob([JSON.stringify(json)], { type: "model/gltf+json" }), `${fileBase}.gltf`);
    }

    case "obj": {
      const { OBJExporter } = await importOBJExporter();
      const exp = new OBJExporter();
      const txt = exp.parse(object);
      return download(new Blob([txt], { type: "text/plain" }), `${fileBase}.obj`);
    }

    case "stl": {
      const { STLExporter } = await importSTLExporter();
      const exp = new STLExporter();
      const txt = exp.parse(object);
      return download(new Blob([txt], { type: "model/stl" }), `${fileBase}.stl`);
    }

    case "ply": {
      const { PLYExporter } = await importPLYExporter();
      const exp = new PLYExporter();
      const txt = await new Promise<string>((res) => exp.parse(object, res, { littleEndian: true }));
      return download(new Blob([txt], { type: "application/octet-stream" }), `${fileBase}.ply`);
    }

    case "usdz": {
      const { USDZExporter } = await importUSDZExporter();
      const exp = new USDZExporter();

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        try {
          const parseAny = exp.parse as unknown as (
            obj: THREE.Object3D,
            onDone: (result: unknown) => void,
            onError?: (err: unknown) => void,
            options?: unknown
          ) => void;

          parseAny(
            object,
            (result) => resolve(ensureArrayBuffer(result)),
            (err) => reject(err)
          );
        } catch (e) {
          reject(e as Error);
        }
      });

      return download(new Blob([arrayBuffer], { type: "model/vnd.usdz+zip" }), `${fileBase}.usdz`);
    }
  }
}
