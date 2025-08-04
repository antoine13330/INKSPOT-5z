"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Mail, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">("idle")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    setStatus("loading")
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`)
      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage("Email verified successfully! You can now sign in to your account.")
        toast.success("Email verified successfully!")
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to verify email")
        toast.error(data.error || "Failed to verify email")
      }
    } catch (error) {
      setStatus("error")
      setMessage("An error occurred while verifying your email")
      toast.error("An error occurred while verifying your email")
    }
  }

  const resendVerification = async () => {
    setStatus("loading")
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: searchParams.get("email") }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Verification email sent!")
        setMessage("A new verification email has been sent to your inbox.")
      } else {
        toast.error(data.error || "Failed to send verification email")
        setMessage(data.error || "Failed to send verification email")
      }
    } catch (error) {
      toast.error("An error occurred")
      setMessage("An error occurred while sending verification email")
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
            <CardTitle className="text-white">Email Verification</CardTitle>
            <div className="w-10"></div>
          </div>
          <CardDescription className="text-gray-400">
            {token ? "Verifying your email address..." : "Check your email for verification"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold text-white">Email Verified!</h3>
              <p className="text-gray-400">{message}</p>
              <Button 
                onClick={() => router.push("/auth/login")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Sign In
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h3 className="text-xl font-semibold text-white">Verification Failed</h3>
              <p className="text-gray-400">{message}</p>
              <div className="space-y-2">
                <Button 
                  onClick={resendVerification}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Resend Verification Email
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/auth/login")}
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}

          {status === "idle" && !token && (
            <div className="text-center space-y-4">
              <Mail className="w-16 h-16 text-blue-500 mx-auto" />
              <h3 className="text-xl font-semibold text-white">Check Your Email</h3>
              <p className="text-gray-400">
                We've sent a verification link to your email address. 
                Please check your inbox and click the verification link.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={resendVerification}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Resend Verification Email
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push("/auth/login")}
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 