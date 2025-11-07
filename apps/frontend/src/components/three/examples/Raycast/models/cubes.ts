import * as THREE from "three";

export type CubeMesh = THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;

export function buildCubes(group: THREE.Group) {
  const pickables: CubeMesh[] = [];
  let idx = 0;

  for (let x = -2; x <= 2; x += 2) {
    for (let z = -2; z <= 2; z += 2) {
      idx++;
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5),
        roughness: 0.9,
        metalness: 0,
      });
      const mesh = new THREE.Mesh(geo, mat) as CubeMesh;
      mesh.position.set(x, 0.5, z);
      mesh.name = `cube_${idx}`;
      mesh.userData.idx = idx;

      group.add(mesh);
      pickables.push(mesh);
    }
  }

  return { pickables };
}
