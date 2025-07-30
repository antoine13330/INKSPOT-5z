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
    post: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

// Mock fs/promises
jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

// Mock fs
jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));

// Mock path
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
}));

const mockCreatePost = async (requestData: any) => {
  const mockRequest = {
    formData: jest.fn().mockResolvedValue(requestData),
  } as unknown as NextRequest;

  const { POST } = await import("@/app/api/posts/create/route");
  return POST(mockRequest);
};

describe("POST /api/posts/create", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-123" },
    });
    (prisma.post.create as jest.Mock).mockResolvedValue({
      id: "post-123",
      content: "Test content",
      hashtags: ["test"],
      images: ["/uploads/posts/test.jpg"],
      authorId: "user-123",
      status: "PUBLISHED",
      publishedAt: new Date(),
      author: {
        id: "user-123",
        username: "testuser",
        businessName: "Test Business",
        avatar: null,
      },
    });
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const mockFormData = new Map();
      const result = await mockCreatePost(mockFormData);

      expect(result.status).toBe(401);
      const data = await result.json();
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Validation", () => {
    it("returns 400 when content is missing", async () => {
      const mockFormData = new Map();
      mockFormData.set("hashtags", "[]");
      mockFormData.set("images", []);

      const result = await mockCreatePost(mockFormData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Content is required");
    });

    it("returns 400 when no images provided", async () => {
      const mockFormData = new Map();
      mockFormData.set("content", "Test content");
      mockFormData.set("hashtags", "[]");
      mockFormData.set("images", []);

      const result = await mockCreatePost(mockFormData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("At least one image is required");
    });

    it("returns 400 when too many images", async () => {
      const mockFormData = new Map();
      mockFormData.set("content", "Test content");
      mockFormData.set("hashtags", "[]");
      mockFormData.set("images", Array.from({ length: 6 }, (_, i) => 
        new File(["test"], `test${i}.jpg`, { type: "image/jpeg" })
      ));

      const result = await mockCreatePost(mockFormData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Maximum 5 images allowed");
    });

    it("returns 400 for invalid file type", async () => {
      const mockFormData = new Map();
      mockFormData.set("content", "Test content");
      mockFormData.set("hashtags", "[]");
      mockFormData.set("images", [
        new File(["test"], "test.txt", { type: "text/plain" })
      ]);

      const result = await mockCreatePost(mockFormData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Invalid file type. Only images are allowed.");
    });

    it("returns 400 for oversized image", async () => {
      const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", { type: "image/jpeg" });
      
      const mockFormData = new Map();
      mockFormData.set("content", "Test content");
      mockFormData.set("hashtags", "[]");
      mockFormData.set("images", [largeFile]);

      const result = await mockCreatePost(mockFormData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Image size too large. Maximum 5MB per image.");
    });
  });

  describe("Successful Post Creation", () => {
    it("creates post with valid data", async () => {
      const mockFormData = new Map();
      mockFormData.set("content", "Test content");
      mockFormData.set("hashtags", '["test", "art"]');
      mockFormData.set("images", [
        new File(["test"], "test.jpg", { type: "image/jpeg" })
      ]);

      const result = await mockCreatePost(mockFormData);

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.message).toBe("Post created successfully");
      expect(data.post).toBeDefined();
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          content: "Test content",
          hashtags: ["test", "art"],
          images: expect.arrayContaining([expect.stringContaining("/uploads/posts/")]),
          authorId: "user-123",
          status: "PUBLISHED",
          publishedAt: expect.any(Date),
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              businessName: true,
              avatar: true,
            },
          },
        },
      });
    });

    it("handles hashtags parsing error gracefully", async () => {
      const mockFormData = new Map();
      mockFormData.set("content", "Test content");
      mockFormData.set("hashtags", "invalid json");
      mockFormData.set("images", [
        new File(["test"], "test.jpg", { type: "image/jpeg" })
      ]);

      const result = await mockCreatePost(mockFormData);

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.message).toBe("Post created successfully");
      expect(prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hashtags: [],
          }),
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("returns 500 when database error occurs", async () => {
      (prisma.post.create as jest.Mock).mockRejectedValue(new Error("Database error"));

      const mockFormData = new Map();
      mockFormData.set("content", "Test content");
      mockFormData.set("hashtags", "[]");
      mockFormData.set("images", [
        new File(["test"], "test.jpg", { type: "image/jpeg" })
      ]);

      const result = await mockCreatePost(mockFormData);

      expect(result.status).toBe(500);
      const data = await result.json();
      expect(data.error).toBe("Failed to create post");
    });
  });
}); 