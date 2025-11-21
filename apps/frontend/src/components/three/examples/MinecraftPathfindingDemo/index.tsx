"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import {
  Canvas,
  ThreeEvent,
  useFrame,
} from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { createMinecraftDude } from "../MinecraftDude/createMinecraftDudeVanilla";

type Cell = { x: number; y: number };

const GRID_SIZE = 10;

// 0 = puste, 1 = przeszkoda
function generateGrid(): number[][] {
  const grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0)
  );

  const obstacleCount = Math.floor(GRID_SIZE * GRID_SIZE * 0.2);

  for (let i = 0; i < obstacleCount; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);

    // nie blokujemy startu i domyślnego celu
    if (
      (x === 0 && y === 0) ||
      (x === GRID_SIZE - 1 && y === GRID_SIZE - 1)
    ) {
      continue;
    }
    grid[y][x] = 1;
  }

  return grid;
}

// pozycja w świecie dla danej komórki siatki
function cellToWorld(cell: Cell): THREE.Vector3 {
  const x = cell.x - GRID_SIZE / 2 + 0.5;
  const z = cell.y - GRID_SIZE / 2 + 0.5;
  const y = 0.5; // tak, żeby ludzik stał na ziemi (spójne z createMinecraftDude)
  return new THREE.Vector3(x, y, z);
}

// A* na siatce 2D (bez przekątnych)
function findPath(start: Cell, end: Cell, grid: number[][]): Cell[] {
  const size = grid.length;

  type Node = {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent?: Node;
  };

  const key = (x: number, y: number) => `${x},${y}`;
  const open: Node[] = [];
  const closed = new Set<string>();

  const h = (x: number, y: number) =>
    Math.abs(x - end.x) + Math.abs(y - end.y); // Manhattan

  open.push({
    x: start.x,
    y: start.y,
    g: 0,
    h: h(start.x, start.y),
    f: h(start.x, start.y),
  });

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    if (current.x === end.x && current.y === end.y) {
      // rekonstrukcja ścieżki
      const path: Cell[] = [];
      let node: Node | undefined = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }

    closed.add(key(current.x, current.y));

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const n of neighbors) {
      if (n.x < 0 || n.x >= size || n.y < 0 || n.y >= size) continue;
      if (grid[n.y][n.x] === 1) continue; // przeszkoda

      const k = key(n.x, n.y);
      if (closed.has(k)) continue;

      const g = current.g + 1;
      const hVal = h(n.x, n.y);
      const f = g + hVal;

      const existing = open.find(
        (node) => node.x === n.x && node.y === n.y
      );
      if (existing) {
        if (g < existing.g) {
          existing.g = g;
          existing.h = hVal;
          existing.f = f;
          existing.parent = current;
        }
      } else {
        open.push({
          x: n.x,
          y: n.y,
          g,
          h: hVal,
          f,
          parent: current,
        });
      }
    }
  }

  // brak ścieżki
  return [];
}

// Jeden kafelek siatki
type TileProps = {
  x: number;
  y: number;
  isObstacle: boolean;
  isStart: boolean;
  isTarget: boolean;
  isOnPath: boolean;
  onClick: () => void;
};

function Tile({
  x,
  y,
  isObstacle,
  isStart,
  isTarget,
  isOnPath,
  onClick,
}: TileProps) {
  const worldX = x - GRID_SIZE / 2 + 0.5;
  const worldZ = y - GRID_SIZE / 2 + 0.5;

  let color = isObstacle ? "#111827" : "#4b5563"; // tło / przeszkody
  if (isOnPath) color = "#22c55e"; // ścieżka
  if (isTarget) color = "#ef4444"; // cel
  if (isStart) color = "#3b82f6"; // start

  return (
    <mesh
      position={[worldX, 0, worldZ]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick();
      }}
      receiveShadow
    >
      <boxGeometry args={[0.98, 0.1, 0.98]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Kontroler ludzika – ruch po ścieżce + animacja z userData.update
type CharacterControllerProps = {
  startCell: Cell;
  path: Cell[];
  onArrived: (cell: Cell) => void;
};

function CharacterController({
  startCell,
  path,
  onArrived,
}: CharacterControllerProps) {
  // Twój ludzik – tworzymy tylko raz
  const dude = useMemo(() => createMinecraftDude(), []);

  const currentCellRef = useRef<Cell>(startCell);
  const currentPosRef = useRef<THREE.Vector3>(cellToWorld(startCell));
  const pathRef = useRef<Cell[]>([]);
  const pathIndexRef = useRef<number>(0);

  // ustaw pozycję startową przy zmianie startCell
  useEffect(() => {
    currentCellRef.current = startCell;
    const worldPos = cellToWorld(startCell);
    currentPosRef.current.copy(worldPos);
    dude.position.copy(worldPos);
  }, [startCell, dude]);

  // aktualizuj ścieżkę przy zmianie path
  useEffect(() => {
    pathRef.current = path;
    pathIndexRef.current = path.length > 1 ? 1 : 0;
  }, [path]);

  useFrame((state, delta) => {
    const localPath = pathRef.current;
    const clockTime = state.clock.getElapsedTime();

    // brak ścieżki → tylko idle
    if (!localPath || localPath.length < 2 || pathIndexRef.current === 0) {
      const updater = dude.userData.update as
        | ((t: number, isMoving: boolean) => void)
        | undefined;
      if (updater) updater(clockTime, false);
      return;
    }

    if (pathIndexRef.current >= localPath.length) {
      const updater = dude.userData.update as
        | ((t: number, isMoving: boolean) => void)
        | undefined;
      if (updater) updater(clockTime, false);
      return;
    }

    const currentPos = currentPosRef.current;
    const targetCell = localPath[pathIndexRef.current];
    const targetPos = cellToWorld(targetCell);

    const dir = new THREE.Vector3().subVectors(targetPos, currentPos);
    const dist = dir.length();

    const speed = 2; // jednostki / sekundę
    const step = speed * delta;
    let isMoving = false;

    if (dist > 0.01) {
      dir.normalize();
      isMoving = true;

      // obrót ludzika w kierunku ruchu (yaw)
      const angle = Math.atan2(dir.x, dir.z);
      dude.rotation.y = angle;

      if (step >= dist) {
        currentPos.copy(targetPos);
        dude.position.copy(currentPos);
        currentCellRef.current = targetCell;
        pathIndexRef.current += 1;

        if (pathIndexRef.current >= localPath.length) {
          onArrived(targetCell);
        }
      } else {
        currentPos.addScaledVector(dir, step);
        dude.position.copy(currentPos);
      }
    } else {
      // jesteśmy prawie na kafelku
      currentPos.copy(targetPos);
      dude.position.copy(currentPos);
      currentCellRef.current = targetCell;
      pathIndexRef.current += 1;
      if (pathIndexRef.current >= localPath.length) {
        onArrived(targetCell);
      }
    }

    const updater = dude.userData.update as
      | ((t: number, isMoving: boolean) => void)
      | undefined;
    if (updater) {
      updater(clockTime, isMoving);
    }
  });

  // primitive – wpinamy istniejący THREE.Group
  return <primitive object={dude} />;
}

// Główny komponent demo
const MinecraftPathfindingDemo: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>(() => generateGrid());
  const [startCell, setStartCell] = useState<Cell>({ x: 0, y: 0 });
  const [targetCell, setTargetCell] = useState<Cell>({
    x: GRID_SIZE - 1,
    y: GRID_SIZE - 1,
  });
  const [path, setPath] = useState<Cell[]>([]);

  const handleTileClick = useCallback(
    (cell: Cell) => {
      // ignorujemy kliknięcia w przeszkody
      if (grid[cell.y][cell.x] === 1) return;

      // jeśli już idziemy po ścieżce – nie zmieniamy celu w trakcie
      if (path.length > 0) return;

      if (cell.x === startCell.x && cell.y === startCell.y) return;

      const newPath = findPath(startCell, cell, grid);
      setTargetCell(cell);
      setPath(newPath);
    },
    [grid, path.length, startCell]
  );

  const handleArrived = useCallback((cell: Cell) => {
    // po dotarciu ustawiamy nowy start
    setStartCell(cell);
    setPath([]);
  }, []);

  const handleRandomize = () => {
    const newGrid = generateGrid();
    setGrid(newGrid);
    const newStart = { x: 0, y: 0 };
    const newTarget = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
    setStartCell(newStart);
    setTargetCell(newTarget);
    setPath([]);
  };

  const hasPath = path.length > 0;
  const unreachable =
    path.length === 0 &&
    !(startCell.x === targetCell.x && startCell.y === targetCell.y);

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full h-[520px]">
      <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950/60 overflow-hidden">
        <Canvas
          shadows
          camera={{ position: [8, 8, 8], fov: 45 }}
        >
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={1.2}
            castShadow
          />

          {/* płaska ziemia pod siatką żeby było ładnie */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.01, 0]}
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#0b1120" />
          </mesh>

          {/* siatka kafelków */}
          <group>
            {grid.map((row, y) =>
              row.map((cellValue, x) => {
                const isObstacle = cellValue === 1;
                const isStart =
                  startCell.x === x && startCell.y === y;
                const isTarget =
                  targetCell.x === x && targetCell.y === y;
                const isOnPath = path.some(
                  (cell) => cell.x === x && cell.y === y
                );

                return (
                  <Tile
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    isObstacle={isObstacle}
                    isStart={isStart}
                    isTarget={isTarget}
                    isOnPath={isOnPath}
                    onClick={() => handleTileClick({ x, y })}
                  />
                );
              })
            )}
          </group>

          {/* ludzik poruszający się po ścieżce */}
          <CharacterController
            startCell={startCell}
            path={path}
            onArrived={handleArrived}
          />

          <OrbitControls enablePan enableZoom />
        </Canvas>
      </div>

      {/* Panel boczny / opis */}
      <div className="w-full md:w-80 rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 text-sm space-y-4">
        <h2 className="text-base font-semibold">
          Minecraft pathfinding lab (A*)
        </h2>
        <p className="text-xs text-neutral-400">
          Kliknij na szary kafelek, żeby ustawić cel. Ludzik spróbuje
          znaleźć najkrótszą ścieżkę omijając przeszkody (algorytm A*
          na siatce 2D, wizualizowany w 3D).
        </p>

        <button
          type="button"
          onClick={handleRandomize}
          className="w-full rounded-lg border border-neutral-700 px-3 py-2 text-xs font-medium hover:bg-neutral-900"
        >
          Losuj przeszkody
        </button>

        <div className="text-xs text-neutral-300 space-y-1">
          <p>
            Rozmiar siatki:{" "}
            <span className="font-mono">
              {GRID_SIZE}×{GRID_SIZE}
            </span>
          </p>
          <p>
            Długość ścieżki:{" "}
            <span className="font-mono">
              {hasPath ? path.length : "—"}
            </span>
          </p>
          {unreachable && (
            <p className="text-[11px] text-red-400">
              Brak ścieżki do celu przy obecnym układzie przeszkód.
            </p>
          )}
        </div>

        <div className="text-[11px] text-neutral-500 space-y-1 pt-2">
          <p>Legenda:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>niebieski – pozycja startowa ludzika</li>
            <li>czerwony – obecny cel</li>
            <li>zielony – ścieżka A*</li>
            <li>ciemny – przeszkody</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MinecraftPathfindingDemo;
