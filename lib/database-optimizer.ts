import { prisma } from './prisma'
import { redisCache } from './redis-cache'

export interface QueryOptimization {
  query: string
  executionTime: number
  rowCount: number
  cacheHit: boolean
  optimizationApplied: string[]
}

export interface DatabaseIndex {
  table: string
  columns: string[]
  type: 'BTREE' | 'HASH' | 'GIN' | 'GIST'
  unique: boolean
}

class DatabaseOptimizer {
  private static instance: DatabaseOptimizer
  private queryStats: Map<string, QueryOptimization> = new Map()
  private indexes: DatabaseIndex[] = []

  private constructor() {
    this.initializeIndexes()
  }

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer()
    }
    return DatabaseOptimizer.instance
  }

  private initializeIndexes() {
    // Define optimal indexes for common queries
    this.indexes = [
      // User indexes
      { table: 'User', columns: ['email'], type: 'BTREE', unique: true },
      { table: 'User', columns: ['name'], type: 'BTREE', unique: false },
      { table: 'User', columns: ['createdAt'], type: 'BTREE', unique: false },
      
      // Post indexes
      { table: 'Post', columns: ['authorId'], type: 'BTREE', unique: false },
      { table: 'Post', columns: ['createdAt'], type: 'BTREE', unique: false },
      { table: 'Post', columns: ['isPublic'], type: 'BTREE', unique: false },
      { table: 'Post', columns: ['title'], type: 'GIN', unique: false },
      { table: 'Post', columns: ['content'], type: 'GIN', unique: false },
      
      // Booking indexes
      { table: 'Booking', columns: ['userId'], type: 'BTREE', unique: false },
      { table: 'Booking', columns: ['proId'], type: 'BTREE', unique: false },
      { table: 'Booking', columns: ['date'], type: 'BTREE', unique: false },
      { table: 'Booking', columns: ['status'], type: 'BTREE', unique: false },
      
      // Message indexes
      { table: 'Message', columns: ['conversationId'], type: 'BTREE', unique: false },
      { table: 'Message', columns: ['senderId'], type: 'BTREE', unique: false },
      { table: 'Message', columns: ['createdAt'], type: 'BTREE', unique: false },
      
      // Notification indexes
      { table: 'Notification', columns: ['userId'], type: 'BTREE', unique: false },
      { table: 'Notification', columns: ['read'], type: 'BTREE', unique: false },
      { table: 'Notification', columns: ['createdAt'], type: 'BTREE', unique: false },
    ]
  }

  // Optimized user queries
  async getUsersWithPagination(page: number = 1, limit: number = 20, filters?: any) {
    const cacheKey = `users:${page}:${limit}:${JSON.stringify(filters || {})}`
    
    return redisCache.cacheQuery(cacheKey, async () => {
      const startTime = Date.now()
      
      const where = this.buildUserWhereClause(filters)
      const skip = (page - 1) * limit
      
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            profile: true,
            _count: {
              select: {
                posts: true,
                bookings: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ])
      
      const executionTime = Date.now() - startTime
      this.recordQueryStats('getUsersWithPagination', executionTime, users.length, true)
      
      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }, 300) // 5 minutes cache
  }

  // Optimized post queries
  async getPostsWithOptimization(filters?: any, page: number = 1, limit: number = 20) {
    const cacheKey = `posts:${page}:${limit}:${JSON.stringify(filters || {})}`
    
    return redisCache.cacheQuery(cacheKey, async () => {
      const startTime = Date.now()
      
      const where = this.buildPostWhereClause(filters)
      const skip = (page - 1) * limit
      
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: {
                  select: {
                    avatar: true,
                    bio: true,
                  },
                },
              },
            },
            tags: true,
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.post.count({ where }),
      ])
      
      const executionTime = Date.now() - startTime
      this.recordQueryStats('getPostsWithOptimization', executionTime, posts.length, true)
      
      return {
        posts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }, 600) // 10 minutes cache
  }

  // Optimized search queries
  async searchWithFullText(query: string, filters?: any, page: number = 1, limit: number = 20) {
    const cacheKey = `search:${query}:${page}:${limit}:${JSON.stringify(filters || {})}`
    
    return redisCache.cacheQuery(cacheKey, async () => {
      const startTime = Date.now()
      
      const searchResults = await Promise.all([
        // Search users
        prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { profile: { bio: { contains: query, mode: 'insensitive' } } },
            ],
            ...filters,
          },
          include: {
            profile: true,
            _count: {
              select: {
                posts: true,
                bookings: true,
              },
            },
          },
          take: limit,
        }),
        
        // Search posts
        prisma.post.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
            ],
            isPublic: true,
            ...filters,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatar: true } },
              },
            },
            tags: true,
          },
          take: limit,
        }),
      ])
      
      const executionTime = Date.now() - startTime
      this.recordQueryStats('searchWithFullText', executionTime, searchResults[0].length + searchResults[1].length, true)
      
      return {
        users: searchResults[0],
        posts: searchResults[1],
        query,
      }
    }, 300) // 5 minutes cache
  }

  // Optimized booking queries
  async getBookingsWithOptimization(userId?: string, filters?: any, page: number = 1, limit: number = 20) {
    const cacheKey = `bookings:${userId}:${page}:${limit}:${JSON.stringify(filters || {})}`
    
    return redisCache.cacheQuery(cacheKey, async () => {
      const startTime = Date.now()
      
      const where = {
        ...(userId && { OR: [{ userId }, { proId: userId }] }),
        ...this.buildBookingWhereClause(filters),
      }
      
      const skip = (page - 1) * limit
      
      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { avatar: true } },
              },
            },
            professional: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: { select: { avatar: true } },
              },
            },
          },
          orderBy: { date: 'desc' },
          skip,
          take: limit,
        }),
        prisma.booking.count({ where }),
      ])
      
      const executionTime = Date.now() - startTime
      this.recordQueryStats('getBookingsWithOptimization', executionTime, bookings.length, true)
      
      return {
        bookings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }, 300) // 5 minutes cache
  }

  // Build optimized where clauses
  private buildUserWhereClause(filters?: any) {
    const where: any = {}
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    
    if (filters?.role) {
      where.role = filters.role
    }
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }
    
    return where
  }

  private buildPostWhereClause(filters?: any) {
    const where: any = { isPublic: true }
    
    if (filters?.authorId) {
      where.authorId = filters.authorId
    }
    
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    
    if (filters?.tags?.length) {
      where.tags = {
        some: {
          name: { in: filters.tags },
        },
      }
    }
    
    if (filters?.dateFrom) {
      where.createdAt = { gte: new Date(filters.dateFrom) }
    }
    
    if (filters?.dateTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) }
    }
    
    return where
  }

  private buildBookingWhereClause(filters?: any) {
    const where: any = {}
    
    if (filters?.status) {
      where.status = filters.status
    }
    
    if (filters?.dateFrom) {
      where.date = { gte: new Date(filters.dateFrom) }
    }
    
    if (filters?.dateTo) {
      where.date = { ...where.date, lte: new Date(filters.dateTo) }
    }
    
    return where
  }

  // Record query statistics
  private recordQueryStats(query: string, executionTime: number, rowCount: number, cacheHit: boolean) {
    const optimization: QueryOptimization = {
      query,
      executionTime,
      rowCount,
      cacheHit,
      optimizationApplied: ['index_scan', 'cache_first', 'selective_include'],
    }
    
    this.queryStats.set(query, optimization)
  }

  // Get query performance statistics
  getQueryStats(): QueryOptimization[] {
    return Array.from(this.queryStats.values())
  }

  // Get slow queries (execution time > 100ms)
  getSlowQueries(): QueryOptimization[] {
    return Array.from(this.queryStats.values()).filter(
      (stat) => stat.executionTime > 100
    )
  }

  // Get database indexes
  getIndexes(): DatabaseIndex[] {
    return this.indexes
  }

  // Analyze query performance
  async analyzeQueryPerformance() {
    const stats = this.getQueryStats()
    const slowQueries = this.getSlowQueries()
    
    const analysis = {
      totalQueries: stats.length,
      averageExecutionTime: stats.reduce((sum, stat) => sum + stat.executionTime, 0) / stats.length,
      cacheHitRate: stats.filter((stat) => stat.cacheHit).length / stats.length,
      slowQueriesCount: slowQueries.length,
      slowQueries: slowQueries.map((stat) => ({
        query: stat.query,
        executionTime: stat.executionTime,
        rowCount: stat.rowCount,
      })),
    }
    
    return analysis
  }

  // Optimize database indexes
  async optimizeIndexes() {
    // This would analyze current query patterns and suggest index optimizations
    const analysis = await this.analyzeQueryPerformance()
    
    const recommendations = []
    
    if (analysis.slowQueriesCount > 0) {
      recommendations.push({
        type: 'index_optimization',
        description: 'Consider adding indexes for slow queries',
        queries: analysis.slowQueries,
      })
    }
    
    if (analysis.cacheHitRate < 0.8) {
      recommendations.push({
        type: 'cache_optimization',
        description: 'Consider increasing cache TTL for frequently accessed data',
        currentHitRate: analysis.cacheHitRate,
      })
    }
    
    return recommendations
  }

  // Batch operations for better performance
  async batchCreateUsers(users: any[]) {
    const startTime = Date.now()
    
    const result = await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    })
    
    const executionTime = Date.now() - startTime
    this.recordQueryStats('batchCreateUsers', executionTime, result.count, false)
    
    return result
  }

  async batchUpdatePosts(posts: { id: string; data: any }[]) {
    const startTime = Date.now()
    
    const results = await Promise.all(
      posts.map((post) =>
        prisma.post.update({
          where: { id: post.id },
          data: post.data,
        })
      )
    )
    
    const executionTime = Date.now() - startTime
    this.recordQueryStats('batchUpdatePosts', executionTime, results.length, false)
    
    return results
  }

  // Connection pooling optimization
  async getConnectionStats() {
    // This would return connection pool statistics
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: 10,
    }
  }
}

export const databaseOptimizer = DatabaseOptimizer.getInstance()

// Export optimized query functions
export const optimizedQueries = {
  getUsers: databaseOptimizer.getUsersWithPagination.bind(databaseOptimizer),
  getPosts: databaseOptimizer.getPostsWithOptimization.bind(databaseOptimizer),
  search: databaseOptimizer.searchWithFullText.bind(databaseOptimizer),
  getBookings: databaseOptimizer.getBookingsWithOptimization.bind(databaseOptimizer),
} 