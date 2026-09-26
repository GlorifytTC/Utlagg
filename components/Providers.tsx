"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { NotificationPoller } from "@/components/NotificationPoller";
import { NotificationProvider } from "@/context/NotificationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            {children}
            <NotificationPoller />
            <Toaster richColors position="top-right" />
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
