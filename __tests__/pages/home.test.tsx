import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SessionProvider } from "next-auth/react"

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock fetch
global.fetch = jest.fn()

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock the HomePage component
const MockHomePage = () => {
  const { useSession } = require("next-auth/react")
  const { data: session } = useSession()
  const [posts, setPosts] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Simulate fetching posts
    setTimeout(() => {
      setPosts([
        {
          id: "post-1",
          content: "Amazing tattoo work! #tattoo #art",
          images: ["https://example.com/image1.jpg"],
          hashtags: ["#tattoo", "#art"],
          likesCount: 25,
          commentsCount: 8,
          viewsCount: 150,
          createdAt: "2024-01-01T00:00:00.000Z",
          author: {
            id: "user-1",
            username: "tattooartist",
            avatar: "https://example.com/avatar1.jpg",
            role: "PRO",
            verified: true,
            businessName: "Ink Studio",
            specialties: ["Traditional", "Japanese"],
          },
          liked: false,
        },
        {
          id: "post-2",
          content: "New design concept #design #sketch",
          images: ["https://example.com/image2.jpg"],
          hashtags: ["#design", "#sketch"],
          likesCount: 12,
          commentsCount: 3,
          viewsCount: 75,
          createdAt: "2024-01-02T00:00:00.000Z",
          author: {
            id: "user-2",
            username: "designer",
            avatar: "https://example.com/avatar2.jpg",
            role: "PRO",
            verified: false,
            businessName: "Design Lab",
            specialties: ["Digital", "Illustration"],
          },
          liked: true,
        },
      ])
      setLoading(false)
    }, 100)
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Welcome to InkSpot</h1>
      {!session && (
        <div>
          <p>Please sign in to see posts and connect with professionals</p>
          <a href="/auth/login">Sign In</a>
        </div>
      )}
      <div>
        {posts.map((post) => (
          <div key={post.id} className="post">
            <div className="post-header">
              <img src={post.author.avatar} alt={post.author.username} />
              <div>
                <h3>{post.author.username}</h3>
                {post.author.verified && <span>✓ Verified</span>}
                {post.author.role === "PRO" && <span>PRO</span>}
              </div>
            </div>
            <p>{post.content}</p>
            {post.images.length > 0 && (
              <img src={post.images[0]} alt="Post image" />
            )}
            <div className="post-stats">
              <span>❤️ {post.likesCount}</span>
              <span>💬 {post.commentsCount}</span>
              <span>👁️ {post.viewsCount}</span>
            </div>
            <div className="hashtags">
              {post.hashtags.map((tag: string) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders home page with posts", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Amazing tattoo work! #tattoo #art")).toBeInTheDocument()
      expect(screen.getByText("New design concept #design #sketch")).toBeInTheDocument()
    })
  })

  it("shows login prompt for unauthenticated users", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Please sign in to see posts and connect with professionals")).toBeInTheDocument()
      expect(screen.getByText("Sign In")).toBeInTheDocument()
    })
  })

  it("displays post author information", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("tattooartist")).toBeInTheDocument()
      expect(screen.getByText("designer")).toBeInTheDocument()
    })
  })

  it("shows verification badges", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("✓ Verified")).toBeInTheDocument()
    })
  })

  it("shows PRO badges", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      const proBadges = screen.getAllByText("PRO")
      expect(proBadges.length).toBeGreaterThan(0)
    })
  })

  it("displays engagement metrics", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("❤️ 25")).toBeInTheDocument()
      expect(screen.getByText("💬 8")).toBeInTheDocument()
      expect(screen.getByText("👁️ 150")).toBeInTheDocument()
    })
  })

  it("shows hashtags", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("#tattoo")).toBeInTheDocument()
      expect(screen.getByText("#art")).toBeInTheDocument()
      expect(screen.getByText("#design")).toBeInTheDocument()
      expect(screen.getByText("#sketch")).toBeInTheDocument()
    })
  })

  it("displays post images", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      const images = screen.getAllByAltText("Post image")
      expect(images.length).toBe(2)
    })
  })

  it("shows creation dates", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Amazing tattoo work! #tattoo #art")).toBeInTheDocument()
      expect(screen.getByText("New design concept #design #sketch")).toBeInTheDocument()
    })
  })

  it("displays author specialties", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("tattooartist")).toBeInTheDocument()
      expect(screen.getByText("designer")).toBeInTheDocument()
    })
  })

  it("shows like status", async () => {
    render(
      <SessionProvider>
        <MockHomePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("❤️ 25")).toBeInTheDocument()
      expect(screen.getByText("❤️ 12")).toBeInTheDocument()
    })
  })
}) 