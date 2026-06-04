"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Mesh, Group } from "three";

/** A single line of "text" on the receipt, drawn as a thin bar. */
function ReceiptLine({
  y,
  width,
  color = "#C7C0B0",
}: {
  y: number;
  width: number;
  color?: string;
}) {
  return (
    <mesh position={[-(1.1 - width / 2) + 0.1, y, 0.06]}>
      <boxGeometry args={[width, 0.06, 0.01]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Receipt() {
  const group = useRef<Group>(null);

  // Gentle float + rotation.
  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.4) * 0.5;
    group.current.rotation.x = Math.cos(t * 0.3) * 0.12;
    group.current.position.y = Math.sin(t * 0.8) * 0.08;
  });

  const lines = useMemo(
    () => [1.6, 1.35, 1.1, 0.85, 0.6, 0.35, 0.1, -0.15, -0.4].map((y, i) => ({
      y,
      width: 0.5 + ((i * 37) % 13) / 13 * 1.3,
    })),
    [],
  );

  return (
    <group ref={group}>
      {/* paper */}
      <mesh castShadow>
        <boxGeometry args={[2.2, 4, 0.04]} />
        <meshStandardMaterial color="#FBF9F4" roughness={0.9} />
      </mesh>
      {/* header bar */}
      <mesh position={[0, 1.85, 0.06]}>
        <boxGeometry args={[1.4, 0.16, 0.01]} />
        <meshStandardMaterial color="#2F6079" />
      </mesh>
      {lines.map((l, i) => (
        <ReceiptLine key={i} y={l.y} width={l.width} />
      ))}
      {/* total bar */}
      <mesh position={[0, -0.75, 0.06]}>
        <boxGeometry args={[1.6, 0.12, 0.01]} />
        <meshStandardMaterial color="#16181D" />
      </mesh>
    </group>
  );
}

/** A translucent beam that sweeps vertically to suggest scanning. */
function ScanBeam() {
  const beam = useRef<Mesh>(null);
  useFrame((state) => {
    if (!beam.current) return;
    const t = state.clock.getElapsedTime();
    beam.current.position.y = ((Math.sin(t * 1.1) + 1) / 2) * 4 - 2;
  });
  return (
    <mesh ref={beam} position={[0, 0, 0.4]}>
      <planeGeometry args={[3.2, 0.18]} />
      <meshBasicMaterial color="#5B8AA6" transparent opacity={0.35} />
    </mesh>
  );
}

export default function Hero3D() {
  return (
    <div className="h-[320px] w-full sm:h-[420px] md:h-[520px]">
      <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 5, 4]} intensity={1.1} />
          <directionalLight position={[-4, -2, 2]} intensity={0.3} color="#5B8AA6" />
          <Receipt />
          <ScanBeam />
        </Suspense>
      </Canvas>
    </div>
  );
}
