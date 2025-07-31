"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { 
  Palette, 
  Eye, 
  Save, 
  RotateCcw, 
  Download, 
  Upload,
  Check,
  Crown,
  Sparkles
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ColorConfig {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  card: string
  border: string
  muted: string
}

interface ThemePreset {
  id: string
  name: string
  description: string
  colors: ColorConfig
  isPremium?: boolean
}

const defaultPresets: ThemePreset[] = [
  {
    id: 'purple-brand',
    name: 'Purple Brand',
    description: 'Thème violet premium pour votre marque',
    colors: {
      primary: '#8B5CF6',
      secondary: '#F3E8FF',
      accent: '#A855F7',
      background: '#FDFCFF',
      foreground: '#1F1B24',
      card: '#FFFFFF',
      border: '#E5D4FF',
      muted: '#F3E8FF'
    }
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Thème bleu océan apaisant',
    colors: {
      primary: '#0EA5E9',
      secondary: '#E0F2FE',
      accent: '#0284C7',
      background: '#F8FAFC',
      foreground: '#0F172A',
      card: '#FFFFFF',
      border: '#BAE6FD',
      muted: '#E0F2FE'
    },
    isPremium: true
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Thème orange coucher de soleil',
    colors: {
      primary: '#F97316',
      secondary: '#FFF7ED',
      accent: '#EA580C',
      background: '#FEFCFB',
      foreground: '#1C1917',
      card: '#FFFFFF',
      border: '#FED7AA',
      muted: '#FFF7ED'
    },
    isPremium: true
  }
]

export default function ProThemesPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('purple-brand')
  const [customColors, setCustomColors] = useState<ColorConfig>(defaultPresets[0].colors)
  const [previewMode, setPreviewMode] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Chargement...</div>
  }

  const handleColorChange = (colorKey: keyof ColorConfig, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorKey]: value
    }))
  }

  const applyPreset = (preset: ThemePreset) => {
    setSelectedPreset(preset.id)
    setCustomColors(preset.colors)
    setPreviewMode(true)
  }

  const saveTheme = () => {
    // Ici on sauvegarderait le thème dans la base de données
    // Pour la démo, on utilise localStorage
    localStorage.setItem('pro-custom-theme', JSON.stringify(customColors))
    setTheme('pro-custom')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const resetTheme = () => {
    setCustomColors(defaultPresets[0].colors)
    setPreviewMode(false)
  }

  const exportTheme = () => {
    const themeData = {
      name: `Custom Theme ${new Date().toLocaleDateString()}`,
      colors: customColors,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inkspot-custom-theme.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-pro flex items-center justify-center">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Thèmes Personnalisés PRO
              <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
                <Sparkles className="h-3 w-3 mr-1" />
                PRO
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Créez et personnalisez vos thèmes de marque avec un aperçu en temps réel
            </p>
          </div>
        </div>

        {saved && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Check className="h-4 w-4" />
            <AlertDescription>
              Thème sauvegardé avec succès ! Il est maintenant disponible dans le sélecteur de thème.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Panel de configuration */}
        <div className="space-y-6">
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Configuration du thème
              </CardTitle>
              <CardDescription>
                Personnalisez les couleurs de votre thème de marque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="presets" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="presets">Modèles</TabsTrigger>
                  <TabsTrigger value="custom">Personnalisé</TabsTrigger>
                </TabsList>
                
                <TabsContent value="presets" className="space-y-4">
                  <div className="grid gap-3">
                    {defaultPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className={`
                          p-4 rounded-lg border cursor-pointer transition-all
                          ${selectedPreset === preset.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{preset.name}</h3>
                          {preset.isPremium && (
                            <Badge variant="outline" className="text-xs">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {preset.description}
                        </p>
                        <div className="flex gap-1">
                          {Object.values(preset.colors).slice(0, 5).map((color, index) => (
                            <div
                              key={index}
                              className="w-6 h-6 rounded-full border border-border/50"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  <div className="grid gap-4">
                    {Object.entries(customColors).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label htmlFor={key} className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <div className="flex gap-3">
                          <Input
                            id={key}
                            type="color"
                            value={value}
                            onChange={(e) => handleColorChange(key as keyof ColorConfig, e.target.value)}
                            className="w-16 h-10 p-1 border-border"
                          />
                          <Input
                            value={value}
                            onChange={(e) => handleColorChange(key as keyof ColorConfig, e.target.value)}
                            placeholder="#000000"
                            className="flex-1 modern-input"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              <div className="flex gap-3">
                <Button 
                  onClick={saveTheme}
                  className="flex-1 modern-button bg-gradient-primary hover:opacity-90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetTheme}
                  className="modern-button"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={exportTheme}
                  className="modern-button"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de prévisualisation */}
        <div className="space-y-6">
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu du thème
              </CardTitle>
              <CardDescription>
                Visualisation en temps réel de votre thème personnalisé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="space-y-4 p-6 rounded-lg border"
                style={{
                  backgroundColor: customColors.background,
                  color: customColors.foreground,
                  borderColor: customColors.border
                }}
              >
                {/* Header preview */}
                <div className="flex items-center justify-between pb-4 border-b" style={{borderColor: customColors.border}}>
                  <h3 className="font-semibold">INKSPOT</h3>
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{backgroundColor: customColors.primary}}
                    />
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{backgroundColor: customColors.secondary}}
                    />
                  </div>
                </div>

                {/* Content preview */}
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: customColors.card,
                    border: `1px solid ${customColors.border}`
                  }}
                >
                  <h4 className="font-medium mb-2">Post Example</h4>
                  <p className="text-sm mb-3" style={{color: customColors.muted}}>
                    Ceci est un exemple de contenu avec votre thème personnalisé.
                  </p>
                  <div className="flex gap-2">
                    <button 
                      className="px-3 py-1 rounded text-sm font-medium"
                      style={{
                        backgroundColor: customColors.primary,
                        color: 'white'
                      }}
                    >
                      Action primaire
                    </button>
                    <button 
                      className="px-3 py-1 rounded text-sm border"
                      style={{
                        borderColor: customColors.border,
                        backgroundColor: customColors.secondary,
                        color: customColors.foreground
                      }}
                    >
                      Action secondaire
                    </button>
                  </div>
                </div>

                {/* Accent elements */}
                <div className="flex gap-2">
                  {[customColors.primary, customColors.accent, customColors.secondary].map((color, i) => (
                    <div
                      key={i}
                      className="flex-1 h-12 rounded"
                      style={{backgroundColor: color}}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardHeader>
              <CardTitle>Conseils d'accessibilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Contraste WCAG AA</p>
                  <p className="text-xs text-muted-foreground">
                    Assurez-vous d'un ratio de contraste de 4.5:1 minimum
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Cohérence visuelle</p>
                  <p className="text-xs text-muted-foreground">
                    Utilisez une palette harmonieuse pour votre marque
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                <div>
                  <p className="text-sm font-medium">Test multi-appareil</p>
                  <p className="text-xs text-muted-foreground">
                    Vérifiez le rendu sur mobile et desktop
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}