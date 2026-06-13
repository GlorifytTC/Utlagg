// components/landing/AmbientBackground.tsx
"use client";

import dynamic from "next/dynamic";

// 3D layer loads client-side only (WebGL). Soft colour washes render instantly
// underneath so there's depth even before the canvas mounts.
const Ambient3D = dynamic(() => import("./Ambient3D"), { ssr: false });

export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Soft drifting colour washes (base depth) */}
      <div
        className="amb-blob"
        style={{
          position: "absolute", top: "-18%", left: "-10%", width: "55vw", height: "55vw",
          background: "radial-gradient(circle at center, rgba(91,138,166,0.16), transparent 68%)",
          filter: "blur(70px)", animation: "amb1 26s ease-in-out infinite",
        }}
      />
      <div
        className="amb-blob"
        style={{
          position: "absolute", top: "12%", right: "-14%", width: "48vw", height: "48vw",
          background: "radial-gradient(circle at center, rgba(217,138,55,0.10), transparent 68%)",
          filter: "blur(80px)", animation: "amb2 32s ease-in-out infinite",
        }}
      />
      <div
        className="amb-blob"
        style={{
          position: "absolute", bottom: "-22%", left: "22%", width: "52vw", height: "52vw",
          background: "radial-gradient(circle at center, rgba(47,96,121,0.12), transparent 68%)",
          filter: "blur(90px)", animation: "amb3 38s ease-in-out infinite",
        }}
      />

      {/* Floating 3D orbs */}
      <div className="absolute inset-0">
        <Ambient3D />
      </div>
    </div>
  );
}
