import Redis from 'ioredis'
import { prisma } from './prisma'

export interface CacheConfig {
  ttl: number // Time to live in seconds
  prefix: string
  enabled: boolean
}

export interface CacheStats {
  hits: number
  misses: number
  keys: number
  memory: number
}

class RedisCache {
  private static instance: RedisCache
  private redis: any
  private config: CacheConfig
  private stats: CacheStats

  private constructor() {
    this.config = {
      ttl: 3600, // 1 hour default
      prefix: 'inkspot:',
      enabled: process.env.REDIS_URL ? true : false,
    }

    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      memory: 0,
    }

    if (this.config.enabled) {
      this.redis = new Redis(process.env.REDIS_URL || '', {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      })

      this.redis.on('error', (error: unknown) => {
        console.error('Redis connection error:', error)
      })

      this.redis.on('connect', () => {
        console.log('Redis cache connected')
      })
    } else {
      // In-memory fallback for tests
      const store = new Map<string, { value: string; expiresAt: number | null }>()
      this.redis = {
        on: () => {},
        setex: async (key: string, ttl: number, value: string) => {
          const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : null
          store.set(key, { value, expiresAt })
          return 'OK'
        },
        get: async (key: string) => {
          const item = store.get(key)
          if (!item) return null
          if (item.expiresAt !== null && Date.now() > item.expiresAt) {
            store.delete(key)
            return null
          }
          return item.value
        },
        del: async (...keys: string[]) => {
          let count = 0
          keys.forEach((k) => {
            if (store.delete(k)) count++
          })
          return count
        },
        keys: async (pattern: string) => {
          // Only supports simple prefix pattern like 'inkspot:*'
          if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1)
            return Array.from(store.keys()).filter((k) => k.startsWith(prefix))
          }
          return Array.from(store.keys())
        },
        info: async () => 'used_memory_human:0\n',
        ping: async () => 'PONG',
      }
    }
  }

  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache()
    }
    return RedisCache.instance
  }

  // Generate cache key
  private generateKey(key: string): string {
    return `${this.config.prefix}${key}`
  }

  // Set cache value
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const cacheKey = this.generateKey(key)
      const serializedValue = JSON.stringify(value)
      const finalTtl = ttl || this.config.ttl

      await this.redis.setex(cacheKey, finalTtl, serializedValue)
      this.stats.keys++
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  // Get cache value
  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key)
      const value = await this.redis.get(cacheKey)

      if (value) {
        try {
          const parsed = JSON.parse(value) as T
          this.stats.hits++
          return parsed
        } catch {
          this.stats.misses++
          return null
        }
      } else {
        this.stats.misses++
        return null
      }
    } catch (error) {
      console.error('Redis get error:', error)
      this.stats.misses++
      return null
    }
  }

  // Delete cache key
  async delete(key: string): Promise<void> {
    try {
      const cacheKey = this.generateKey(key)
      await this.redis.del(cacheKey)
      this.stats.keys = Math.max(0, this.stats.keys - 1)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  }

  // Clear all cache
  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.config.prefix}*`)
      if (keys.length > 0) {
        await this.redis.del(...keys)
        this.stats.keys = 0
      }
    } catch (error) {
      console.error('Redis clear error:', error)
    }
  }

  // Get cache statistics
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory')
      const usedMemory = parseInt((info as string).match(/used_memory_human:(\d+)/)?.[1] || '0')

      return {
        ...this.stats,
        memory: usedMemory,
      }
    } catch (error) {
      console.error('Redis stats error:', error)
      return this.stats
    }
  }

  // Cache database queries
  async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Execute query and cache result
    const result = await queryFn()
    await this.set(key, result, ttl)
    return result
  }

  // Invalidate cache by pattern
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.config.prefix}${pattern}`)
      if (keys.length > 0) {
        await this.redis.del(...keys)
        this.stats.keys = Math.max(0, this.stats.keys - keys.length)
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error)
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch (error) {
      console.error('Redis health check failed:', error)
      return false
    }
  }
}

export const redisCache = RedisCache.getInstance()

// Predefined cache keys
export const CACHE_KEYS = {
  USERS: 'users',
  USER_PROFILE: 'user:profile:',
  POSTS: 'posts',
  POST_DETAILS: 'post:details:',
  SEARCH_RESULTS: 'search:results:',
  BOOKINGS: 'bookings',
  BOOKING_DETAILS: 'booking:details:',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages:',
  NOTIFICATIONS: 'notifications:',
  STATS: 'stats',
  METRICS: 'metrics',
} as const

// Cache decorators for common operations
export const cacheUserProfile = async (userId: string) => {
  const key = `${CACHE_KEYS.USER_PROFILE}${userId}`
  return redisCache.cacheQuery(key, () =>
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, bookings: true },
    })
  )
}

export const cachePosts = async (filters?: any) => {
  const key = `${CACHE_KEYS.POSTS}:${JSON.stringify(filters || {})}`
  return redisCache.cacheQuery(key, async () => {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: filters,
        include: { author: true, tags: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where: filters }),
    ])

    return { posts, total }
  })
}

export const cacheSearchResults = async (query: string, filters?: any) => {
  const key = `${CACHE_KEYS.SEARCH_RESULTS}${query}:${JSON.stringify(filters || {})}`
  return redisCache.cacheQuery(key, async () => {
    const [users, posts] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
          ...(filters || {}),
        },
        include: { profile: true },
      }),
      prisma.post.findMany({ where: { title: { contains: query, mode: 'insensitive' } } }),
    ])

    return { users, posts, query }
  })
}

export const cacheStats = async () => {
  const key = CACHE_KEYS.STATS
  return redisCache.cacheQuery(key, async () => {
    const [userCount, postCount, bookingCount] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.booking.count(),
    ])

    return {
      userCount,
      postCount,
      bookingCount,
      timestamp: new Date(),
    }
  }, 300) // 5 minutes TTL for stats
} 