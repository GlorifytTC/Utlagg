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
          <path d="M144 128h224v208l-36.8-28.8L294.4 336l-36.8-28.8L220.8 336l-36.8-28.8L144 336z" fill="#FAF8F3" />
          <rect x="192" y="184" width="128" height="26" rx="13" fill="#C4522F" />
          <rect x="192" y="235" width="128" height="26" rx="13" fill="#C4522F" />
          <rect x="192" y="286" width="80" height="26" rx="13" fill="#C4522F" />
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
