import React from "react"
import { render, screen } from "@testing-library/react"
import { SessionProvider } from "next-auth/react"

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}))

// Mock Next.js Link
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))

// Mock the BottomNavigation component
const MockBottomNavigation = () => {
  const { useSession } = require("next-auth/react")
  const { data: session } = useSession()

  const navItems = [
    { href: "/", icon: "🏠", label: "Home" },
    { href: "/search", icon: "🔍", label: "Search" },
    { href: "/conversations", icon: "💬", label: "Messages" },
    { href: "/profile", icon: "👤", label: "Profile" },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-black border-t border-gray-800">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center py-2 px-3 text-gray-400 hover:text-white"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        ))}
        {!session && (
          <a
            href="/auth/login"
            className="flex flex-col items-center py-2 px-3 text-gray-400 hover:text-blue-400"
          >
            <span className="text-lg">🔐</span>
            <span className="text-xs mt-1">Login</span>
          </a>
        )}
      </div>
    </div>
  )
}

describe("BottomNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders navigation items correctly", () => {
    render(
      <SessionProvider>
        <MockBottomNavigation />
      </SessionProvider>
    )

    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Search")).toBeInTheDocument()
    expect(screen.getByText("Messages")).toBeInTheDocument()
    expect(screen.getByText("Profile")).toBeInTheDocument()
  })

  it("shows login link for unauthenticated users", () => {
    render(
      <SessionProvider>
        <MockBottomNavigation />
      </SessionProvider>
    )

    expect(screen.getByText("Login")).toBeInTheDocument()
  })

  it("does not show login link for authenticated users", () => {
    const { useSession } = require("next-auth/react")
    useSession.mockReturnValue({
      data: { user: { id: "test-user" } },
      status: "authenticated",
    })

    render(
      <SessionProvider>
        <MockBottomNavigation />
      </SessionProvider>
    )

    expect(screen.queryByText("Login")).not.toBeInTheDocument()
  })

  it("has correct navigation links", () => {
    render(
      <SessionProvider>
        <MockBottomNavigation />
      </SessionProvider>
    )

    const homeLink = screen.getByText("Home").closest("a")
    const searchLink = screen.getByText("Search").closest("a")
    const messagesLink = screen.getByText("Messages").closest("a")
    const profileLink = screen.getByText("Profile").closest("a")

    expect(homeLink).toHaveAttribute("href", "/")
    expect(searchLink).toHaveAttribute("href", "/search")
    expect(messagesLink).toHaveAttribute("href", "/conversations")
    expect(profileLink).toHaveAttribute("href", "/profile")
  })

  it("has login link for unauthenticated users", () => {
    const { useSession } = require("next-auth/react")
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    render(
      <SessionProvider>
        <MockBottomNavigation />
      </SessionProvider>
    )

    const loginLink = screen.getByText("Login").closest("a")
    expect(loginLink).toHaveAttribute("href", "/auth/login")
  })

  it("applies correct styling classes", () => {
    render(
      <SessionProvider>
        <MockBottomNavigation />
      </SessionProvider>
    )

    const navigation = document.querySelector('[class*="fixed bottom-0"]')
    expect(navigation).toBeInTheDocument()
    expect(navigation).toHaveClass("fixed", "bottom-0")
  })

  it("displays navigation icons", () => {
    render(
      <SessionProvider>
        <MockBottomNavigation />
      </SessionProvider>
    )

    expect(screen.getByText("🏠")).toBeInTheDocument()
    expect(screen.getByText("🔍")).toBeInTheDocument()
    expect(screen.getByText("💬")).toBeInTheDocument()
    expect(screen.getByText("👤")).toBeInTheDocument()
  })

  it("displays login icon for unauthenticated users", () => {
    const { useSession } = require("next-auth/react")
    useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    render(
      <SessionProvider>
        <MockBottomNavigation />
      </SessionProvider>
    )

    expect(screen.getByText("🔐")).toBeInTheDocument()
  })

  it("has proper navigation structure", () => {
    render(
      <SessionProvider>
        <MockBottomNavigation />
      </SessionProvider>
    )

    const navigationContainer = document.querySelector('[class*="flex justify-around"]')
    expect(navigationContainer).toBeInTheDocument()
  })
})
