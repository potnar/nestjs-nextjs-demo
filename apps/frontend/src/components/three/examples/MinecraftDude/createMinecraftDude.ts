import * as THREE from "three";

export function createMinecraftDude() {
  const group = new THREE.Group();

  // Materiały
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd }); // skóra
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 }); // koszulka
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 }); // spodnie

  // Geometrie
  const headGeo = new THREE.BoxGeometry(1, 1, 1);
  const bodyGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
  const armGeo  = new THREE.BoxGeometry(0.3, 1.2, 0.3);
  const legGeo  = new THREE.BoxGeometry(0.35, 1, 0.35);

  // GŁOWA
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 1.75, 0);

  // TUŁÓW
  const body = new THREE.Mesh(bodyGeo, shirtMat);
  body.position.set(0, 1, 0);

  // RĘCE
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.name = "leftArm";
  leftArm.position.set(-0.65, 1.2, 0);

  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.name = "rightArm";
  rightArm.position.set(0.65, 1.2, 0);

  // NOGI
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.name = "leftLeg";
  leftLeg.position.set(-0.25, 0.25, 0);

  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.name = "rightLeg";
  rightLeg.position.set(0.25, 0.25, 0);

  group.add(head, body, leftArm, rightArm, leftLeg, rightLeg);

  // żeby stał na ziemi
  group.position.y = 0.5;

  // 🔥 animacja tylko w ruchu
  group.userData.update = (t: number, isMoving: boolean) => {
    // neutralna pozycja
    if (!isMoving) {
      leftArm.rotation.x = 0;
      rightArm.rotation.x = 0;
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      return;
    }

    const speed = 7;      // szybkość machania
    const amplitude = 0.6;

    const swing = Math.sin(t * speed) * amplitude;

    leftArm.rotation.x  =  swing;
    rightArm.rotation.x = -swing;
    leftLeg.rotation.x  = -swing;
    rightLeg.rotation.x =  swing;
  };

  return group;
}
