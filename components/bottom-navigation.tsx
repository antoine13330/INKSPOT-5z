"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Search, MessageCircle, ShoppingCart, User } from "lucide-react"
import { useSession } from "next-auth/react"

export function BottomNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/conversations", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-black border-t border-gray-800">
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
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
        {!session && (
          <Link
            href="/auth/login"
            className="flex flex-col items-center py-2 px-3 text-gray-400 hover:text-blue-400"
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Login</span>
          </Link>
        )}
      </div>
    </div>
  )
}
