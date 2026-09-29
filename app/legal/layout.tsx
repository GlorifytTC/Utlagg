import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

// Legal pages share the public-site chrome so readers can navigate back, and
// stay light like every other public page (Navbar/Footer are light-only).
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="light-surface relative min-h-screen overflow-x-clip bg-paper">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
