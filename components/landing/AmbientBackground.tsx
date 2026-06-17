// components/landing/AmbientBackground.tsx
"use client";

import dynamic from "next/dynamic";

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

      {/* Professional glass overlay - pure refraction */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: 'blur(12px) brightness(1.08) saturate(1.18)',
          WebkitBackdropFilter: 'blur(12px) brightness(1.08) saturate(1.18)',
          backgroundImage: `
            /* Microscopic surface imperfections */
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E"),
            /* Subtle light refraction rings */
            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.03) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.02) 0%, transparent 50%)
          `,
          backgroundSize: '200px 200px, 100% 100%, 100% 100%',
        }}
      />
    </div>
  );
}