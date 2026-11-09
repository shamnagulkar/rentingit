"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/rentingit/theme-provider";
import { QueryProvider } from "@/components/rentingit/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <QueryProvider>{children}</QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
