import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Note: WebSocket connections should be handled through Socket.IO
    // This endpoint provides WebSocket connection information
    return NextResponse.json({
      message: 'WebSocket connections are handled through Socket.IO',
      socketUrl: '/api/socketio',
      userId: session.user.id
    })
  } catch (error) {
    console.error('WebSocket info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
