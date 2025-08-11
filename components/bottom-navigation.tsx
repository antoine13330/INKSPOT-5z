"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Home, Search, MessageCircle, User, Plus, Bell, Users, Settings, Briefcase, ChevronUp, LogOut } from "lucide-react"
import { useState } from "react"
import { NotificationsPanel } from "@/components/notifications-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export function BottomNavigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProMenu, setShowProMenu] = useState(false)

  // Navigation items for all users
  const baseNavItems = [
    { href: "/", icon: Home, label: "Home" },
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

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" })
      toast.success("Déconnexion réussie")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      toast.error("Erreur lors de la déconnexion")
    }
  }

  const navItems = getNavItems()

  // Helper function to check if a nav item is active
  const isActive = (href: string) => {
    if (!pathname) return false
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="bottom-navigation">
        <div className="nav-container">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? 'nav-item-active' : ''}`}
              >
                <item.icon className={`nav-icon ${active ? 'nav-icon-active' : ''}`} />
                <span className={`nav-label ${active ? 'nav-label-active' : ''}`}>{item.label}</span>
                {active && <div className="nav-indicator" />}
              </Link>
            )
          })}
          
          {/* PRO Menu Button */}
          {session?.user?.role === "PRO" && (
            <button
              onClick={() => setShowProMenu(!showProMenu)}
              className={`nav-item ${showProMenu ? 'nav-item-active' : ''}`}
            >
              <div className="relative">
                <Users className={`nav-icon ${showProMenu ? 'nav-icon-active' : ''}`} />
                <ChevronUp className={`w-3 h-3 absolute -top-1 -right-1 transition-transform ${showProMenu ? 'rotate-180' : ''}`} />
              </div>
              <span className={`nav-label ${showProMenu ? 'nav-label-active' : ''}`}>PRO</span>
              {showProMenu && <div className="nav-indicator" />}
            </button>
          )}
          
          {/* Notifications Button */}
          {session && (
            <button
              onClick={() => setShowNotifications(true)}
              className="nav-item"
            >
              <div className="relative">
                <Bell className="nav-icon" />
                {/* TODO: Add unread notification count badge */}
              </div>
              <span className="nav-label">Notifications</span>
            </button>
          )}

          {/* Sign Out Button */}
          {session && (
            <button
              onClick={handleSignOut}
              className="nav-item"
              style={{ color: 'var(--color-error)' }}
              title="Se déconnecter"
            >
              <LogOut className="nav-icon" />
              <span className="nav-label">Déconnexion</span>
            </button>
          )}
        </div>

        {/* PRO Submenu */}
        {showProMenu && session?.user?.role === "PRO" && (
          <div className="bg-surface border-t border-border">
            <div className="nav-container">
              <Link
                href="/collaborations"
                className={`nav-item ${isActive('/collaborations') ? 'nav-item-active' : ''}`}
                onClick={() => setShowProMenu(false)}
              >
                <Users className={`nav-icon ${isActive('/collaborations') ? 'nav-icon-active' : ''}`} />
                <span className={`nav-label ${isActive('/collaborations') ? 'nav-label-active' : ''}`}>Collabs</span>
                {isActive('/collaborations') && <div className="nav-indicator" />}
              </Link>
              
              <Link
                href="/profile/edit"
                className={`nav-item ${isActive('/profile/edit') ? 'nav-item-active' : ''}`}
                onClick={() => setShowProMenu(false)}
              >
                <Settings className={`nav-icon ${isActive('/profile/edit') ? 'nav-icon-active' : ''}`} />
                <span className={`nav-label ${isActive('/profile/edit') ? 'nav-label-active' : ''}`}>Settings</span>
                {isActive('/profile/edit') && <div className="nav-indicator" />}
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
