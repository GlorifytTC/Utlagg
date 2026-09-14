"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import type { Mesh, Group } from "three";

// Background receipts — reduced opacity (0.35) replaces the old CSS blur wrapper
// to keep them visually soft without triggering a per-frame GPU composite pass.

const BG_RECEIPTS: {
  position: [number, number, number];
  scale: number;
  speed: number;
  tilt: [number, number, number];
}[] = [
  { position: [-4.6, -0.4, -3], scale: 0.5, speed: 1.0, tilt: [0.1, -0.4, 0.12] },
  { position: [4.6, 1.2, -4], scale: 0.4, speed: 0.8, tilt: [0.1, 0.4, -0.14] },
  { position: [-4.9, 2.4, -5], scale: 0.32, speed: 1.2, tilt: [-0.1, -0.3, -0.18] },
  { position: [3.9, -2.4, -3.5], scale: 0.42, speed: 0.9, tilt: [0.12, 0.5, 0.1] },
  { position: [0.6, 3.0, -6], scale: 0.3, speed: 1.1, tilt: [0.05, -0.2, 0.2] },
];

const BG_LINES = [1.5, 1.2, 0.9, 0.6, 0.3, 0.0, -0.3];

function BgReceipt({
  position,
  scale,
  speed,
  tilt,
  animated,
}: (typeof BG_RECEIPTS)[0] & { animated: boolean }) {
  return (
    <Float
      speed={animated ? speed : 0}
      rotationIntensity={animated ? 0.8 : 0}
      floatIntensity={animated ? 1.4 : 0}
    >
      <group position={position} scale={scale} rotation={tilt}>
        <mesh>
          <boxGeometry args={[2.2, 4, 0.04]} />
          <meshStandardMaterial color="#FBF9F4" roughness={0.9} transparent opacity={0.35} />
        </mesh>
        <mesh position={[0, 1.85, 0.06]}>
          <boxGeometry args={[1.4, 0.16, 0.01]} />
          <meshStandardMaterial color="#C4522F" transparent opacity={0.35} />
        </mesh>
        {BG_LINES.map((y, i) => (
          <mesh key={i} position={[-0.35 + ((i * 0.07) % 0.2), y, 0.06]}>
            <boxGeometry args={[1.1 - (i % 3) * 0.25, 0.06, 0.01]} />
            <meshStandardMaterial color="#C7C0B0" transparent opacity={0.35} />
          </mesh>
        ))}
        <mesh position={[0, -0.75, 0.06]}>
          <boxGeometry args={[1.6, 0.12, 0.01]} />
          <meshStandardMaterial color="#16181D" transparent opacity={0.35} />
        </mesh>
      </group>
    </Float>
  );
}

function AmbientGroup({ animated }: { animated: boolean }) {
  const group = useRef<Group>(null);
  useFrame((state) => {
    if (animated && group.current) {
      group.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.06;
    }
  });
  return (
    <group ref={group}>
      {BG_RECEIPTS.map((r, i) => (
        <BgReceipt key={i} {...r} animated={animated} />
      ))}
    </group>
  );
}

const HERO_LINES = [1.6, 1.35, 1.1, 0.85, 0.6, 0.35, 0.1, -0.15, -0.4].map((y, i) => ({
  y,
  width: 0.5 + (((i * 37) % 13) / 13) * 1.3,
}));

// Hero receipt — visible only on wide viewports where the 2-column layout exists.
// Position is updated each frame from state.viewport so resize is reactive.
function HeroGroup({ animated }: { animated: boolean }) {
  const group = useRef<Group>(null);
  const beam = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const wide = state.viewport.width > 6;

    if (group.current) {
      group.current.visible = wide;
      // Place receipt in the right-column region (~27% from center rightward).
      group.current.position.x = wide ? state.viewport.width * 0.27 : 0;
      if (animated) {
        group.current.rotation.y = Math.sin(t * 0.4) * 0.5;
        group.current.rotation.x = Math.cos(t * 0.3) * 0.12;
        group.current.position.y = Math.sin(t * 0.8) * 0.08;
      }
    }
    if (beam.current && animated) {
      beam.current.position.y = ((Math.sin(t * 1.1) + 1) / 2) * 4 - 2;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[2.2, 4, 0.04]} />
        <meshStandardMaterial color="#FBF9F4" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.85, 0.06]}>
        <boxGeometry args={[1.4, 0.16, 0.01]} />
        <meshStandardMaterial color="#C4522F" />
      </mesh>
      {HERO_LINES.map((l, i) => (
        <mesh key={i} position={[-(1.1 - l.width / 2) + 0.1, l.y, 0.06]}>
          <boxGeometry args={[l.width, 0.06, 0.01]} />
          <meshStandardMaterial color="#C7C0B0" />
        </mesh>
      ))}
      <mesh position={[0, -0.75, 0.06]}>
        <boxGeometry args={[1.6, 0.12, 0.01]} />
        <meshStandardMaterial color="#16181D" />
      </mesh>
      <mesh ref={beam} position={[0, 0, 0.4]}>
        <planeGeometry args={[3.2, 0.18]} />
        <meshBasicMaterial color="#E2734A" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export default function Landing3D() {
  const reducedMotion = useReducedMotion();
  const animated = !reducedMotion;

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={0.75}
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      frameloop={animated ? "always" : "demand"}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 5, 4]} intensity={1.1} />
      <directionalLight position={[-4, -2, 2]} intensity={0.3} color="#E2734A" />
      <AmbientGroup animated={animated} />
      <HeroGroup animated={animated} />
    </Canvas>
  );
}
