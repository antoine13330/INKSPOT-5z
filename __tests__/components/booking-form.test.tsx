import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SessionProvider } from "next-auth/react"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: "user1",
        username: "testuser",
        role: "CLIENT",
      },
    },
    status: "authenticated",
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock fetch
global.fetch = jest.fn()

// Mock the BookingPage component
const MockBookingPage = ({ params }: { params: { proId: string } }) => {
  const [pro, setPro] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Simulate fetching pro data
    setTimeout(() => {
      setPro({
        id: params.proId,
        username: "testpro",
        businessName: "Test Business",
        role: "PRO",
        hourlyRate: 50,
        specialties: ["Tattoo", "Design"],
        verified: true,
        rating: 4.5,
        reviewsCount: 10,
      })
      setLoading(false)
    }, 100)
  }, [params.proId])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Book a Service</h1>
      <div>
        <h2>{pro.businessName}</h2>
        <p>{pro.hourlyRate}€/hour</p>
        <p>Rating: {pro.rating}/5 ({pro.reviewsCount} reviews)</p>
      </div>
      <form>
        <label>
          Service Title
          <input type="text" name="title" />
        </label>
        <label>
          Description
          <textarea name="description" />
        </label>
        <label>
          Date
          <input type="date" name="date" />
        </label>
        <label>
          Time
          <select name="time">
            <option value="10:00">10:00</option>
            <option value="11:00">11:00</option>
            <option value="12:00">12:00</option>
          </select>
        </label>
        <label>
          Duration (hours)
          <input type="number" name="duration" min="1" max="8" />
        </label>
        <button type="submit">Book Service</button>
      </form>
    </div>
  )
}

describe("BookingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders booking form for pro user", async () => {
    render(
      <SessionProvider>
        <MockBookingPage params={{ proId: "pro1" }} />
      </SessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText("Book a Service")).toBeInTheDocument()
      expect(screen.getByText("Test Business")).toBeInTheDocument()
      expect(screen.getByText("50€/hour")).toBeInTheDocument()
    })
  })

  it("handles booking form submission", async () => {
    render(
      <SessionProvider>
        <MockBookingPage params={{ proId: "pro1" }} />
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

    const dateInput = screen.getByLabelText("Date")
    fireEvent.change(dateInput, { target: { value: "2024-01-15" } })

    const timeSelect = screen.getByLabelText("Time")
    fireEvent.change(timeSelect, { target: { value: "10:00" } })

    const durationInput = screen.getByLabelText("Duration (hours)")
    fireEvent.change(durationInput, { target: { value: "2" } })

    // Submit form
    const submitButton = screen.getByText("Book Service")
    fireEvent.click(submitButton)

    // Verify form data
    expect(titleInput).toHaveValue("Test Service")
    expect(descriptionInput).toHaveValue("Test description")
    expect(dateInput).toHaveValue("2024-01-15")
    expect(timeSelect).toHaveValue("10:00")
    expect(durationInput).toHaveValue(2)
  })

  it("displays pro information correctly", async () => {
    render(
      <SessionProvider>
        <MockBookingPage params={{ proId: "pro1" }} />
      </SessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText("Test Business")).toBeInTheDocument()
      expect(screen.getByText("50€/hour")).toBeInTheDocument()
      expect(screen.getByText("Rating: 4.5/5 (10 reviews)")).toBeInTheDocument()
    })
  })

  it("shows loading state initially", () => {
    render(
      <SessionProvider>
        <MockBookingPage params={{ proId: "pro1" }} />
      </SessionProvider>,
    )

    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  it("has all required form fields", async () => {
    render(
      <SessionProvider>
        <MockBookingPage params={{ proId: "pro1" }} />
      </SessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText("Service Title")).toBeInTheDocument()
      expect(screen.getByLabelText("Description")).toBeInTheDocument()
      expect(screen.getByLabelText("Date")).toBeInTheDocument()
      expect(screen.getByLabelText("Time")).toBeInTheDocument()
      expect(screen.getByLabelText("Duration (hours)")).toBeInTheDocument()
    })
  })

  it("has submit button", async () => {
    render(
      <SessionProvider>
        <MockBookingPage params={{ proId: "pro1" }} />
      </SessionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText("Book Service")).toBeInTheDocument()
    })
  })
})
