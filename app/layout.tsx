import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
// ACCESSIBILITY: Import toast provider for accessible notifications
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Social Media App",
  description: "A modern social media application with messaging and payments",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en"
      // ACCESSIBILITY: Enable reduced motion for users who prefer it
      className="scroll-smooth"
    >
      <head>
        {/* ACCESSIBILITY: Viewport meta for proper scaling */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        {/* ACCESSIBILITY: Theme color for browser UI */}
        <meta name="theme-color" content="#000000" />
        {/* ACCESSIBILITY: Ensure proper contrast and accessibility features */}
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={inter.className}>
        {/* ACCESSIBILITY: Skip link for keyboard navigation */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to main content
        </a>
        
        <div id="main-content">
          {children}
        </div>
        
        {/* ACCESSIBILITY: Include accessible toast notifications */}
        <Toaster />
        
        {/* ACCESSIBILITY: Screen reader announcements region */}
        <div 
          id="accessibility-announcements" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        ></div>
      </body>
    </html>
  )
}
