import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Simulate authentication logic
    if (email === "test@example.com" && password === "password") {
      return NextResponse.json({
        success: true,
        user: {
          id: "1",
          email: email,
          username: "@pierce",
        },
        token: "mock-jwt-token",
      })
    }

    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
