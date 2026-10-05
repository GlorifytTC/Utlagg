import { ImageResponse } from "next/og";

export const alt = "Kvittino - AI-driven kvittohantering";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand mark from public/kvittino-mark.svg, drawn inline (Satori can't read files).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#FAF8F3",
          color: "#1A1A1A",
        }}
      >
        <svg width="128" height="128" viewBox="0 0 512 512">
          <rect width="512" height="512" rx="128" fill="#C4522F" />
          <g transform="rotate(-6 256 256)">
            <path d="M136 112h240v264l-30-24-30 24-30-24-30 24-30-24-30 24-30-24-30 24z" fill="#FAF8F3"/>
            <rect x="196" y="148" width="120" height="18" rx="9" fill="#C4522F"/>
            <circle cx="206" cy="212" r="20" fill="#C4522F"/>
            <circle cx="306" cy="212" r="20" fill="#C4522F"/>
            <path d="M196 270q60 56 120 0" fill="none" stroke="#C4522F" strokeWidth="26" strokeLinecap="round"/>
          </g>
        </svg>
        <div style={{ marginTop: 48, fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>Kvittino</div>
        <div style={{ marginTop: 16, fontSize: 38, color: "#5a5a5a" }}>
          Skanna, bokför och exportera kvitton automatiskt.
        </div>
      </div>
    ),
    size,
  );
}
