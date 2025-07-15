import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  // Mock messages data
  const messages = [
    {
      id: "1",
      content: "Hello! How are you?",
      sender: "user1",
      timestamp: new Date().toISOString(),
      conversationId: "conv1",
    },
    {
      id: "2",
      content: "I'm doing great, thanks!",
      sender: "user2",
      timestamp: new Date().toISOString(),
      conversationId: "conv1",
    },
  ]

  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  try {
    const { content, conversationId, sender } = await request.json()

    // Mock message creation
    const newMessage = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date().toISOString(),
      conversationId,
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to send message" }, { status: 500 })
  }
}
