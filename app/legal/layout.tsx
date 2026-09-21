export default function LegalLayout({ children }: { children: React.ReactNode }) {
  // Legal pages render on the pinned-light body, so give them their own
  // full-bleed surface that flips to near-black in dark mode (the body bg
  // stays light for the always-light marketing pages).
  return <div className="min-h-screen bg-paper dark:bg-[#0A0A0A]">{children}</div>;
}
