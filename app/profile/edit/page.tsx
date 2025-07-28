"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  MapPin,
  Globe,
  Phone,
  Palette,
  Moon,
  Sun,
  Settings,
  Bell,
  Shield,
  HelpCircle
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  username: string
  firstName?: string
  lastName?: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  specialties: string[]
  role: string
  businessName?: string
}

export default function ProfileEditPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      })

      if (response.ok) {
        toast.success("Profile updated successfully!")
        router.push("/profile")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md modern-card">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Not Signed In</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to edit your profile.
            </p>
            <Link href="/auth/login">
              <Button className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="modern-button">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground text-sm">Manage your account preferences</p>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <Card className="modern-card mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                <Input
                  id="firstName"
                  value={user?.firstName || ""}
                  onChange={(e) => setUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                  className="modern-input"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                <Input
                  id="lastName"
                  value={user?.lastName || ""}
                  onChange={(e) => setUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                  className="modern-input"
                />
              </div>
            </div>

            {user?.role === "PRO" && (
              <div>
                <Label htmlFor="businessName" className="text-foreground">Business Name</Label>
                <Input
                  id="businessName"
                  value={user?.businessName || ""}
                  onChange={(e) => setUser(prev => prev ? { ...prev, businessName: e.target.value } : null)}
                  className="modern-input"
                  placeholder="Your business or artist name"
                />
              </div>
            )}

            <div>
              <Label htmlFor="bio" className="text-foreground">Bio</Label>
              <Textarea
                id="bio"
                value={user?.bio || ""}
                onChange={(e) => setUser(prev => prev ? { ...prev, bio: e.target.value } : null)}
                className="modern-input"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-foreground">Location</Label>
              <Input
                id="location"
                value={user?.location || ""}
                onChange={(e) => setUser(prev => prev ? { ...prev, location: e.target.value } : null)}
                className="modern-input"
                placeholder="City, Country"
              />
            </div>

            <div>
              <Label htmlFor="website" className="text-foreground">Website</Label>
              <Input
                id="website"
                value={user?.website || ""}
                onChange={(e) => setUser(prev => prev ? { ...prev, website: e.target.value } : null)}
                className="modern-input"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-foreground">Phone</Label>
              <Input
                id="phone"
                value={user?.phone || ""}
                onChange={(e) => setUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                className="modern-input"
                placeholder="+1 234 567 8900"
              />
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card className="modern-card mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-foreground font-medium">Theme</Label>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-foreground font-medium">Notifications</Label>
                  <p className="text-sm text-muted-foreground">Manage notification preferences</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="modern-button">
                Configure
              </Button>
            </div>

            {/* Privacy */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-foreground font-medium">Privacy</Label>
                  <p className="text-sm text-muted-foreground">Manage your privacy settings</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="modern-button">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card className="modern-card mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Help & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              <HelpCircle className="w-4 h-4 mr-3" />
              Help Center
            </Button>
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              <Mail className="w-4 h-4 mr-3" />
              Contact Support
            </Button>
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              <Globe className="w-4 h-4 mr-3" />
              Terms of Service
            </Button>
            <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-muted">
              <Shield className="w-4 h-4 mr-3" />
              Privacy Policy
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Link href="/profile" className="flex-1">
            <Button variant="outline" className="w-full modern-button">
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 modern-button bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}