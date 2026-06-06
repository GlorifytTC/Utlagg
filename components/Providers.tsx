"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  );
}
