"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Home, Search, MessageCircle, User, Plus, Bell, Users, Settings, Briefcase, ChevronUp } from "lucide-react"
import { useState } from "react"
import { NotificationsPanel } from "@/components/notifications-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function BottomNavigation() {
  const { data: session } = useSession()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProMenu, setShowProMenu] = useState(false)

  // Navigation items for all users
  const baseNavItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/conversations", icon: MessageCircle, label: "Messages" },
  ]

  // PRO-specific navigation items
  const proNavItems = [
    { href: "/posts/create", icon: Plus, label: "Create" },
    { href: "/pro/dashboard", icon: Briefcase, label: "Dashboard" },
    { href: "/profile", icon: User, label: "Profile" },
  ]

  // Client-specific navigation items
  const clientNavItems = [
    { href: "/profile", icon: User, label: "Profile" },
  ]

  const getNavItems = () => {
    if (!session) {
      return [
        ...baseNavItems,
        { href: "/auth/login", icon: User, label: "Login" },
      ]
    }

    if (session.user.role === "PRO") {
      return [
        ...baseNavItems,
        ...proNavItems,
      ]
    }

    return [
      ...baseNavItems,
      ...clientNavItems,
    ]
  }

  const navItems = getNavItems()

  return (
    <>
      <nav className="modern-nav fixed bottom-0 left-0 right-0 z-50">
        <div className="flex justify-around items-center py-3 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center py-2 px-3 text-muted-foreground hover:text-primary transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
          
          {/* PRO Menu Button */}
          {session?.user?.role === "PRO" && (
            <button
              onClick={() => setShowProMenu(!showProMenu)}
              className="flex flex-col items-center py-2 px-3 text-muted-foreground hover:text-primary transition-colors"
            >
              <div className="relative">
                <Users className="w-5 h-5" />
                <ChevronUp className={`w-3 h-3 absolute -top-1 -right-1 transition-transform ${showProMenu ? 'rotate-180' : ''}`} />
              </div>
              <span className="text-xs mt-1">PRO</span>
            </button>
          )}
          
          {/* Notifications Button */}
          {session && (
            <button
              onClick={() => setShowNotifications(true)}
              className="flex flex-col items-center py-2 px-3 text-muted-foreground hover:text-primary transition-colors"
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                {/* TODO: Add unread notification count badge */}
              </div>
              <span className="text-xs mt-1">Notifications</span>
            </button>
          )}
        </div>

        {/* PRO Submenu */}
        {showProMenu && session?.user?.role === "PRO" && (
          <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border">
            <div className="flex justify-around items-center py-3 px-4">
              <Link
                href="/collaborations"
                className="flex flex-col items-center py-2 px-3 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowProMenu(false)}
              >
                <Users className="w-4 h-4" />
                <span className="text-xs mt-1">Collabs</span>
              </Link>
              
              <Link
                href="/profile/edit"
                className="flex flex-col items-center py-2 px-3 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowProMenu(false)}
              >
                <Settings className="w-4 h-4" />
                <span className="text-xs mt-1">Settings</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </>
  )
}
