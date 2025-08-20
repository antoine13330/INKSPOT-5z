"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ImageUpload } from "@/components/ui/image-upload"
import { Upload, Save, Eye, ImageIcon, User, Briefcase, ArrowLeft, Plus, X } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"


interface ProfileData {
  username: string
  businessName: string
  bio: string
  location: string
  website: string
  phone: string
  hourlyRate: number
  specialties: string[]
  avatar: string
  coverImage: string
  portfolio: string[]
}



export default function CustomizeProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    businessName: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    hourlyRate: 0,
    specialties: [],
    avatar: "",
    coverImage: "",
    portfolio: [],
  })
  const [newSpecialty, setNewSpecialty] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    if (session?.user?.role !== "PRO") {
      router.push("/")
      return
    }
    fetchProfileData()
  }, [session, router])

  const fetchProfileData = async () => {
    try {
      if (!session?.user?.id) return
      
      const response = await fetch(`/api/users/${session.user.id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      if (data.user) {
        setProfileData({
          username: data.user.username || "",
          businessName: data.user.businessName || "",
          bio: data.user.bio || "",
          location: data.user.location || "",
          website: data.user.website || "",
          phone: data.user.phone || "",
          hourlyRate: data.user.hourlyRate || 0,
          specialties: data.user.specialties || [],
          avatar: data.user.avatar || "",
          coverImage: data.user.coverImage || "",
          portfolio: data.user.portfolio || [],

        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching profile:", error)
      }
      // Show user-friendly error message
      alert("Failed to load profile data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: unknown) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }



  const addSpecialty = () => {
    if (newSpecialty.trim() && !profileData.specialties.includes(newSpecialty.trim())) {
      handleInputChange("specialties", [...profileData.specialties, newSpecialty.trim()])
      setNewSpecialty("")
    }
  }

  const removeSpecialty = (specialty: string) => {
    handleInputChange(
      "specialties",
      profileData.specialties.filter((s) => s !== specialty),
    )
  }

  const handleImageUpload = async (file: File, type: "avatar" | "cover" | "portfolio") => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.url) {
        if (type === "portfolio") {
          handleInputChange("portfolio", [...profileData.portfolio, data.url])
        } else {
          handleInputChange(type === "avatar" ? "avatar" : "coverImage", data.url)
        }
      }
    } catch (error) {
      // Log error for debugging (in production, send to monitoring service)
      if (process.env.NODE_ENV === 'development') {
        console.error("Error uploading image:", error)
      }
    }
  }

  const removePortfolioImage = (index: number) => {
    const newPortfolio = profileData.portfolio.filter((_, i) => i !== index)
    handleInputChange("portfolio", newPortfolio)
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      if (!session?.user?.id) {
        throw new Error("No user session")
      }

      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        alert("Profile saved successfully!")
        router.push("/pro/dashboard")
      } else {
        throw new Error(result.message || "Failed to save profile")
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error saving profile:", error)
      }
      alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/pro/dashboard">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Customize Profile</h1>
              <p className="text-gray-400">Personalize your professional profile</p>
            </div>
          </div>
          <div className="flex space-x-3">

            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="border-gray-600 text-white bg-transparent"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button onClick={saveProfile} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {previewMode ? (
          /* Preview Mode */
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Profile Preview</h2>
              <p className="text-gray-400">Preview mode - your profile will look like this</p>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="bg-gray-900 border-gray-800">
              <TabsTrigger value="basic" className="data-[state=active]:bg-gray-800">
                <User className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="business" className="data-[state=active]:bg-gray-800">
                <Briefcase className="w-4 h-4 mr-2" />
                Business
              </TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:bg-gray-800">
                <ImageIcon className="w-4 h-4 mr-2" />
                Media
              </TabsTrigger>

            </TabsList>

            <TabsContent value="basic">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Basic Information</CardTitle>
                  <CardDescription className="text-gray-400">Update your basic profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-white">
                        Business Name
                      </Label>
                      <Input
                        id="businessName"
                        value={profileData.businessName}
                        onChange={(e) => handleInputChange("businessName", e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-white">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white">
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-white">
                        Website
                      </Label>
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="https://your-website.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Business Information</CardTitle>
                  <CardDescription className="text-gray-400">Configure your professional services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="text-white">
                      Hourly Rate (€)
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={profileData.hourlyRate}
                      onChange={(e) => handleInputChange("hourlyRate", Number.parseFloat(e.target.value) || 0)}
                      className="bg-gray-800 border-gray-700 text-white"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Specialties</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        placeholder="Add a specialty"
                        className="bg-gray-800 border-gray-700 text-white flex-1"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                      />
                      <Button type="button" onClick={addSpecialty} size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profileData.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-800 text-white">
                          {specialty}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0 text-gray-400 hover:text-white"
                            onClick={() => removeSpecialty(specialty)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="media">
              <div className="space-y-6">
                {/* Avatar Upload */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Profile Picture</CardTitle>
                    <CardDescription className="text-gray-400">Upload your profile picture</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-6">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{profileData.username[0]}</AvatarFallback>
                      </Avatar>
                      <ImageUpload
                        onUpload={(file) => handleImageUpload(file, "avatar")}
                        accept="image/*"
                        maxSize={5 * 1024 * 1024} // 5MB
                      >
                        <Button variant="outline" className="border-gray-600 text-white bg-transparent">
                          <Upload className="w-4 h-4 mr-2" />
                          Change Avatar
                        </Button>
                      </ImageUpload>
                    </div>
                  </CardContent>
                </Card>

                {/* Cover Image Upload */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Cover Image</CardTitle>
                    <CardDescription className="text-gray-400">Upload a cover image for your profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profileData.coverImage && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden">
                          <img
                            src={profileData.coverImage || "/placeholder.svg"}
                            alt="Cover image"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <ImageUpload
                        onUpload={(file) => handleImageUpload(file, "cover")}
                        accept="image/*"
                        maxSize={10 * 1024 * 1024} // 10MB
                      >
                        <Button variant="outline" className="border-gray-600 text-white bg-transparent">
                          <Upload className="w-4 h-4 mr-2" />
                          {profileData.coverImage ? "Change Cover" : "Upload Cover"}
                        </Button>
                      </ImageUpload>
                    </div>
                  </CardContent>
                </Card>

                {/* Portfolio */}
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Portfolio</CardTitle>
                    <CardDescription className="text-gray-400">Showcase your work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {profileData.portfolio.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden">
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`Portfolio ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removePortfolioImage(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <ImageUpload
                        onUpload={(file) => handleImageUpload(file, "portfolio")}
                        accept="image/*"
                        maxSize={10 * 1024 * 1024} // 10MB
                      >
                        <Button variant="outline" className="border-gray-600 text-white bg-transparent">
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Portfolio
                        </Button>
                      </ImageUpload>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>


          </Tabs>
        )}
      </div>
    </div>
  )
}


