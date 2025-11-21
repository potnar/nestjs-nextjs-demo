"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MinecraftDudeFiber, MinecraftDudeHandle } from "./MinecraftDudeFiber";

// --- PLAYER / CONTROLLER ----------------------------------------------------

function PlayerController() {
  const { camera, gl } = useThree();

  const playerRef = useRef<MinecraftDudeHandle | null>(null);

  // „stan” sterowania, trzymany w refach
  const yawRef = useRef(0);        // kierunek, w który patrzy gracz
  const pitchRef = useRef(0.25);   // wysokość kamery
  const distanceRef = useRef(4.5); // dystans kamery

  const pressedRef = useRef<Set<string>>(new Set());
  const isPointerLockedRef = useRef(false);
  const controlsActiveRef = useRef(false);

  // stan do animacji rąk/nóg
  const [isMoving, setIsMoving] = useState(false);
  const isMovingStateRef = useRef(false);

  // Pointer lock + klawiatura – czysty JS, ale korzystamy z gl.domElement & camera
  useEffect(() => {
    const canvas = gl.domElement;

    const onCanvasClick = () => {
      canvas.requestPointerLock();
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      isPointerLockedRef.current = locked;
      controlsActiveRef.current = locked;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLockedRef.current) return;

      const dx = e.movementX;
      const dy = e.movementY;
      const ROT_SPEED = 0.003;

      yawRef.current -= dx * ROT_SPEED;
      pitchRef.current -= dy * ROT_SPEED;

      const maxPitch = Math.PI / 3;
      const minPitch = -Math.PI / 6;
      pitchRef.current = Math.max(minPitch, Math.min(maxPitch, pitchRef.current));
    };

    const onWheel = (e: WheelEvent) => {
      const ZOOM_SPEED = 0.0015;
      distanceRef.current += e.deltaY * ZOOM_SPEED;
      distanceRef.current = Math.max(2.5, Math.min(10, distanceRef.current));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!controlsActiveRef.current) return;
      pressedRef.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      pressedRef.current.delete(e.code);
    };

    canvas.addEventListener("click", onCanvasClick);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("wheel", onWheel);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      canvas.removeEventListener("click", onCanvasClick);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gl]);

  // Główna pętla – odpowiednik Twojego animate()
  useFrame((state, dt) => {
    const player = playerRef.current;
    if (!player) return;

    const yaw = yawRef.current;
    const pitch = pitchRef.current;
    const distance = distanceRef.current;

    // Ruch gracza (WASD)
    let moving = false;

    if (controlsActiveRef.current) {
      const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
      const moveDir = new THREE.Vector3();
      const speed = 4;

      const pressed = pressedRef.current;
      if (pressed.has("KeyW")) moveDir.add(forward);
      if (pressed.has("KeyS")) moveDir.sub(forward);
      if (pressed.has("KeyA")) moveDir.add(right);
      if (pressed.has("KeyD")) moveDir.sub(right);

      if (moveDir.lengthSq() > 0) {
        moving = true;
        moveDir.normalize();
        player.position.add(moveDir.multiplyScalar(speed * dt));
      }
    }

    // gracz patrzy tam, gdzie kamera (yaw)
    player.rotation.y = yaw;

    // Kamera third-person
    const target = player.position.clone();
    target.y += 1.6; // głowa

    const offset = new THREE.Vector3(
      -Math.sin(yaw) * Math.cos(pitch) * distance,
      Math.sin(pitch) * distance,
      -Math.cos(yaw) * Math.cos(pitch) * distance
    );

    camera.position.copy(target).add(offset);
    camera.lookAt(target);

    // aktualizacja isMoving tylko gdy się zmienia, żeby nie robić setState co frame
    if (moving !== isMovingStateRef.current) {
      isMovingStateRef.current = moving;
      setIsMoving(moving);
    }
  });

  return <MinecraftDudeFiber ref={playerRef} isMoving={isMoving} />;
}

// --- GŁÓWNY KOMPONENT -------------------------------------------------------

const MinecraftDudeExample: React.FC = () => {
  return (
    <div className="relative w-full h-[400px] rounded-xl border border-neutral-800 overflow-hidden">
      <Canvas camera={{ fov: 60, position: [0, 3, 6] }} shadows>
        <color attach="background" args={["#020617"]} />

        {/* Światła */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        {/* Ziemia */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>

        {/* Gracz + sterowanie */}
        <PlayerController />
      </Canvas>

      {/* Overlay z kontrolkami */}
      <div className="pointer-events-none absolute top-2 left-2 bg-black/70 text-xs text-slate-100 px-3 py-2 rounded-md space-y-1">
        <div className="font-semibold text-sm">Controls (3rd person – fiber)</div>
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
