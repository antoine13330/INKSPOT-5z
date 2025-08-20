"use client"

import React from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { OnlineStatusProvider } from "@/lib/providers/online-status-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system">
      <SessionProvider>
        <OnlineStatusProvider>
          {children}
          <Toaster />
        </OnlineStatusProvider>
      </SessionProvider>
    </NextThemesProvider>
  )
} 