"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Search, MessageCircle, ShoppingCart, User } from "lucide-react"

export function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: ShoppingCart, label: "Shop", ariaLabel: "Go to shop page" },
    { href: "/search", icon: Search, label: "Search", ariaLabel: "Search posts and users" },
    { href: "/", icon: Home, label: "Home", ariaLabel: "Go to home feed" },
    { href: "/conversations", icon: MessageCircle, label: "Messages", ariaLabel: "View your conversations" },
    { href: "/profile", icon: User, label: "Profile", ariaLabel: "View your profile" },
  ]

  return (
    <nav 
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-black border-t border-gray-800"
      // ACCESSIBILITY: Proper navigation landmark and label
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (item.href === "/conversations" && pathname.startsWith("/conversations"))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 ${isActive ? "text-blue-500" : "text-gray-400"}`}
              // ACCESSIBILITY: Enhanced ARIA attributes
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              // ACCESSIBILITY: Indicate active state for screen readers
              aria-describedby={isActive ? `nav-${item.label.toLowerCase()}-active` : undefined}
            >
              <Icon 
                className="w-6 h-6" 
                // ACCESSIBILITY: Icon has decorative role since text label is present
                aria-hidden="true"
              />
              <span className="text-xs mt-1">{item.label}</span>
              {/* ACCESSIBILITY: Hidden text for screen readers to announce active state */}
              {isActive && (
                <span 
                  id={`nav-${item.label.toLowerCase()}-active`}
                  className="sr-only"
                >
                  Current page
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
