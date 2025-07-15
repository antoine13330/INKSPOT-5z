import { sendPushNotification, subscribeToPush } from "@/lib/notifications"
import jest from "jest"

// Mock web-push
jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}))

describe("Notifications", () => {
  describe("sendPushNotification", () => {
    it("sends push notification successfully", async () => {
      const mockSubscription = {
        endpoint: "https://example.com/push",
        keys: {
          p256dh: "test-p256dh",
          auth: "test-auth",
        },
      }

      const mockPayload = {
        title: "Test Notification",
        body: "Test message",
        icon: "/icon-192x192.png",
      }

      const webpush = require("web-push")
      webpush.sendNotification.mockResolvedValue({ statusCode: 200 })

      const result = await sendPushNotification(mockSubscription, mockPayload)

      expect(webpush.sendNotification).toHaveBeenCalledWith(mockSubscription, JSON.stringify(mockPayload))
      expect(result).toBe(true)
    })

    it("handles push notification failure", async () => {
      const mockSubscription = {
        endpoint: "https://example.com/push",
        keys: {
          p256dh: "test-p256dh",
          auth: "test-auth",
        },
      }

      const mockPayload = {
        title: "Test Notification",
        body: "Test message",
      }

      const webpush = require("web-push")
      webpush.sendNotification.mockRejectedValue(new Error("Push failed"))

      const result = await sendPushNotification(mockSubscription, mockPayload)

      expect(result).toBe(false)
    })
  })

  describe("subscribeToPush", () => {
    it("validates subscription object", () => {
      const validSubscription = {
        endpoint: "https://example.com/push",
        keys: {
          p256dh: "test-p256dh",
          auth: "test-auth",
        },
      }

      expect(() => subscribeToPush(validSubscription)).not.toThrow()
    })

    it("throws error for invalid subscription", () => {
      const invalidSubscription = {
        endpoint: "https://example.com/push",
        // Missing keys
      }

      expect(() => subscribeToPush(invalidSubscription)).toThrow()
    })
  })
})
