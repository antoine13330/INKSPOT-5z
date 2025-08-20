import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Next.js App Router dynamic params are async
    const { id } = await context.params
    const userId = id
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        isOnline: true,
        lastActiveAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Vérifier si l'utilisateur est vraiment en ligne (moins de 5 minutes d'inactivité)
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const isReallyOnline = user.isOnline && user.lastActiveAt > fiveMinutesAgo

    // Si l'utilisateur est marqué en ligne mais inactif, le marquer comme hors ligne
    if (user.isOnline && !isReallyOnline) {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false }
      })
    }
    
    return NextResponse.json({
      userId: userId,
      username: user.username,
      isOnline: isReallyOnline,
      lastActiveAt: user.lastActiveAt.toISOString(),
      timestamp: now.toISOString()
    })
    
  } catch (error) {
    console.error('Error getting user online status:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
