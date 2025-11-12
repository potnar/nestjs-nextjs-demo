"use client";                          

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Opcje helpera "frame" — ile dodać marginesu przy kadrowaniu
type FrameOpts = { offset?: number };

// Kontekst przekazywany do onBuild — wszystko, czego zwykle potrzebujesz
type Ctx = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  /** Wycentruj kamerę na obiekcie i ustaw odległość tak, by cały się mieścił w kadrze */
  frame: (object: THREE.Object3D, opts?: FrameOpts) => void;
};

// Co może zwrócić onBuild: opcjonalny callback klatkowy i opcjonalny cleanup
type BuildResult = { onFrame?: (dt: number, t: number) => void; dispose?: () => void } | void;
type Build = (ctx: Ctx) => BuildResult;

// Główny hook: montuje canvas, tworzy Three.js, steruje pętlą animacji i sprzątaniem
export function useThreeCanvas({ onBuild }: { onBuild: Build }) {
  const mountRef = useRef<HTMLDivElement | null>(null); // kontener na <canvas>

  // Trzymamy najnowszą wersję onBuild w refie (stabilna referencja dla efektu)
  const onBuildRef = useRef<Build | null>(null);
  useEffect(() => {
    onBuildRef.current = onBuild; // aktualizuj, gdy onBuild się zmieni
  }, [onBuild]);

  // Stan wewnętrzny: id requestAnimationFrame, onFrame, i dispose
  const state = useRef<{ raf?: number; onFrame?: (dt: number, t: number) => void; dispose?: () => void }>({});

  // Główny efekt: tworzy i niszczy instancje Three.js
  useEffect(() => {
    const mount = mountRef.current;           // div, do którego wstrzykniemy canvas
    if (!mount) return;                       // bez kontenera — nic nie rób

    const w = mount.clientWidth || 800;       // szerokość startowa
    const h = mount.clientHeight || 500;      // wysokość startowa

    const scene = new THREE.Scene();          // scena 3D
    scene.background = new THREE.Color("#0b1020"); // tło sceny (ciemny granat)

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000); // kamera perspektywiczna
    camera.position.set(4, 3, 6);             // pozycja startowa
    camera.lookAt(0, 0, 0);                   // patrz na środek

    const renderer = new THREE.WebGLRenderer({ antialias: true }); // renderer WebGL z wygładzaniem

// 🔧 kolory i tonemapping
renderer.toneMappingExposure = 1.0;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.physicallyCorrectLights = true;

type RendererCS = THREE.WebGLRenderer & {
  outputColorSpace?: THREE.ColorSpace;
  outputEncoding?: THREE.TextureEncoding;
};
// NEW API (r152+)
const rcs = renderer as RendererCS;
if ("outputColorSpace" in rcs) {
  rcs.outputColorSpace = THREE.SRGBColorSpace;
} else {
  rcs.outputEncoding = THREE.sRGBEncoding;
}

    // Ustaw DPR; clamp do 2 dla wydajności (wysokie DPR na mobilkach bywa zabójcze)
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2));
    renderer.setSize(w, h);                   // rozmiar bufora + stylów (updateStyle domyślnie true)
    mount.appendChild(renderer.domElement);   // wstrzyknij <canvas> do kontenera

    const controls = new OrbitControls(camera, renderer.domElement); // mysz + orbitowanie
    controls.enableDamping = true;            // płynne wygaszanie ruchu
    controls.target.set(0, 0, 0);             // patrz w (0,0,0)
    controls.update();

    // 👉 Helper: dopasowuje kadr do obiektu tak, by cały był widoczny
    const frame = (object: THREE.Object3D, opts?: FrameOpts) => {
      const offset = opts?.offset ?? 1.65;    // współczynnik "jak daleko" (większy = dalej)
      const box = new THREE.Box3().setFromObject(object);           // oblicz AABB obiektu
      const size = box.getSize(new THREE.Vector3());                // rozmiary AABB
      const center = box.getCenter(new THREE.Vector3());            // środek AABB

      const maxSize = Math.max(size.x, size.y, size.z);             // największy wymiar
      // Ile trzeba odjechać, by największy wymiar zmieścił się w pionie kadru
      const fitHeight = maxSize / (2 * Math.tan((camera.fov * Math.PI) / 360));
      // A to samo w poziomie (zależne od aspektu)
      const fitWidth = fitHeight / camera.aspect;
      const distance = offset * Math.max(fitHeight, fitWidth);      // dystans kamery od targetu

      // Kierunek od aktualnego targetu do kamery (zachowaj kąt patrzenia)
      const dir = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize()
        .multiplyScalar(distance);

      // Ustaw near/far proporcjonalnie do dystansu, by zminimalizować artefakty z-buffera
      camera.near = Math.max(0.01, distance / 100);
      camera.far = distance * 100;
      camera.updateProjectionMatrix();

      controls.target.copy(center);           // patrz w środek obiektu
      camera.position.copy(center).add(dir);  // przesuń kamerę na wyliczony dystans
      controls.update();
    };

    // Wywołaj onBuild użytkownika i zapamiętaj jego callbacki
    const built = onBuildRef.current?.({ scene, camera, renderer, controls, frame }) ?? {};
    state.current.onFrame = built.onFrame;
    state.current.dispose = built.dispose;

    // Reakcja na zmiany rozmiaru kontenera (ResizeObserver)
    const handleResize = () => {
      const W = mount.clientWidth || w;
      const H = mount.clientHeight || h;
      camera.aspect = W / H || 1;            // zaktualizuj aspekt kamery
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);                // dopasuj canvas
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    // Pętla animacji: dt = czas między klatkami, t = czas całkowity w sekundach
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      controls.update();                     // damping itp.
      state.current.onFrame?.(dt, now / 1000); // użytkownikowy callback na klatkę
      renderer.render(scene, camera);        // render sceny
      state.current.raf = requestAnimationFrame(loop); // kolejna klatka
    };
    state.current.raf = requestAnimationFrame(loop); // start pętli

    // Snapshoty zmiennych do poprawnego cleanupu (bez polegania na refie, który może się zmienić)
    const rafIdAtMount = state.current.raf;
    const disposeAtMount = state.current.dispose;
    const domAtMount = renderer.domElement;

    // Funkcja sprzątająca — wywoływana przy odmontowaniu
    return () => {
      if (rafIdAtMount) cancelAnimationFrame(rafIdAtMount); // zatrzymaj animację
      ro.disconnect();                                      // przestań obserwować rozmiar
      controls.dispose();                                   // zwolnij OrbitControls
      disposeAtMount?.();                                   // użytkownikowy cleanup (jeśli był)

      // Przejdź po scenie i zwolnij geometrie/materiały meshów (ważne dla pamięci/GPU)
      scene.traverse((obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          const mat = mesh.material;
          if (Array.isArray(mat)) mat.forEach((m: THREE.Material) => m.dispose());
          else (mat as THREE.Material | undefined)?.dispose?.();
        }
      });

      renderer.dispose();                                  // zwolnij renderer + kontekst
      if (domAtMount.parentElement)                        // usuń <canvas> z DOM
        domAtMount.parentElement.removeChild(domAtMount);
    };
  }, []); // efekt uruchamiany jednokrotnie przy montażu

  return mountRef; // zwróć ref do podpięcia na <div>, w który wstrzykniemy canvas
}
