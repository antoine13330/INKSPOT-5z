"use client"

import React from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system">
      <SessionProvider>
        {children}
        <Toaster />
      </SessionProvider>
    </NextThemesProvider>
  )
} 