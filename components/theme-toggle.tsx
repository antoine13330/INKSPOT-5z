"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Palette, Check, Clock, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { useAutoTheme } from "@/hooks/use-auto-theme"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const themes = [
  {
    name: "light",
    label: "🌞 Clair",
    icon: Sun,
    description: "Mode clair pour une meilleure visibilité"
  },
  {
    name: "dark", 
    label: "🌙 Sombre",
    icon: Moon,
    description: "Mode sombre pour moins de fatigue oculaire"
  },
  {
    name: "system",
    label: "🔧 Système",
    icon: Monitor,
    description: "S'adapte aux préférences système"
  },
  {
    name: "pro-custom",
    label: "🎨 Personnalisé PRO",
    icon: Palette,
    description: "Thème de marque personnalisé",
    isPro: true
  }
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const autoTheme = useAutoTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="modern-button">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    )
  }

  const currentTheme = themes.find(t => t.name === theme) || themes[0]
  const timeUntilChange = autoTheme.getTimeUntilNextChange()

  const handleAutoModeToggle = () => {
    if (autoTheme.isAutoMode) {
      autoTheme.disableAutoMode()
    } else {
      autoTheme.enableAutoMode()
      autoTheme.requestNotificationPermission()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="modern-button relative"
          aria-label="Sélectionner un thème"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          {autoTheme.isAutoMode && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 modern-card border-border/50 backdrop-blur-sm"
      >
        <div className="p-2">
          <DropdownMenuLabel className="text-sm font-medium text-foreground">
            Sélectionner un thème
          </DropdownMenuLabel>
          
          {/* Mode automatique */}
          <div className="mb-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Mode automatique</span>
              </div>
              <Button
                variant={autoTheme.isAutoMode ? "default" : "outline"}
                size="sm"
                onClick={handleAutoModeToggle}
                className="h-7 px-3 text-xs"
              >
                {autoTheme.isAutoMode ? "Activé" : "Désactivé"}
              </Button>
            </div>
            
            {autoTheme.isAutoMode && (
              <div className="text-xs text-muted-foreground">
                <p>Actuellement: {autoTheme.shouldBeLightTheme ? "Mode clair" : "Mode sombre"}</p>
                <p>
                  Prochain changement: {timeUntilChange.nextTheme === "light" ? "Clair" : "Sombre"} 
                  {" "}dans {timeUntilChange.hours}h {timeUntilChange.minutes}m
                </p>
              </div>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Liste des thèmes */}
          <div className="space-y-1 mt-2">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              const isSelected = theme === themeOption.name
              const isAvailable = !themeOption.isPro || true // TODO: check user pro status
              
              return (
                <DropdownMenuItem
                  key={themeOption.name}
                  onClick={() => {
                    if (isAvailable) {
                      setTheme(themeOption.name)
                      // Désactiver le mode auto si un thème manuel est sélectionné
                      if (autoTheme.isAutoMode && themeOption.name !== "system") {
                        autoTheme.disableAutoMode()
                      }
                    }
                  }}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                    ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}
                    ${!isAvailable ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                  disabled={!isAvailable}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {themeOption.label}
                        </span>
                        {themeOption.isPro && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gradient-primary text-primary-foreground border-0">
                            PRO
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {themeOption.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>

          <DropdownMenuSeparator />

          {/* Lien vers les paramètres PRO */}
          <DropdownMenuItem
            onClick={() => window.open('/pro/themes', '_blank')}
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <span className="font-medium text-sm">Personnaliser les thèmes</span>
              <p className="text-xs text-muted-foreground">Créez vos thèmes de marque</p>
            </div>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-gradient-primary text-primary-foreground border-0">
              PRO
            </Badge>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}