import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
}));

const mockSearchArtists = async (query: string, limit: number = 10) => {
  const mockRequest = {
    url: `http://localhost:3000/api/artists/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  } as unknown as NextRequest;

  const { GET } = await import("@/app/api/artists/search/route");
  return GET(mockRequest);
};

describe("GET /api/artists/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-123" },
    });
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const result = await mockSearchArtists("test");

      expect(result.status).toBe(401);
      const data = await result.json();
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Search Functionality", () => {
    beforeEach(() => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: "artist-1",
          username: "artist1",
          businessName: "Artist Studio 1",
          avatar: null,
          specialties: ["Traditional Tattoo", "Realism"],
          location: "New York",
          hourlyRate: 150,
          _count: {
            posts: 25,
            followers: 120,
          },
        },
        {
          id: "artist-2",
          username: "artist2",
          businessName: "Artist Studio 2",
          avatar: "/avatar2.jpg",
          specialties: ["Japanese", "Minimalist"],
          location: "Los Angeles",
          hourlyRate: 200,
          _count: {
            posts: 15,
            followers: 80,
          },
        },
      ]);
    });

    it("returns artists with default parameters", async () => {
      const result = await mockSearchArtists("");

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.artists).toHaveLength(2);
      expect(data.artists[0]).toEqual({
        id: "artist-1",
        username: "artist1",
        businessName: "Artist Studio 1",
        displayName: "Artist Studio 1",
        avatar: null,
        specialties: ["Traditional Tattoo", "Realism"],
        location: "New York",
        hourlyRate: 150,
        _count: {
          posts: 25,
          followers: 120,
        },
      });
    });

    it("filters artists by query", async () => {
      const result = await mockSearchArtists("traditional");

      expect(result.status).toBe(200);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: "PRO",
          status: "ACTIVE",
          OR: [
            { username: { contains: "traditional", mode: "insensitive" } },
            { businessName: { contains: "traditional", mode: "insensitive" } },
            { specialties: { hasSome: ["traditional"] } },
          ],
        },
        select: {
          id: true,
          username: true,
          businessName: true,
          avatar: true,
          specialties: true,
          location: true,
          hourlyRate: true,
          _count: {
            select: {
              posts: true,
              followers: true,
            },
          },
        },
        take: 10,
        orderBy: {
          profileViews: "desc",
        },
      });
    });

    it("respects limit parameter", async () => {
      const result = await mockSearchArtists("", 5);

      expect(result.status).toBe(200);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it("handles empty search results", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await mockSearchArtists("nonexistent");

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.artists).toHaveLength(0);
    });

    it("uses businessName as displayName when available", async () => {
      const result = await mockSearchArtists("");

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.artists[0].displayName).toBe("Artist Studio 1");
      expect(data.artists[1].displayName).toBe("Artist Studio 2");
    });

    it("falls back to username when businessName is null", async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: "artist-1",
          username: "artist1",
          businessName: null,
          avatar: null,
          specialties: ["Traditional Tattoo"],
          location: "New York",
          hourlyRate: 150,
          _count: {
            posts: 25,
            followers: 120,
          },
        },
      ]);

      const result = await mockSearchArtists("");

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.artists[0].displayName).toBe("artist1");
    });
  });

  describe("Search Conditions", () => {
    it("searches by username", async () => {
      await mockSearchArtists("artist1");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { username: { contains: "artist1", mode: "insensitive" } },
            ]),
          }),
        })
      );
    });

    it("searches by business name", async () => {
      await mockSearchArtists("studio");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { businessName: { contains: "studio", mode: "insensitive" } },
            ]),
          }),
        })
      );
    });

    it("searches by specialties", async () => {
      await mockSearchArtists("traditional");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { specialties: { hasSome: ["traditional"] } },
            ]),
          }),
        })
      );
    });

    it("handles empty query for specialties", async () => {
      await mockSearchArtists("");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { specialties: { hasSome: [] } },
            ]),
          }),
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("returns 500 when database error occurs", async () => {
      (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error("Database error"));

      const result = await mockSearchArtists("test");

      expect(result.status).toBe(500);
      const data = await result.json();
      expect(data.error).toBe("Failed to search artists");
    });
  });
}); 