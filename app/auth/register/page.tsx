"use client"

import { useState } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Lock, 
  User, 
  Camera, 
  Upload,
  ArrowLeft,
  Eye,
  EyeOff
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  avatar?: File
}

export default function RegisterPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  })
  
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Redirect if already logged in
  if (session?.user) {
    router.push("/")
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target
    
    if (name === "avatar" && files && files[0]) {
      const file = files[0]
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size too large. Maximum 5MB allowed.")
        return
      }
      
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.")
        return
      }
      
      setFormData(prev => ({ ...prev, avatar: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true)
    try {
      await signIn("google", { callbackUrl })
    } catch (error) {
      toast.error("Google sign-up failed")
      setIsGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    
    if (!formData.username.trim()) {
      toast.error("Username is required")
      return
    }
    
    if (!formData.email.trim()) {
      toast.error("Email is required")
      return
    }

    setIsLoading(true)
    
    try {
      const registerFormData = new FormData()
      registerFormData.append("email", formData.email)
      registerFormData.append("username", formData.username)
      registerFormData.append("password", formData.password)
      registerFormData.append("firstName", formData.firstName)
      registerFormData.append("lastName", formData.lastName)
      
      if (formData.avatar) {
        registerFormData.append("avatar", formData.avatar)
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: registerFormData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Account created successfully!")
        // Redirect to verification page instead of auto-signin
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        toast.error(data.error || "Failed to create account")
      }
    } catch (error) {
      console.error("Error creating account:", error)
      toast.error("Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <CardTitle className="text-white">Create Account</CardTitle>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
          <p className="text-gray-400 text-sm">
            Join the community and start sharing your art
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-gray-600 text-white text-xl">
                  {formData.firstName?.[0] || formData.lastName?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer">
                <Camera className="w-4 h-4" />
              </label>
              <input
                id="avatar-upload"
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Click the camera icon to upload a profile picture (optional)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-300">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-300">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username" className="text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                placeholder="johndoe"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                placeholder="john@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                  placeholder="••••••••"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                  placeholder="••••••••"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {isGoogleLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                Signing up with Google...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </div>
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
