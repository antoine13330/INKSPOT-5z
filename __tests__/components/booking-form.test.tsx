import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SessionProvider } from "next-auth/react"
import BookingPage from "@/app/booking/[proId]/page"
import jest from "jest" // Import jest to declare the variable

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock session
const mockSession = {
  user: {
    id: "user1",
    username: "testuser",
    role: "CLIENT",
  },
}

// Mock fetch
global.fetch = jest.fn()

describe("BookingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders booking form for pro user", async () => {
    const mockPro = {
      id: "pro1",
      username: "testpro",
      businessName: "Test Business",
      role: "PRO",
      hourlyRate: 50,
      specialties: ["Tattoo", "Design"],
      verified: true,
      rating: 4.5,
      reviewsCount: 10,
    }
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockPro }),
    })

    render(
      <SessionProvider session={mockSession}>
        <BookingPage params={{ proId: "pro1" }} />
      </SessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText("Book a Service")).toBeInTheDocument()
      expect(screen.getByText("Test Business")).toBeInTheDocument()
      expect(screen.getByText("50€/hour")).toBeInTheDocument()
    })
  })

  it("handles booking form submission", async () => {
    const mockPro = {
      id: "pro1",
      username: "testpro",
      hourlyRate: 50,
      specialties: [],
      verified: false,
      rating: 0,
      reviewsCount: 0,
    }
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockPro }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ slots: [{ time: "10:00", available: true }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ booking: { id: "booking1" } }),
      })

    render(
      <SessionProvider session={mockSession}>
        <BookingPage params={{ proId: "pro1" }} />
      </SessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText("Book a Service")).toBeInTheDocument()
    })

    // Fill form
    const titleInput = screen.getByLabelText("Service Title")
    fireEvent.change(titleInput, { target: { value: "Test Service" } })

    const descriptionInput = screen.getByLabelText("Description")
    fireEvent.change(descriptionInput, { target: { value: "Test description" } })

    // Submit form
    const submitButton = screen.getByText("Request Booking")
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/bookings", expect.any(Object))
    })
  })

  it("displays error for non-existent pro", async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: null }),
    })

    render(
      <SessionProvider session={mockSession}>
        <BookingPage params={{ proId: "nonexistent" }} />
      </SessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText("Professional not found")).toBeInTheDocument()
    })
  })
})
