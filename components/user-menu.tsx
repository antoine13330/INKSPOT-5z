"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  Settings, 
  LogOut, 
  Briefcase, 
  Bell, 
  ChevronDown,
  Shield
} from "lucide-react"
import { toast } from "sonner"

export function UserMenu() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" })
      toast.success("Déconnexion réussie")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      toast.error("Erreur lors de la déconnexion")
    }
  }

  if (!session) {
    return (
      <Link href="/auth/login">
        <Button variant="outline" className="modern-button">
          <User className="w-4 h-4 mr-2" />
          Se connecter
        </Button>
      </Link>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="modern-button flex items-center space-x-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={session.user.image || session.user.avatar} />
            <AvatarFallback className="text-xs">
              {session.user.name?.[0] || session.user.username?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline-block text-sm">
            {session.user.name || session.user.username}
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user.name || session.user.username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <Shield className="w-3 h-3" />
              <span className="text-xs text-muted-foreground capitalize">
                {session.user.role}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            Mon profil
          </Link>
        </DropdownMenuItem>
        
        {session.user.role === "PRO" && (
          <DropdownMenuItem asChild>
            <Link href="/pro/dashboard" className="flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              Dashboard Pro
            </Link>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem asChild>
          <Link href="/profile/edit" className="flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Paramètres
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 