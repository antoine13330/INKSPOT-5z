import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
<<<<<<< HEAD
import { Providers } from "@/components/providers"
=======
import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/components/ui/toast-provider"
>>>>>>> origin/cursor/nettoyer-les-composants-obsol-tes-a507
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "INKSPOT - Art Community",
  description: "A modern social media application with messaging and payments for professionals",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
<<<<<<< HEAD
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
=======
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
>>>>>>> origin/cursor/nettoyer-les-composants-obsol-tes-a507
      </body>
    </html>
  )
}
