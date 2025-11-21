"use client";

import { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type MinecraftDudeHandle = THREE.Group;

type MinecraftDudeProps = {
  isMoving: boolean;
  position?: [number, number, number];
  swingSpeed?: number;
  swingAmplitude?: number;
};

export const MinecraftDudeFiber = forwardRef<MinecraftDudeHandle, MinecraftDudeProps>(
  (
    {
      isMoving,
      position = [0, 0.5, 0], // jak w createMinecraftDude – stoi na ziemi
      swingSpeed = 7,
      swingAmplitude = 0.6,
    },
    ref
  ) => {
    // referencje do części ciała – będziemy nimi kręcić jak w userData.update
    const leftArmRef = useRef<THREE.Mesh>(null);
    const rightArmRef = useRef<THREE.Mesh>(null);
    const leftLegRef = useRef<THREE.Mesh>(null);
    const rightLegRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
      const t = state.clock.getElapsedTime();

      const leftArm = leftArmRef.current;
      const rightArm = rightArmRef.current;
      const leftLeg = leftLegRef.current;
      const rightLeg = rightLegRef.current;

      if (!leftArm || !rightArm || !leftLeg || !rightLeg) return;

      if (!isMoving) {
        // neutralna pozycja – dokładnie jak w Twoim createMinecraftDude
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        return;
      }

      const swing = Math.sin(t * swingSpeed) * swingAmplitude;

      leftArm.rotation.x = swing;
      rightArm.rotation.x = -swing;
      leftLeg.rotation.x = -swing;
      rightLeg.rotation.x = swing;
    });

    return (
      <group ref={ref} position={position}>
        {/* GŁOWA – 1x1x1 na (0, 1.75, 0) */}
        <mesh position={[0, 1.75, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={0xffe0bd} />
        </mesh>

        {/* TUŁÓW – 1 x 1.5 x 0.5 na (0, 1, 0) */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1, 1.5, 0.5]} />
          <meshStandardMaterial color={0x3b82f6} />
        </mesh>

        {/* RĘKA LEWA – 0.3 x 1.2 x 0.3 na (-0.65, 1.2, 0) */}
        <mesh ref={leftArmRef} position={[-0.65, 1.2, 0]} name="leftArm">
          <boxGeometry args={[0.3, 1.2, 0.3]} />
          <meshStandardMaterial color={0xffe0bd} />
        </mesh>

        {/* RĘKA PRAWA – 0.3 x 1.2 x 0.3 na (0.65, 1.2, 0) */}
        <mesh ref={rightArmRef} position={[0.65, 1.2, 0]} name="rightArm">
          <boxGeometry args={[0.3, 1.2, 0.3]} />
          <meshStandardMaterial color={0xffe0bd} />
        </mesh>

        {/* NOGA LEWA – 0.35 x 1 x 0.35 na (-0.25, 0.25, 0) */}
        <mesh ref={leftLegRef} position={[-0.25, 0.25, 0]} name="leftLeg">
          <boxGeometry args={[0.35, 1, 0.35]} />
          <meshStandardMaterial color={0x1f2937} />
        </mesh>

        {/* NOGA PRAWA – 0.35 x 1 x 0.35 na (0.25, 0.25, 0) */}
        <mesh ref={rightLegRef} position={[0.25, 0.25, 0]} name="rightLeg">
          <boxGeometry args={[0.35, 1, 0.35]} />
          <meshStandardMaterial color={0x1f2937} />
        </mesh>
      </group>
    );
  }
);

MinecraftDudeFiber.displayName = "MinecraftDudeFiber";
