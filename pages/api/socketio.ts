import { NextApiRequest } from "next"
import { getSocketIO, NextApiResponseServerIO } from "@/lib/websocket"

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    if (process.env.NODE_ENV === 'development') {
      console.log("Socket.IO already initialized")
    }
    res.end()
    return
  }

  if (process.env.NODE_ENV === 'development') {
    console.log("Initializing Socket.IO server...")
  }
  
  // Initialize Socket.IO
  const io = getSocketIO(res)
  
  if (process.env.NODE_ENV === 'development') {
    console.log("Socket.IO server initialized successfully")
  }
  res.end()
}

// Disable body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
}