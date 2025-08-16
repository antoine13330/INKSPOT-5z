"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EnhancedConversation } from "./enhanced-conversation"
import { ContactLoading } from "./contact-loading"
import { 
  MessageCircle, 
  Users, 
  Phone, 
  Video, 
  ImageIcon,
  Send,
  Star,
  MapPin,
  Clock,
  TestTube,
  Check
} from "lucide-react"

interface TestArtist {
  id: string
  username: string
  businessName?: string
  avatar?: string
  role: string
  location?: string
  hourlyRate?: number
  specialties?: string[]
}

interface TestPost {
  id: string
  content: string
  images: string[]
  price?: number
  tags: string[]
}

export function ConversationTester() {
  const [activeTest, setActiveTest] = useState<string | null>(null)
  const [selectedArtist, setSelectedArtist] = useState<TestArtist | null>(null)
  const [selectedPost, setSelectedPost] = useState<TestPost | null>(null)

  // Données de test
  const testArtists: TestArtist[] = [
    {
      id: "artist-1",
      username: "tattoo_master",
      businessName: "Studio Ink Master",
      avatar: "/placeholder-user.jpg",
      role: "PRO",
      location: "Paris, France",
      hourlyRate: 120,
      specialties: ["Tattoo", "Portrait", "Japonais"]
    },
    {
      id: "artist-2",
      username: "piercing_expert",
      businessName: "Piercing Pro",
      avatar: "/placeholder-user.jpg",
      role: "PRO",
      location: "Lyon, France",
      hourlyRate: 80,
      specialties: ["Piercing", "Modifications"]
    },
    {
      id: "artist-3",
      username: "art_designer",
      businessName: "Art & Design Studio",
      avatar: "/placeholder-user.jpg",
      role: "PRO",
      location: "Marseille, France",
      hourlyRate: 95,
      specialties: ["Design", "Illustration", "Digital"]
    }
  ]

  const testPosts: TestPost[] = [
    {
      id: "post-1",
      content: "Nouveau design de tatouage japonais traditionnel. Disponible pour réalisation sur mesure.",
      images: ["/placeholder.jpg"],
      price: 300,
      tags: ["tattoo", "japonais", "traditionnel"]
    },
    {
      id: "post-2",
      content: "Portrait réaliste en noir et blanc. Technique pointillisme pour un rendu unique.",
      images: ["/placeholder.jpg"],
      price: 450,
      tags: ["portrait", "réaliste", "pointillisme"]
    },
    {
      id: "post-3",
      content: "Design de piercing personnalisé. Consultation gratuite pour votre projet.",
      images: ["/placeholder.jpg"],
      price: 150,
      tags: ["piercing", "personnalisé", "consultation"]
    }
  ]

  const startTest = (testType: string, artist: TestArtist, post: TestPost) => {
    setActiveTest(testType)
    setSelectedArtist(artist)
    setSelectedPost(post)
  }

  const closeTest = () => {
    setActiveTest(null)
    setSelectedArtist(null)
    setSelectedPost(null)
  }

  if (activeTest && selectedArtist && selectedPost) {
    if (activeTest === "enhanced") {
      return (
        <EnhancedConversation
          artist={selectedArtist}
          post={selectedPost}
          onClose={closeTest}
          onSendMessage={(message) => {
            console.log("Message envoyé:", message)
          }}
        />
      )
    }

    if (activeTest === "loading") {
      return (
        <ContactLoading
          artist={selectedArtist}
          post={selectedPost}
          onClose={closeTest}
        />
      )
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TestTube className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Testeur de Conversations INKSPOT</h1>
          </div>
          <p className="text-muted-foreground">
            Testez toutes les fonctionnalités du système de conversations
          </p>
        </div>

        {/* Tests disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Conversation Améliorée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Test complet avec messages simulés, indicateur de frappe, et interface avancée
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Messages simulés</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Indicateur de frappe</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Upload d'images</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Interface complète</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Écran de Chargement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Test de l'écran de chargement et de la création de conversation
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Animation de chargement</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Transition fluide</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Interface simple</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Artistes de Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Profils d'artistes avec différentes spécialités et tarifs
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>3 profils différents</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Spécialités variées</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Tarifs réalistes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Artistes de test */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Artistes de Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testArtists.map((artist) => (
              <Card key={artist.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {artist.businessName?.charAt(0) || artist.username.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{artist.businessName || artist.username}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{artist.role}</Badge>
                        {artist.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {artist.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {artist.hourlyRate && (
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">€{artist.hourlyRate}/heure</span>
                    </div>
                  )}
                  
                  {artist.specialties && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {artist.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => startTest("enhanced", artist, testPosts[0])}
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Conversation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startTest("loading", artist, testPosts[0])}
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Posts de test */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-6 h-6" />
            Posts de Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="w-full h-32 bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  
                  <h3 className="font-semibold mb-2 line-clamp-2">{post.content}</h3>
                  
                  {post.price && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-green-600">€{post.price}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => startTest("enhanced", testArtists[0], post)}
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contacter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Instructions de Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                <p>Cliquez sur "Conversation" pour tester l'interface complète avec messages simulés</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                <p>Cliquez sur l'icône d'horloge pour tester l'écran de chargement</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                <p>Testez l'envoi de messages, l'upload d'images et toutes les interactions</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                <p>Observez les indicateurs de frappe et les réponses automatiques simulées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
