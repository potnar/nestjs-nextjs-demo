"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createMinecraftDude } from "./createMinecraftDudeVanilla";

const MinecraftDudeExample: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // SCENA
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    sceneRef.current = scene;

    // KAMERA
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ŚWIATŁA
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(dirLight, ambient);

    // PODŁOGA
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x22c55e })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // GRACZ
    const player = createMinecraftDude();
    player.position.set(0, 0, 0);
    scene.add(player);

    // ===== STAN KAMERY – widok trzecioosobowy =====
    let yaw = 0;        // kierunek, w który patrzy gracz
    let pitch = 0.25;   // wysokość kamery
    let distance = 4.5; // dystans kamery

    // pointer lock / aktywne sterowanie
    let isPointerLocked = false;
    let controlsActive = false;

    const updateCamera = () => {
      if (!cameraRef.current) return;
      const cam = cameraRef.current;

      const target = player.position.clone();
      target.y += 1.6; // głowa

      const offset = new THREE.Vector3(
        -Math.sin(yaw) * Math.cos(pitch) * distance,
         Math.sin(pitch) * distance,
        -Math.cos(yaw) * Math.cos(pitch) * distance
      );

      cam.position.copy(target).add(offset);
      cam.lookAt(target);
    };

    updateCamera();

    const canvas = renderer.domElement;

    // === POINTER LOCK: kliknięcie w canvas → przejęcie kursora ===
    const onCanvasClick = () => {
      canvas.requestPointerLock();
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      isPointerLocked = locked;
      controlsActive = locked;
      // po wyjściu z pointer lock (ESC / klik poza) sterowanie się wyłącza
    };

    // obrót kamery myszką (tylko gdy pointer lock aktywny → kursor niewidoczny)
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked) return;

      const dx = e.movementX; // względny ruch
      const dy = e.movementY;

      const ROT_SPEED = 0.003;

      yaw -= dx * ROT_SPEED;
      pitch -= dy * ROT_SPEED;

      const maxPitch = Math.PI / 3;
      const minPitch = -Math.PI / 6;
      pitch = Math.max(minPitch, Math.min(maxPitch, pitch));

      updateCamera();
    };

    const onWheel = (e: WheelEvent) => {
      const ZOOM_SPEED = 0.0015;
      distance += e.deltaY * ZOOM_SPEED;
      distance = Math.max(2.5, Math.min(10, distance));
      updateCamera();
    };

    canvas.addEventListener("click", onCanvasClick);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel);

    // ===== KLAWIATURA – WASD =====
    const pressed = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (!controlsActive) return; // nie włączaj sterowania przed kliknięciem
      pressed.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      pressed.delete(e.code);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ===== PĘTLA GŁÓWNA =====
    const clock = new THREE.Clock();
    let elapsed = 0;

    const animate = () => {
      const dt = clock.getDelta();
      elapsed += dt;

      let isMoving = false;

      if (controlsActive) {
        const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

        const moveDir = new THREE.Vector3();
        const speed = 4;

        if (pressed.has("KeyW")) moveDir.add(forward);
        if (pressed.has("KeyS")) moveDir.sub(forward);

        // A/D – lewo/prawo w stylu gier
        if (pressed.has("KeyA")) moveDir.add(right);   // lewo
        if (pressed.has("KeyD")) moveDir.sub(right);   // prawo

        isMoving = moveDir.lengthSq() > 0;

        if (isMoving) {
          moveDir.normalize();
          player.position.add(moveDir.multiplyScalar(speed * dt));
        }
      }

      // gracz patrzy tam, gdzie kamera (yaw)
      player.rotation.y = yaw;

      updateCamera();

      const updater =
        player.userData.update as ((t: number, isMoving: boolean) => void) | undefined;
      if (updater) {
        updater(elapsed, isMoving);
      }

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

      const { clientWidth, clientHeight } = containerRef.current;
      rendererRef.current.setSize(clientWidth, clientHeight);
      cameraRef.current.aspect = clientWidth / clientHeight;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onCanvasClick);
      canvas.removeEventListener("wheel", onWheel);

      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        const dom = rendererRef.current.domElement;
        dom.parentNode?.removeChild(dom);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] rounded-xl border border-neutral-800 overflow-hidden">
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />
      {/* Overlay z kontrolkami */}
      <div className="pointer-events-none absolute top-2 left-2 bg-black/70 text-xs text-slate-100 px-3 py-2 rounded-md space-y-1">
        <div className="font-semibold text-sm">Controls (3rd person)</div>
        <div>Click on canvas to capture mouse</div>
        <div>W / A / S / D – move</div>
        <div>Move mouse – rotate camera & player</div>
        <div>Scroll – zoom</div>
        <div className="text-[10px] text-slate-400">Press ESC to release cursor</div>
      </div>
    </div>
  );
};

export default MinecraftDudeExample;
