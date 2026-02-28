"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"request" | "reset" | "success" | "error">("request")
  const [message, setMessage] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")

  useEffect(() => {
    if (token) {
      setStatus("reset")
    }
  }, [token])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Password reset email sent!")
        setMessage("If an account exists with this email, you will receive a password reset link.")
        setStatus("success")
      } else {
        toast.error(data.error || "Failed to send reset email")
        setMessage(data.error || "Failed to send reset email")
      }
    } catch (error) {
      toast.error("An error occurred")
      setMessage("An error occurred while sending the reset email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Password reset successfully!")
        setMessage("Your password has been reset successfully. You can now sign in with your new password.")
        setStatus("success")
      } else {
        toast.error(data.error || "Failed to reset password")
        setMessage(data.error || "Failed to reset password")
        setStatus("error")
      }
    } catch (error) {
      toast.error("An error occurred")
      setMessage("An error occurred while resetting your password")
      setStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-white">Success!</CardTitle>
            <CardDescription className="text-gray-400">{message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/auth/login")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle className="text-white">
              {status === "reset" ? "Reset Password" : "Forgot Password"}
            </CardTitle>
            <div className="w-10"></div>
          </div>
          <CardDescription className="text-gray-400">
            {status === "reset" 
              ? "Enter your new password below" 
              : "Enter your email to receive a reset link"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === "request" && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          {status === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-gray-300">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                    placeholder="Enter new password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                    placeholder="Confirm new password"
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
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <p className="text-gray-400">{message}</p>
              <Button 
                onClick={() => router.push("/auth/login")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 