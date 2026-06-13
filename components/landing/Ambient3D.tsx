"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import type { Group } from "three";

function BgReceipt({
  position,
  scale,
  speed,
  tilt,
  animated,
}: {
  position: [number, number, number];
  scale: number;
  speed: number;
  tilt: [number, number, number];
  animated: boolean;
}) {
  const lines = [1.5, 1.2, 0.9, 0.6, 0.3, 0.0, -0.3];
  return (
    <Float
      speed={animated ? speed : 0}
      rotationIntensity={animated ? 0.8 : 0}
      floatIntensity={animated ? 1.4 : 0}
    >
      <group position={position} scale={scale} rotation={tilt}>
        {/* paper */}
        <mesh>
          <boxGeometry args={[2.2, 4, 0.04]} />
          <meshStandardMaterial color="#FBF9F4" roughness={0.9} transparent opacity={0.95} />
        </mesh>
        {/* header bar */}
        <mesh position={[0, 1.85, 0.06]}>
          <boxGeometry args={[1.4, 0.16, 0.01]} />
          <meshStandardMaterial color="#2F6079" />
        </mesh>
        {lines.map((y, i) => (
          <mesh key={i} position={[-0.35 + ((i * 0.07) % 0.2), y, 0.06]}>
            <boxGeometry args={[1.1 - (i % 3) * 0.25, 0.06, 0.01]} />
            <meshStandardMaterial color="#C7C0B0" />
          </mesh>
        ))}
        {/* total bar */}
        <mesh position={[0, -0.75, 0.06]}>
          <boxGeometry args={[1.6, 0.12, 0.01]} />
          <meshStandardMaterial color="#16181D" />
        </mesh>
      </group>
    </Float>
  );
}

function Scene({ animated }: { animated: boolean }) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (animated && group.current) {
      group.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.06;
    }
  });

  // Receipts drift toward the edges and are pushed back so they never sit
  // behind body copy in the centre.
  return (
    <group ref={group}>
      <BgReceipt position={[-4.6, -0.4, -3]} scale={0.5} speed={1.0} tilt={[0.1, -0.4, 0.12]} animated={animated} />
      <BgReceipt position={[4.6, 1.2, -4]} scale={0.4} speed={0.8} tilt={[0.1, 0.4, -0.14]} animated={animated} />
      <BgReceipt position={[-4.9, 2.4, -5]} scale={0.32} speed={1.2} tilt={[-0.1, -0.3, -0.18]} animated={animated} />
      <BgReceipt position={[3.9, -2.4, -3.5]} scale={0.42} speed={0.9} tilt={[0.12, 0.5, 0.1]} animated={animated} />
      <BgReceipt position={[0.6, 3.0, -6]} scale={0.3} speed={1.1} tilt={[0.05, -0.2, 0.2]} animated={animated} />
    </group>
  );
}

export default function Ambient3D() {
  const animated =
    typeof window === "undefined" ||
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      frameloop={animated ? "always" : "demand"}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} />
      <directionalLight position={[-5, -3, 2]} intensity={0.4} color="#5B8AA6" />
      <Scene animated={animated} />
    </Canvas>
  );
}
