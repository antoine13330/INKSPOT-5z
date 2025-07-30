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
      findUnique: jest.fn(),
    },
    conversation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

const mockCreateConversation = async (requestData: any) => {
  const mockRequest = {
    json: jest.fn().mockResolvedValue(requestData),
  } as unknown as NextRequest;

  const { POST } = await import("@/app/api/conversations/create/route");
  return POST(mockRequest);
};

describe("POST /api/conversations/create", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user-123" },
    });
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const requestData = {
        artistId: "artist-123",
        postId: "post-123",
        price: 100,
        message: "I'm interested",
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(401);
      const data = await result.json();
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Validation", () => {
    it("returns 400 when missing required fields", async () => {
      const requestData = {
        artistId: "artist-123",
        // Missing postId, price, message
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Missing required fields");
    });

    it("returns 400 when artistId is missing", async () => {
      const requestData = {
        postId: "post-123",
        price: 100,
        message: "I'm interested",
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Missing required fields");
    });

    it("returns 400 when postId is missing", async () => {
      const requestData = {
        artistId: "artist-123",
        price: 100,
        message: "I'm interested",
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Missing required fields");
    });

    it("returns 400 when price is missing", async () => {
      const requestData = {
        artistId: "artist-123",
        postId: "post-123",
        message: "I'm interested",
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Missing required fields");
    });

    it("returns 400 when message is missing", async () => {
      const requestData = {
        artistId: "artist-123",
        postId: "post-123",
        price: 100,
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Missing required fields");
    });
  });

  describe("Post Validation", () => {
    it("returns 404 when post not found", async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const requestData = {
        artistId: "artist-123",
        postId: "post-123",
        price: 100,
        message: "I'm interested",
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(404);
      const data = await result.json();
      expect(data.error).toBe("Post not found");
    });

    it("returns 400 when post doesn't belong to artist", async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: "post-123",
        authorId: "different-artist",
        author: { id: "different-artist" },
      });

      const requestData = {
        artistId: "artist-123",
        postId: "post-123",
        price: 100,
        message: "I'm interested",
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(400);
      const data = await result.json();
      expect(data.error).toBe("Post does not belong to the specified artist");
    });
  });

  describe("Conversation Creation", () => {
    beforeEach(() => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: "post-123",
        authorId: "artist-123",
        author: { id: "artist-123" },
      });
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.conversation.create as jest.Mock).mockResolvedValue({
        id: "conversation-123",
      });
      (prisma.message.create as jest.Mock).mockResolvedValue({
        id: "message-123",
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: "notification-123",
      });
    });

    it("creates new conversation successfully", async () => {
      const requestData = {
        artistId: "artist-123",
        postId: "post-123",
        price: 100,
        message: "I'm interested in this post for $100. Can we discuss the details?",
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.message).toBe("Conversation created successfully");
      expect(data.conversationId).toBe("conversation-123");
      expect(data.messageId).toBe("message-123");

      expect(prisma.conversation.create).toHaveBeenCalledWith({
        data: {
          title: "Discussion about post",
          isGroup: false,
          members: {
            create: [
              { userId: "user-123" },
              { userId: "artist-123" },
            ],
          },
        },
      });

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          content: requestData.message,
          messageType: "text",
          conversationId: "conversation-123",
          senderId: "user-123",
        },
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          type: "MESSAGE",
          title: "New conversation request",
          message: "Someone is interested in your post and wants to discuss pricing.",
          userId: "artist-123",
          data: {
            conversationId: "conversation-123",
            postId: "post-123",
            price: 100,
          },
        },
      });
    });

    it("uses existing conversation if found", async () => {
      (prisma.conversation.findFirst as jest.Mock).mockResolvedValue({
        id: "existing-conversation-123",
        members: [
          { userId: "user-123" },
          { userId: "artist-123" },
        ],
      });

      const requestData = {
        artistId: "artist-123",
        postId: "post-123",
        price: 100,
        message: "I'm interested",
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(200);
      const data = await result.json();
      expect(data.conversationId).toBe("existing-conversation-123");

      expect(prisma.conversation.create).not.toHaveBeenCalled();
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          content: requestData.message,
          messageType: "text",
          conversationId: "existing-conversation-123",
          senderId: "user-123",
        },
      });
    });
  });

  describe("Error Handling", () => {
    it("returns 500 when database error occurs", async () => {
      (prisma.post.findUnique as jest.Mock).mockRejectedValue(new Error("Database error"));

      const requestData = {
        artistId: "artist-123",
        postId: "post-123",
        price: 100,
        message: "I'm interested",
      };

      const result = await mockCreateConversation(requestData);

      expect(result.status).toBe(500);
      const data = await result.json();
      expect(data.error).toBe("Failed to create conversation");
    });
  });
}); 