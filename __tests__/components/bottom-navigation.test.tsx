import { render, screen } from "@testing-library/react"
import { BottomNavigation } from "@/components/bottom-navigation"
import jest from "jest"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

describe("BottomNavigation", () => {
  it("renders all navigation items", () => {
    render(<BottomNavigation />)

    expect(screen.getByText("Shop")).toBeInTheDocument()
    expect(screen.getByText("Search")).toBeInTheDocument()
    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Messages")).toBeInTheDocument()
    expect(screen.getByText("Profile")).toBeInTheDocument()
  })

  it("highlights active navigation item", () => {
    render(<BottomNavigation />)

    const homeLink = screen.getByText("Home").closest("a")
    expect(homeLink).toHaveClass("text-blue-500")
  })
})
