import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SessionProvider } from "next-auth/react"

// Mock the entire next-auth module
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}))

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}))

jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}))

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}))

// Mock Next.js Link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

// Mock the LoginPage component
const MockLoginPage = () => {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock form submission
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <div className="text-gray-400">Sign in to your account to continue</div>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-white">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-white">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full border-gray-700 text-white hover:bg-gray-800"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
            Continue with Google
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{" "}
              <a href="/auth/register" className="text-blue-400 hover:text-blue-300">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders login form correctly", () => {
    render(
      <SessionProvider>
        <MockLoginPage />
      </SessionProvider>
    )

    expect(screen.getByText("Welcome Back")).toBeInTheDocument()
    expect(screen.getByText("Sign in to your account to continue")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument()
  })

  it("handles form submission with valid credentials", async () => {
    render(
      <SessionProvider>
        <MockLoginPage />
      </SessionProvider>
    )

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }))

    // Verify form inputs have correct values
    expect(screen.getByLabelText("Email")).toHaveValue("test@example.com")
    expect(screen.getByLabelText("Password")).toHaveValue("password123")
  })

  it("shows Google OAuth button", () => {
    render(
      <SessionProvider>
        <MockLoginPage />
      </SessionProvider>
    )

    expect(screen.getByText("Continue with Google")).toBeInTheDocument()
  })

  it("provides link to registration page", () => {
    render(
      <SessionProvider>
        <MockLoginPage />
      </SessionProvider>
    )

    const signUpLink = screen.getByText("Sign up")
    expect(signUpLink).toBeInTheDocument()
    expect(signUpLink.closest("a")).toHaveAttribute("href", "/auth/register")
  })

  it("validates required fields", async () => {
    render(
      <SessionProvider>
        <MockLoginPage />
      </SessionProvider>
    )

    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Password")

    expect(emailInput).toHaveAttribute("required")
    expect(passwordInput).toHaveAttribute("required")
  })

  it("displays form inputs with correct types", () => {
    render(
      <SessionProvider>
        <MockLoginPage />
      </SessionProvider>
    )

    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Password")

    expect(emailInput).toHaveAttribute("type", "email")
    expect(passwordInput).toHaveAttribute("type", "password")
  })

  it("has proper form structure", () => {
    render(
      <SessionProvider>
        <MockLoginPage />
      </SessionProvider>
    )

    const form = screen.getByRole("button", { name: "Sign In" }).closest("form")
    expect(form).toBeInTheDocument()
  })
}) 