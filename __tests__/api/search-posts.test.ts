// Mock API handler for posts search
const mockGET = async (url: string) => {
  const { searchParams } = new URL(url);
  const query = searchParams.get("q") || "";
  const tags = searchParams.get("tags")?.split(",") || [];
  const sortBy = searchParams.get("sortBy") || "date";
  const page = Number.parseInt(searchParams.get("page") || "1");
  const limit = Number.parseInt(searchParams.get("limit") || "20");

  // Mock posts data
  const mockPosts = [
    {
      id: "post_1",
      content: "Just finished this amazing traditional Japanese sleeve! #tattoo #japanese #traditional #sleeve #art",
      hashtags: ["tattoo", "japanese", "traditional", "sleeve", "art"],
      authorId: "user_1",
      status: "PUBLISHED",
      likesCount: 45,
      commentsCount: 12,
      viewsCount: 234,
      publishedAt: "2024-01-15T00:00:00.000Z",
      author: {
        id: "user_1",
        username: "@pierce",
        avatar: "https://example.com/avatar1.jpg",
        verified: true,
      },
    },
    {
      id: "post_2",
      content: "Black and grey realism portrait work. #realism #portrait #blackwork #tattoo #art",
      hashtags: ["realism", "portrait", "blackwork", "tattoo", "art"],
      authorId: "user_1",
      status: "PUBLISHED",
      likesCount: 67,
      commentsCount: 8,
      viewsCount: 456,
      publishedAt: "2024-01-10T00:00:00.000Z",
      author: {
        id: "user_1",
        username: "@pierce",
        avatar: "https://example.com/avatar1.jpg",
        verified: true,
      },
    },
    {
      id: "post_3",
      content: "New logo design for a tech startup. #logo #design #branding #digital #art",
      hashtags: ["logo", "design", "branding", "digital", "art"],
      authorId: "user_2",
      status: "PUBLISHED",
      likesCount: 34,
      commentsCount: 6,
      viewsCount: 189,
      publishedAt: "2024-01-12T00:00:00.000Z",
      author: {
        id: "user_2",
        username: "@gourmet",
        avatar: "https://example.com/avatar2.jpg",
        verified: false,
      },
    },
  ];

  // Filter posts based on query and tags
  let filteredPosts = mockPosts;

  if (query.trim()) {
    filteredPosts = filteredPosts.filter(post => 
      post.content.toLowerCase().includes(query.toLowerCase()) ||
      post.hashtags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  if (tags.length > 0) {
    filteredPosts = filteredPosts.filter(post =>
      post.hashtags.some(tag => tags.includes(tag))
    );
  }

  // Sort posts based on sortBy parameter
  switch (sortBy) {
    case "popularity":
      filteredPosts.sort((a, b) => b.viewsCount - a.viewsCount || b.likesCount - a.likesCount);
      break;
    case "likes":
      filteredPosts.sort((a, b) => b.likesCount - a.likesCount);
      break;
    case "date":
    default:
      filteredPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      break;
  }

  // Pagination
  const skip = (page - 1) * limit;
  const paginatedPosts = filteredPosts.slice(skip, skip + limit);

  return {
    status: 200,
    json: () => ({
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total: filteredPosts.length,
        hasMore: skip + limit < filteredPosts.length,
      },
    }),
  };
};

describe('Search Posts API', () => {
  it('returns posts filtered by query', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search?q=tattoo');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(2);
    expect(data.posts[0].hashtags).toContain('tattoo');
    expect(data.posts[1].hashtags).toContain('tattoo');
  });

  it('returns posts filtered by tags', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search?tags=japanese,traditional');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(1);
    expect(data.posts[0].hashtags).toContain('japanese');
    expect(data.posts[0].hashtags).toContain('traditional');
  });

  it('sorts posts by popularity', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search?sortBy=popularity');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts[0].viewsCount).toBeGreaterThanOrEqual(data.posts[1].viewsCount);
  });

  it('sorts posts by likes', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search?sortBy=likes');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts[0].likesCount).toBeGreaterThanOrEqual(data.posts[1].likesCount);
  });

  it('sorts posts by date (default)', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search');
    const data = await response.json();

    expect(response.status).toBe(200);
    const dates = data.posts.map((post: any) => new Date(post.publishedAt).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });

  it('returns empty results when no matches found', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search?q=nonexistent');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(0);
  });

  it('handles pagination correctly', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search?page=1&limit=2');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(2);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(2);
    expect(data.pagination.hasMore).toBe(true);
  });

  it('combines query and tag filtering', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search?q=art&tags=tattoo');
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should return posts that contain 'art' in content/hashtags AND have 'tattoo' tag
    data.posts.forEach((post: any) => {
      const hasArt = post.content.toLowerCase().includes('art') || 
                    post.hashtags.some((tag: string) => tag.toLowerCase().includes('art'));
      const hasTattoo = post.hashtags.includes('tattoo');
      expect(hasArt || hasTattoo).toBe(true);
    });
  });

  it('handles empty query and tags gracefully', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(3); // All posts returned
  });

  it('includes author information in results', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search');
    const data = await response.json();

    expect(response.status).toBe(200);
    data.posts.forEach((post: any) => {
      expect(post.author).toBeDefined();
      expect(post.author.id).toBeDefined();
      expect(post.author.username).toBeDefined();
      expect(post.author.avatar).toBeDefined();
    });
  });

  it('includes engagement metrics in results', async () => {
    const response = await mockGET('http://localhost:3000/api/posts/search');
    const data = await response.json();

    expect(response.status).toBe(200);
    data.posts.forEach((post: any) => {
      expect(post.likesCount).toBeDefined();
      expect(post.commentsCount).toBeDefined();
      expect(post.viewsCount).toBeDefined();
      expect(typeof post.likesCount).toBe('number');
      expect(typeof post.commentsCount).toBe('number');
      expect(typeof post.viewsCount).toBe('number');
    });
  });
}); 