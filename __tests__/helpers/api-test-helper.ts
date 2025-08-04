import { NextRequest } from "next/server";

// Helper function to create a mock request for API route testing
export const createMockRequest = (data: any = {}): NextRequest => {
  const mockRequest = {
    url: data.url || "http://localhost:3000/api/test",
    method: data.method || "POST",
    headers: new Headers(data.headers || {}),
    formData: jest.fn().mockResolvedValue(data.formData || new FormData()),
    json: jest.fn().mockResolvedValue(data.json || {}),
    nextUrl: {
      searchParams: new URLSearchParams(data.searchParams || {}),
    },
  } as unknown as NextRequest;

  return mockRequest;
};

// Helper function to create a mock FormData
export const createMockFormData = (data: Record<string, any>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(item => formData.append(key, item));
    } else {
      formData.append(key, value);
    }
  });
  return formData;
};

// Helper function to create a mock File
export const createMockFile = (name: string, type: string, size: number = 1024): File => {
  return new File([new ArrayBuffer(size)], name, { type });
};

// Helper function to test API routes
export const testApiRoute = async (routePath: string, requestData: any = {}) => {
  try {
    const { POST, GET, PUT, DELETE } = await import(routePath);
    const mockRequest = createMockRequest(requestData);
    
    let result;
    switch (requestData.method || "POST") {
      case "GET":
        result = await GET(mockRequest);
        break;
      case "POST":
        result = await POST(mockRequest);
        break;
      case "PUT":
        result = await PUT(mockRequest);
        break;
      case "DELETE":
        result = await DELETE(mockRequest);
        break;
      default:
        result = await POST(mockRequest);
    }
    
    return result;
  } catch (error) {
    console.error(`Error testing API route ${routePath}:`, error);
    throw error;
  }
};

// Helper function to mock session data
export const mockSession = (sessionData: any = null) => {
  const { getServerSession } = require("next-auth");
  getServerSession.mockResolvedValue(sessionData);
};

// Helper function to mock Prisma responses
export const mockPrisma = (mockData: any) => {
  const { prisma } = require("@/lib/prisma");
  
  Object.entries(mockData).forEach(([model, methods]) => {
    if (prisma[model]) {
      Object.entries(methods).forEach(([method, mockFn]) => {
        prisma[model][method] = jest.fn().mockImplementation(mockFn);
      });
    }
  });
};

// Helper function to reset all mocks
export const resetMocks = () => {
  jest.clearAllMocks();
  jest.resetModules();
}; 