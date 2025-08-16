"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Home, MessageCircle, User, Plus, Bell, Users, Settings, Briefcase, ChevronUp, LogOut, Calendar } from "lucide-react"
import { useState } from "react"
import { NotificationsPanel } from "@/components/notifications-panel"

import { toast } from "sonner"

export function BottomNavigation() {
  const { data: session } = useSession()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProMenu, setShowProMenu] = useState(false)

  // Navigation items for all users
  const baseNavItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/conversations", icon: MessageCircle, label: "Messages" },
    { href: "/profile/events", icon: Calendar, label: "Événements" },
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

  return (
    <>
      <nav className="bottom-navigation">
        <div className="nav-container">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-item"
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
          
          {/* PRO Menu Button */}
          {session?.user?.role === "PRO" && (
            <button
              onClick={() => setShowProMenu(!showProMenu)}
              className="nav-item"
            >
              <div className="relative">
                <Users className="nav-icon" />
                <ChevronUp className={`w-3 h-3 absolute -top-1 -right-1 transition-transform ${showProMenu ? 'rotate-180' : ''}`} />
              </div>
              <span className="nav-label">PRO</span>
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
                className="nav-item"
                onClick={() => setShowProMenu(false)}
              >
                <Users className="nav-icon" />
                <span className="nav-label">Collabs</span>
              </Link>
              
              <Link
                href="/profile/edit"
                className="nav-item"
                onClick={() => setShowProMenu(false)}
              >
                <Settings className="nav-icon" />
                <span className="nav-label">Settings</span>
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
