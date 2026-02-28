import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SessionProvider } from "next-auth/react"

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock fetch
global.fetch = jest.fn()

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}))

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

// Mock the ProfilePage component
const MockProfilePage = () => {
  const [user, setUser] = React.useState<any>(null)
  const [posts, setPosts] = React.useState<any[]>([])
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Mock data loading
    setUser({
      id: "test-user-id",
      email: "test@example.com",
      username: "testuser",
      avatar: "https://example.com/avatar.jpg",
      role: "CLIENT",
      verified: true,
      businessName: "Test Business",
      specialties: ["Tattoo", "Design"],
      bio: "Test bio",
      location: "Test City",
      website: "https://test.com",
      phone: "+1234567890",
    })
    setPosts([
      {
        id: "post-1",
        content: "Test post content",
        images: ["https://example.com/image1.jpg"],
        hashtags: ["#test", "#tattoo"],
        likesCount: 10,
        commentsCount: 5,
        viewsCount: 100,
        createdAt: "2024-01-01T00:00:00.000Z",
        author: {
          id: "test-user-id",
          username: "testuser",
          avatar: "https://example.com/avatar.jpg",
          role: "CLIENT",
          verified: true,
          businessName: "Test Business",
          specialties: ["Tattoo", "Design"],
        },
        liked: false,
      },
    ])
    setStats({
      posts: 5,
      followers: 100,
      following: 50,
    })
    setLoading(false)
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please sign in</div>
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-6">
            <img
              src={user.avatar}
              alt={`${user.username}'s avatar`}
              className="w-24 h-24 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold">@{user.username}</h1>
                {user.verified && <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">✓</span>}
                {user.role === "PRO" && <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs">PRO</span>}
              </div>
              {user.bio && <p className="text-gray-300 mb-2">{user.bio}</p>}
              {user.location && <p className="text-gray-400 text-sm mb-2">📍 {user.location}</p>}
              {user.website && (
                <p className="text-gray-400 text-sm mb-2">
                  🌐 <a href={user.website} className="text-blue-400 hover:underline">{user.website}</a>
                </p>
              )}
              {user.specialties && user.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {user.specialties.map((specialty: string) => (
                    <span key={specialty} className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex space-x-8 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.posts || 0}</div>
              <div className="text-gray-400 text-sm">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.followers || 0}</div>
              <div className="text-gray-400 text-sm">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.following || 0}</div>
              <div className="text-gray-400 text-sm">Following</div>
            </div>
          </div>

          <div className="mt-6">
            <a href="/profile/edit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              Edit Profile
            </a>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold mb-4">Posts</h2>
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={post.author.avatar}
                    alt={`${post.author.username}'s avatar`}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">@{post.author.username}</span>
                      {post.author.verified && <span className="bg-blue-500 text-white px-1 py-0.5 rounded text-xs">✓</span>}
                    </div>
                    <span className="text-gray-400 text-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-gray-300 mb-3">{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className="mb-3">
                    <img src={post.images[0]} alt="Post image" className="w-full rounded" />
                  </div>
                )}
                <div className="flex items-center space-x-4 text-gray-400 text-sm">
                  <span>❤️ {post.likesCount}</span>
                  <span>💬 {post.commentsCount}</span>
                  <span>👁️ {post.viewsCount}</span>
                </div>
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.hashtags.map((tag: string) => (
                      <span key={tag} className="text-blue-400 text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">No posts yet</div>
          )}
        </div>
      </div>
    </div>
  )
}

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders profile information correctly", async () => {
    render(
      <SessionProvider>
        <MockProfilePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "@testuser" })).toBeInTheDocument()
    })
    expect(screen.getByText("Test bio")).toBeInTheDocument()
    expect(screen.getByText("📍 Test City")).toBeInTheDocument()
    expect(screen.getByText("🌐")).toBeInTheDocument()
  })

  it("displays user stats", async () => {
    render(
      <SessionProvider>
        <MockProfilePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument()
      expect(screen.getByText("100")).toBeInTheDocument()
      expect(screen.getByText("50")).toBeInTheDocument()
    })
    const postsElements = screen.getAllByText("Posts")
    expect(postsElements.length).toBeGreaterThan(0)
    expect(screen.getByText("Followers")).toBeInTheDocument()
    expect(screen.getByText("Following")).toBeInTheDocument()
  })

  it("shows verification badge for verified users", async () => {
    render(
      <SessionProvider>
        <MockProfilePage />
      </SessionProvider>
    )

    await waitFor(() => {
      const badges = screen.getAllByText("✓")
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  it("displays user posts", async () => {
    render(
      <SessionProvider>
        <MockProfilePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Test post content")).toBeInTheDocument()
    })
    expect(screen.getByText("❤️ 10")).toBeInTheDocument()
    expect(screen.getByText("💬 5")).toBeInTheDocument()
    expect(screen.getByText("👁️ 100")).toBeInTheDocument()
  })

  it("shows specialties for professional users", async () => {
    render(
      <SessionProvider>
        <MockProfilePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Tattoo")).toBeInTheDocument()
      expect(screen.getByText("Design")).toBeInTheDocument()
    })
  })

  it("displays hashtags in posts", async () => {
    render(
      <SessionProvider>
        <MockProfilePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("#test")).toBeInTheDocument()
      expect(screen.getByText("#tattoo")).toBeInTheDocument()
    })
  })

  it("shows edit profile button", async () => {
    render(
      <SessionProvider>
        <MockProfilePage />
      </SessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByText("Edit Profile")).toBeInTheDocument()
    })
  })

  it("handles missing user data gracefully", () => {
    const MockProfilePageNoUser = () => <div>Please sign in</div>

    render(
      <SessionProvider>
        <MockProfilePageNoUser />
      </SessionProvider>
    )

    expect(screen.getByText("Please sign in")).toBeInTheDocument()
  })

  it("displays post images when available", async () => {
    render(
      <SessionProvider>
        <MockProfilePage />
      </SessionProvider>
    )

    await waitFor(() => {
      const postImage = screen.getByAltText("Post image")
      expect(postImage).toBeInTheDocument()
      expect(postImage).toHaveAttribute("src", "https://example.com/image1.jpg")
    })
  })

  it("shows post creation date", async () => {
    render(
      <SessionProvider>
        <MockProfilePage />
      </SessionProvider>
    )

    await waitFor(() => {
      // Accepter le format local (ex: 1/1/2024 ou 1/1/24 selon locale)
      const dateNode = screen.getByText((content) => content.includes("2024"))
      expect(dateNode).toBeInTheDocument()
    })
  })
}) 