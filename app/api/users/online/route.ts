import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = "force-dynamic"

// GET /api/users/online - Récupérer la liste des utilisateurs en ligne
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer tous les utilisateurs en ligne
    const onlineUsers = await prisma.user.findMany({
      where: {
        isOnline: true,
        status: 'ACTIVE' // Uniquement les utilisateurs actifs
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        lastActiveAt: true,
        isOnline: true
      }
    })

    // Vérifier que les utilisateurs sont vraiment en ligne (moins de 5 minutes d'inactivité)
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    
    const reallyOnlineUsers = onlineUsers.filter(user => 
      user.lastActiveAt > fiveMinutesAgo
    )

    // Marquer comme hors ligne les utilisateurs inactifs
    const inactiveUserIds = onlineUsers
      .filter(user => user.lastActiveAt <= fiveMinutesAgo)
      .map(user => user.id)

    if (inactiveUserIds.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: inactiveUserIds } },
        data: { isOnline: false }
      })
    }

    return NextResponse.json({
      users: reallyOnlineUsers,
      count: reallyOnlineUsers.length,
      timestamp: now.toISOString()
    })

  } catch (error) {
    console.error('Error getting online users:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// POST /api/users/online - Marquer un utilisateur comme en ligne/hors ligne
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let isOnline: boolean
    
    // Gérer à la fois JSON et FormData
    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      const body = await request.json()
      isOnline = body.isOnline
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      const isOnlineValue = formData.get('isOnline')
      isOnline = isOnlineValue === 'true'
    } else {
      // Fallback: essayer de lire comme JSON
      try {
        const body = await request.json()
        isOnline = body.isOnline
      } catch {
        return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
      }
    }

    if (typeof isOnline !== 'boolean') {
      return NextResponse.json({ error: 'isOnline must be a boolean' }, { status: 400 })
    }

    // Mettre à jour le statut de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isOnline,
        lastActiveAt: new Date()
      },
      select: {
        id: true,
        username: true,
        isOnline: true,
        lastActiveAt: true
      }
    })

    return NextResponse.json({
      user: updatedUser,
      message: `User marked as ${isOnline ? 'online' : 'offline'}`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating user online status:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
