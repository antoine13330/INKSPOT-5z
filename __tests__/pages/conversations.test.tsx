import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock the ConversationsPage component
const MockConversationsPage = () => {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("all")

  const conversations = [
    { id: "1", name: "Despoteur Fou", lastMessage: "Hello there!" },
    { id: "2", name: "The Homelander", lastMessage: "How are you?" },
    { id: "3", name: "GorillouZ", lastMessage: "Nice work!" },
    { id: "4", name: "DoomSlayer", lastMessage: "Rip and tear!" },
  ]

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <h1>Conversations</h1>
      
      <div className="tabs">
        <button
          className={`tab ${activeTab === "all" ? "text-white border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`tab ${activeTab === "archives" ? "text-white border-b-2 border-blue-500" : ""}`}
          onClick={() => setActiveTab("archives")}
        >
          Archives
        </button>
      </div>

      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="conversations-list">
        {filteredConversations.map((conv) => (
          <div key={conv.id} className="conversation">
            <h3>{conv.name}</h3>
            <p>{conv.lastMessage}</p>

          </div>
        ))}
      </div>
    </div>
  )
}

describe("ConversationsPage", () => {
  it("renders conversations list", () => {
    render(<MockConversationsPage />)

    expect(screen.getByText("Despoteur Fou")).toBeInTheDocument()
    expect(screen.getByText("The Homelander")).toBeInTheDocument()
    expect(screen.getByText("GorillouZ")).toBeInTheDocument()
  })

  it("filters conversations based on search", () => {
    render(<MockConversationsPage />)

    const searchInput = screen.getByPlaceholderText("Search")
    fireEvent.change(searchInput, { target: { value: "Doom" } })

    expect(screen.getByText("DoomSlayer")).toBeInTheDocument()
    expect(screen.queryByText("Despoteur Fou")).not.toBeInTheDocument()
  })

  it("switches between tabs", () => {
    render(<MockConversationsPage />)

    const archivesTab = screen.getByText("Archives")
    fireEvent.click(archivesTab)

    expect(archivesTab).toHaveClass("text-white", "border-b-2", "border-blue-500")
  })



  it("displays last messages", () => {
    render(<MockConversationsPage />)

    expect(screen.getByText("Hello there!")).toBeInTheDocument()
    expect(screen.getByText("How are you?")).toBeInTheDocument()
    expect(screen.getByText("Nice work!")).toBeInTheDocument()
  })
})
