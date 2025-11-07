import * as THREE from "three";
import { PaintWall } from "../types";
import { makePaintCanvas } from "../painting";

export function buildHouse(group: THREE.Group) {
  const walls: PaintWall[] = [];
  const pickables: THREE.Mesh[] = [];

  const W = 8, D = 6, H = 4.5;

  const mkWall = (
    name: string,
    w: number,
    h: number,
    rotY: number,
    pos: THREE.Vector3,
    idx: number
  ) => {
    const geo = new THREE.PlaneGeometry(w, h, 1, 1);
    const { canvas, ctx } = makePaintCanvas();
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;

    const mat = new THREE.MeshStandardMaterial({
      map: tex, side: THREE.DoubleSide, roughness: 0.85, metalness: 0,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.y = rotY;
    mesh.position.copy(pos);
    mesh.name = name;
    mesh.userData.idx = idx;

    group.add(mesh);
    pickables.push(mesh);
    walls.push({ mesh, canvas, ctx, tex, name, idx });
  };

  mkWall("front", W, H, 0, new THREE.Vector3(0, H / 2, D / 2), 1);
  mkWall("back", W, H, Math.PI, new THREE.Vector3(0, H / 2, -D / 2), 2);
  mkWall("left", D, H, -Math.PI / 2, new THREE.Vector3(-W / 2, H / 2, 0), 3);
  mkWall("right", D, H, Math.PI / 2, new THREE.Vector3(W / 2, H / 2, 0), 4);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x22252f, side: THREE.DoubleSide, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  return { walls, pickables };
}
