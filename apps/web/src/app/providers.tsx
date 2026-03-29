"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/shared/hooks/use-theme";
import { Toaster } from "sonner";
import { I18nProvider } from "@/shared/i18n";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        {children}
        <Toaster richColors closeButton position="top-right" />
      </I18nProvider>
    </ThemeProvider>
  );
}
