import { render, screen, fireEvent } from "@testing-library/react"
import ConversationsPage from "@/app/conversations/page"
import jest from "jest" // Declare the jest variable

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe("ConversationsPage", () => {
  it("renders conversations list", () => {
    render(<ConversationsPage />)

    expect(screen.getByText("Despoteur Fou")).toBeInTheDocument()
    expect(screen.getByText("The Homelander")).toBeInTheDocument()
    expect(screen.getByText("GorillouZ")).toBeInTheDocument()
  })

  it("filters conversations based on search", () => {
    render(<ConversationsPage />)

    const searchInput = screen.getByPlaceholderText("Search")
    fireEvent.change(searchInput, { target: { value: "Doom" } })

    expect(screen.getByText("DoomSlayer")).toBeInTheDocument()
    expect(screen.queryByText("Despoteur Fou")).not.toBeInTheDocument()
  })

  it("switches between tabs", () => {
    render(<ConversationsPage />)

    const archivesTab = screen.getByText("Archives")
    fireEvent.click(archivesTab)

    expect(archivesTab).toHaveClass("text-white", "border-b-2", "border-blue-500")
  })
})
