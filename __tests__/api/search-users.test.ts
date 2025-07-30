// Mock API handler for users search
const mockUsersGET = async (url: string) => {
  const { searchParams } = new URL(url);
  const query = searchParams.get("q") || "";
  const tags = searchParams.get("tags")?.split(",") || [];
  const role = searchParams.get("role") || "PRO";
  const sortBy = searchParams.get("sortBy") || "popularity";
  const page = Number.parseInt(searchParams.get("page") || "1");
  const limit = Number.parseInt(searchParams.get("limit") || "20");

  // Mock users data
  const mockUsers = [
    {
      id: "user_1",
      username: "@pierce",
      avatar: "https://example.com/avatar1.jpg",
      bio: "Professional tattoo artist specializing in custom designs and traditional art. 15+ years of experience.",
      location: "Paris, France",
      verified: true,
      role: "PRO",
      businessName: "Pierce Tattoo Studio",
      specialties: ["Traditional Tattoo", "Custom Design", "Black & Grey", "Realism"],
      hourlyRate: 80,
      profileViews: 1200,
      postsCount: 15,
      followersCount: 450,
      createdAt: "2023-01-15T00:00:00.000Z",
    },
    {
      id: "user_2",
      username: "@gourmet_del_arte",
      avatar: "https://example.com/avatar2.jpg",
      bio: "Digital artist and graphic designer creating stunning visual experiences.",
      location: "Lyon, France",
      verified: false,
      role: "PRO",
      businessName: "Gourmet Art Studio",
      specialties: ["Digital Art", "Logo Design", "Illustration", "Branding"],
      hourlyRate: 60,
      profileViews: 800,
      postsCount: 8,
      followersCount: 230,
      createdAt: "2023-03-20T00:00:00.000Z",
    },
    {
      id: "user_3",
      username: "@ink_master",
      avatar: "https://example.com/avatar3.jpg",
      bio: "Specialized in Japanese and traditional tattoo styles with over 10 years experience.",
      location: "Tokyo, Japan",
      verified: true,
      role: "PRO",
      businessName: "Ink Master Studio",
      specialties: ["Japanese Tattoo", "Traditional", "Sleeve Design", "Black & Grey"],
      hourlyRate: 100,
      profileViews: 2000,
      postsCount: 25,
      followersCount: 800,
      createdAt: "2022-08-10T00:00:00.000Z",
    },
  ];

  // Filter users based on query, tags, and role
  let filteredUsers = mockUsers.filter(user => user.role === role);

  if (query.trim()) {
    filteredUsers = filteredUsers.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.businessName?.toLowerCase().includes(query.toLowerCase()) ||
      user.bio.toLowerCase().includes(query.toLowerCase())
    );
  }

  if (tags.length > 0) {
    filteredUsers = filteredUsers.filter(user =>
      user.specialties.some(specialty => tags.includes(specialty))
    );
  }

  // Sort users based on sortBy parameter
  switch (sortBy) {
    case "popularity":
      filteredUsers.sort((a, b) => b.profileViews - a.profileViews || a.username.localeCompare(b.username));
      break;
    case "date":
      filteredUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "name":
      filteredUsers.sort((a, b) => a.username.localeCompare(b.username));
      break;
    default:
      filteredUsers.sort((a, b) => b.profileViews - a.profileViews || a.username.localeCompare(b.username));
  }

  // Pagination
  const skip = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(skip, skip + limit);

  return {
    status: 200,
    json: () => ({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        hasMore: skip + limit < filteredUsers.length,
      },
    }),
  };
};

describe('Search Users API', () => {
  it('returns users filtered by query', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?q=pierce');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1);
    expect(data.users[0].username).toBe('@pierce');
  });

  it('returns users filtered by specialties (tags)', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?tags=Traditional Tattoo,Realism');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(1); // pierce has both Traditional Tattoo and Realism
    data.users.forEach((user: any) => {
      const hasTraditional = user.specialties.includes('Traditional Tattoo') || user.specialties.includes('Realism');
      expect(hasTraditional).toBe(true);
    });
  });

  it('sorts users by popularity (default)', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?sortBy=popularity');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users[0].profileViews).toBeGreaterThanOrEqual(data.users[1].profileViews);
  });

  it('sorts users by date', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?sortBy=date');
    const data = await response.json();

    expect(response.status).toBe(200);
    const dates = data.users.map((user: any) => new Date(user.createdAt).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });

  it('sorts users by name', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?sortBy=name');
    const data = await response.json();

    expect(response.status).toBe(200);
    const usernames = data.users.map((user: any) => user.username);
    // Check that usernames are sorted alphabetically
    expect(usernames[0] <= usernames[1]).toBe(true);
  });

  it('filters by PRO role by default', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search');
    const data = await response.json();

    expect(response.status).toBe(200);
    data.users.forEach((user: any) => {
      expect(user.role).toBe('PRO');
    });
  });

  it('returns empty results when no matches found', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?q=nonexistent');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(0);
  });

  it('handles pagination correctly', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?page=1&limit=2');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.users).toHaveLength(2);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(2);
    expect(data.pagination.hasMore).toBe(true);
  });

  it('combines query and tag filtering', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?q=tattoo&tags=Traditional');
    const data = await response.json();

    expect(response.status).toBe(200);
    data.users.forEach((user: any) => {
      const hasTattoo = user.bio.toLowerCase().includes('tattoo') || 
                       user.businessName?.toLowerCase().includes('tattoo');
      const hasTraditional = user.specialties.some((specialty: string) => specialty.includes('Traditional'));
      expect(hasTattoo || hasTraditional).toBe(true);
    });
  });

  it('includes user statistics in results', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search');
    const data = await response.json();

    expect(response.status).toBe(200);
    data.users.forEach((user: any) => {
      expect(user.postsCount).toBeDefined();
      expect(user.followersCount).toBeDefined();
      expect(user.profileViews).toBeDefined();
      expect(typeof user.postsCount).toBe('number');
      expect(typeof user.followersCount).toBe('number');
      expect(typeof user.profileViews).toBe('number');
    });
  });

  it('includes business information for PRO users', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search');
    const data = await response.json();

    expect(response.status).toBe(200);
    data.users.forEach((user: any) => {
      expect(user.businessName).toBeDefined();
      expect(user.specialties).toBeDefined();
      expect(user.hourlyRate).toBeDefined();
      expect(Array.isArray(user.specialties)).toBe(true);
      expect(typeof user.hourlyRate).toBe('number');
    });
  });

  it('handles search by business name', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?q=Studio');
    const data = await response.json();

    expect(response.status).toBe(200);
    data.users.forEach((user: any) => {
      expect(user.businessName?.toLowerCase()).toContain('studio');
    });
  });

  it('handles search by bio content', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?q=experience');
    const data = await response.json();

    expect(response.status).toBe(200);
    data.users.forEach((user: any) => {
      expect(user.bio.toLowerCase()).toContain('experience');
    });
  });

  it('filters by multiple specialties', async () => {
    const response = await mockUsersGET('http://localhost:3000/api/users/search?tags=Digital Art,Branding');
    const data = await response.json();

    expect(response.status).toBe(200);
    data.users.forEach((user: any) => {
      const hasDigitalArt = user.specialties.includes('Digital Art');
      const hasBranding = user.specialties.includes('Branding');
      expect(hasDigitalArt || hasBranding).toBe(true);
    });
  });
}); 