"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Icosahedron } from "@react-three/drei";
import type { Group } from "three";

interface OrbProps {
  position: [number, number, number];
  color: string;
  scale: number;
  speed: number;
  distort: number;
  opacity: number;
  animated: boolean;
}

function Orb({ position, color, scale, speed, distort, opacity, animated }: OrbProps) {
  return (
    <Float
      speed={animated ? speed : 0}
      rotationIntensity={animated ? 0.5 : 0}
      floatIntensity={animated ? 1.1 : 0}
    >
      <Icosahedron args={[1, 6]} position={position} scale={scale}>
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={animated ? 1.1 : 0}
          roughness={0.35}
          metalness={0.15}
          transparent
          opacity={opacity}
        />
      </Icosahedron>
    </Float>
  );
}

function BgReceipt({
  position,
  scale,
  speed,
  animated,
}: {
  position: [number, number, number];
  scale: number;
  speed: number;
  animated: boolean;
}) {
  const lines = [1.5, 1.2, 0.9, 0.6, 0.3, 0.0, -0.3];
  return (
    <Float
      speed={animated ? speed : 0}
      rotationIntensity={animated ? 0.8 : 0}
      floatIntensity={animated ? 1.4 : 0}
    >
      <group position={position} scale={scale} rotation={[0.1, -0.4, 0.12]}>
        {/* paper */}
        <mesh>
          <boxGeometry args={[2.2, 4, 0.04]} />
          <meshStandardMaterial color="#FBF9F4" roughness={0.9} transparent opacity={0.92} />
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
      group.current.rotation.y = state.clock.getElapsedTime() * 0.035;
    }
  });

  // Positioned toward the edges and pushed back (negative z) so they add
  // depth without sitting behind body copy.
  return (
    <group ref={group}>
      <Orb position={[-3.6, 1.6, -2]} color="#5B8AA6" scale={1.7} speed={1.1} distort={0.32} opacity={0.55} animated={animated} />
      <Orb position={[3.8, -1.4, -3]} color="#D98A37" scale={1.2} speed={0.85} distort={0.3} opacity={0.42} animated={animated} />
      <Orb position={[2.6, 2.4, -4]} color="#2F6079" scale={0.9} speed={1.3} distort={0.4} opacity={0.5} animated={animated} />
      <Orb position={[-2.8, -2.2, -3.5]} color="#5B8AA6" scale={0.75} speed={1.0} distort={0.45} opacity={0.45} animated={animated} />
      {/* Floating bills drifting in the background */}
      <BgReceipt position={[-4.2, -0.6, -3]} scale={0.5} speed={1.0} animated={animated} />
      <BgReceipt position={[4.4, 1.0, -4]} scale={0.38} speed={0.8} animated={animated} />
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
      <directionalLight position={[-5, -3, 2]} intensity={0.45} color="#D98A37" />
      <Scene animated={animated} />
    </Canvas>
  );
}
