"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { User, Briefcase, X } from "lucide-react"
// ACCESSIBILITY: Import accessible notifications
import { useAccessibleNotifications } from "@/hooks/useAccessibleNotifications"

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<"CLIENT" | "PRO">("CLIENT")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [newSpecialty, setNewSpecialty] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
    location: "",
    website: "",
    // Pro fields
    businessName: "",
    businessAddress: "",
    siret: "",
    vatNumber: "",
    hourlyRate: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  // ACCESSIBILITY: Use accessible notifications instead of alert()
  const { showErrorNotification, showSuccessNotification } = useAccessibleNotifications()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      // ACCESSIBILITY: Use accessible error notification instead of alert
      showErrorNotification(
        "The passwords you entered do not match. Please check and enter the same password in both fields.",
        "Password Mismatch"
      )
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role: userType,
          specialties: userType === "PRO" ? specialties : [],
          hourlyRate: userType === "PRO" && formData.hourlyRate ? Number.parseFloat(formData.hourlyRate) : null,
        }),
      })

      if (response.ok) {
        // ACCESSIBILITY: Use accessible success notification
        showSuccessNotification(
          "Your account has been created successfully! Please check your email to verify your account, then you can sign in.",
          "Registration Successful"
        )
        // Small delay to let user read the notification
        setTimeout(() => {
          router.push("/auth/login?message=Registration successful")
        }, 3000)
      } else {
        const error = await response.json()
        // ACCESSIBILITY: Use accessible error notification instead of alert
        showErrorNotification(
          error.message || "Registration failed. Please check your information and try again.",
          "Registration Failed"
        )
      }
    } catch (error) {
      console.error("Registration error:", error)
      // ACCESSIBILITY: Use accessible error notification instead of alert
      showErrorNotification(
        "A technical error occurred during registration. Please try again in a few minutes.",
        "Technical Error"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()])
      setNewSpecialty("")
    }
  }

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter((s) => s !== specialty))
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Create Account - Step {step}/3</CardTitle>
          <CardDescription className="text-gray-400">
            {step === 1 && "Choose your account type"}
            {step === 2 && "Basic information"}
            {step === 3 && "Complete your profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Step 1: Account Type */}
            {step === 1 && (
              <div className="space-y-4">
                <Label className="text-white text-base">I want to:</Label>
                <RadioGroup value={userType} onValueChange={(value: "CLIENT" | "PRO") => setUserType(value)}>
                  <div className="flex items-center space-x-2 p-4 border border-gray-700 rounded-lg hover:border-gray-600">
                    <RadioGroupItem value="CLIENT" id="client" />
                    <Label htmlFor="client" className="flex items-center space-x-3 cursor-pointer flex-1">
                      <User className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="text-white font-medium">Find services</div>
                        <div className="text-gray-400 text-sm">Book appointments and connect with professionals</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border border-gray-700 rounded-lg hover:border-gray-600">
                    <RadioGroupItem value="PRO" id="pro" />
                    <Label htmlFor="pro" className="flex items-center space-x-3 cursor-pointer flex-1">
                      <Briefcase className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="text-white font-medium">Offer services</div>
                        <div className="text-gray-400 text-sm">
                          Manage bookings, create invoices, and grow your business
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                <Button type="button" onClick={nextStep} className="w-full bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="flex-1 border-gray-600 text-white bg-transparent"
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Profile Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white">
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={3}
                  />
                </div>

                {/* Pro-specific fields */}
                {userType === "PRO" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-white">
                        Business Name
                      </Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate" className="text-white">
                        Hourly Rate (€)
                      </Label>
                      <Input
                        id="hourlyRate"
                        name="hourlyRate"
                        type="number"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        className="bg-gray-800 border-gray-700 text-white"
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
                        <Button
                          type="button"
                          onClick={addSpecialty}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {specialties.map((specialty, index) => (
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
                  </>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="flex-1 border-gray-600 text-white bg-transparent"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
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
