import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createMockRequest, createMockFormData, createMockFile, mockSession, mockPrisma, resetMocks } from "../helpers/api-test-helper";

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

// Mock S3 upload
jest.mock("@/lib/s3", () => ({
  uploadToS3: jest.fn().mockResolvedValue("https://s3.amazonaws.com/test-image.jpg"),
  generateFileName: jest.fn().mockReturnValue("test-image.jpg"),
}));

const mockCreatePost = async (requestData: any) => {
  const mockRequest = createMockRequest({
    method: "POST",
    formData: requestData.formData || new FormData(),
  });

  const { POST } = await import("@/app/api/posts/create/route");
  return POST(mockRequest);
};

describe("POST /api/posts/create", () => {
  beforeEach(() => {
    resetMocks();
    mockSession({
      user: { 
        id: "user-123",
        role: "PRO"
      },
    });
    mockPrisma({
      post: {
        create: jest.fn().mockResolvedValue({
          id: "post-123",
          content: "Test content",
          hashtags: ["test"],
          images: ["https://s3.amazonaws.com/test-image.jpg"],
          authorId: "user-123",
          status: "PUBLISHED",
          publishedAt: new Date(),
          author: {
            id: "user-123",
            username: "testuser",
            businessName: "Test Business",
            avatar: null,
          },
        }),
      },
    });
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockSession(null);

      const mockFormData = createMockFormData({
        content: "Test content",
        hashtags: "[]",
        images: [],
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(401);
      const data = await result.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 403 when user is not PRO", async () => {
      mockSession({
        user: { 
          id: "user-123",
          role: "CLIENT"
        },
      });

      const mockFormData = createMockFormData({
        content: "Test content",
        hashtags: "[]",
        images: [],
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(403);
      const data = await result.json();
      expect(data.error).toBe("Only artists can create posts");
    });
  });

  describe("Validation", () => {
    it("returns 400 when content is missing", async () => {
      const mockFormData = createMockFormData({
        hashtags: "[]",
        images: [],
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Content is required");
    });

    it("returns 400 when no images provided", async () => {
      const mockFormData = createMockFormData({
        content: "Test content",
        hashtags: "[]",
        images: [],
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("At least one image is required");
    });

    it("returns 400 when too many images", async () => {
      const mockImages = Array(6).fill(createMockFile("test.jpg", "image/jpeg"));
      const mockFormData = createMockFormData({
        content: "Test content",
        hashtags: "[]",
        images: mockImages,
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Maximum 5 images allowed");
    });

    it("returns 400 for invalid file type", async () => {
      const mockFile = createMockFile("test.txt", "text/plain");
      const mockFormData = createMockFormData({
        content: "Test content",
        hashtags: "[]",
        images: [mockFile],
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Invalid file type. Only images are allowed.");
    });

    it("returns 400 for oversized image", async () => {
      // Create a file that's actually larger than 5MB (6MB)
      const mockFile = {
        name: "test.jpg",
        type: "image/jpeg",
        size: 6 * 1024 * 1024, // 6MB
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      } as unknown as File;
      
      const mockFormData = createMockFormData({
        content: "Test content",
        hashtags: "[]",
        images: [mockFile],
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Image size too large. Maximum 5MB per image.");
    });
  });

  describe("Successful Post Creation", () => {
    it("creates post with valid data", async () => {
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const mockFormData = createMockFormData({
        content: "Test content with #hashtag",
        hashtags: '["hashtag"]',
        price: "100",
        isCollaboration: "true",
        images: [mockFile],
      });

      // Mock the Prisma response to match the expected data
      mockPrisma({
        post: {
          create: jest.fn().mockResolvedValue({
            id: "post-123",
            content: "Test content with #hashtag",
            hashtags: ["hashtag"],
            images: ["https://s3.amazonaws.com/test-image.jpg"],
            price: 100,
            isCollaboration: true,
            authorId: "user-123",
            status: "PUBLISHED",
            publishedAt: new Date(),
            author: {
              id: "user-123",
              username: "testuser",
              businessName: "Test Business",
              avatar: null,
            },
          }),
        },
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.message).toBe("Post created successfully");
      expect(data.post).toBeDefined();
      expect(data.post.content).toBe("Test content with #hashtag");
      expect(data.post.hashtags).toEqual(["hashtag"]);
      expect(data.post.price).toBe(100);
      expect(data.post.isCollaboration).toBe(true);
    });

    it("handles hashtags parsing error gracefully", async () => {
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const mockFormData = createMockFormData({
        content: "Test content",
        hashtags: "invalid json",
        images: [mockFile],
      });

      // Mock the Prisma response to return empty hashtags
      mockPrisma({
        post: {
          create: jest.fn().mockResolvedValue({
            id: "post-123",
            content: "Test content",
            hashtags: [],
            images: ["https://s3.amazonaws.com/test-image.jpg"],
            authorId: "user-123",
            status: "PUBLISHED",
            publishedAt: new Date(),
            author: {
              id: "user-123",
              username: "testuser",
              businessName: "Test Business",
              avatar: null,
            },
          }),
        },
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.post.hashtags).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("returns 500 when database error occurs", async () => {
      mockPrisma({
        post: {
          create: jest.fn().mockRejectedValue(new Error("Database error")),
        },
      });

      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const mockFormData = createMockFormData({
        content: "Test content",
        hashtags: "[]",
        images: [mockFile],
      });

      const result = await mockCreatePost({ formData: mockFormData });

      expect(result.status).toBe(500);
      const data = await result.json();
      expect(data.error).toBe("Failed to create post");
    });
  });
}); 