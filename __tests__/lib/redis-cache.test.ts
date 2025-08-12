import { redisCache, CACHE_KEYS, cacheUserProfile, cachePosts, cacheSearchResults, cacheStats } from '@/lib/redis-cache'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
  },
}))

describe('RedisCache', () => {
  let mockRedis: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Create a fresh mock Redis instance
    mockRedis = {
      on: jest.fn(),
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      info: jest.fn(),
      ping: jest.fn(),
    }
    
    // Directly replace the Redis instance on the singleton
    ;(redisCache as any).redis = mockRedis
  })

  describe('Cache Configuration', () => {
    it('should initialize with default configuration', () => {
      const cache = redisCache
      expect(cache).toBeDefined()
    })

    it('should handle disabled cache gracefully', () => {
      const originalEnv = process.env.REDIS_URL
      delete process.env.REDIS_URL
      
      // Reset instance to test disabled cache
      ;(redisCache as any).instance = null
      const cache = redisCache
      expect(cache).toBeDefined()
      
      process.env.REDIS_URL = originalEnv
    })
  })

  describe('Cache Operations', () => {
    it('should set cache value', async () => {
      mockRedis.setex.mockResolvedValue('OK')
      
      await redisCache.set('test-key', { data: 'test' })
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'inkspot:test-key',
        3600,
        expect.any(String)
      )
    })

    it('should get cache value', async () => {
      const cachedData = JSON.stringify({ data: 'test' })
      mockRedis.get.mockResolvedValue(cachedData)
      
      const result = await redisCache.get('test-key')
      
      expect(result).toEqual({ data: 'test' })
      expect(mockRedis.get).toHaveBeenCalledWith('inkspot:test-key')
    })

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null)
      
      const result = await redisCache.get('non-existent')
      
      expect(result).toBeNull()
    })

    it('should delete cache key', async () => {
      mockRedis.del.mockResolvedValue(1)
      
      await redisCache.delete('test-key')
      
      expect(mockRedis.del).toHaveBeenCalledWith('inkspot:test-key')
    })

    it('should clear all cache', async () => {
      mockRedis.keys.mockResolvedValue(['inkspot:key1', 'inkspot:key2'])
      mockRedis.del.mockResolvedValue(2)
      
      await redisCache.clear()
      
      expect(mockRedis.keys).toHaveBeenCalledWith('inkspot:*')
      expect(mockRedis.del).toHaveBeenCalledWith('inkspot:key1', 'inkspot:key2')
    })
  })

  describe('Cache Query Decorators', () => {
    it('should cache user profile query', async () => {
      const mockUser = { id: '1', name: 'Test User' }
      mockRedis.get.mockResolvedValue(null) // Cache miss
      mockRedis.setex.mockResolvedValue('OK')
      
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      
      const result = await cacheUserProfile('1')
      
      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { profile: true, bookings: true },
      })
    })

    it('should cache posts query', async () => {
      const mockPosts = [{ id: '1', title: 'Test Post' }]
      mockRedis.get.mockResolvedValue(null) // Cache miss
      mockRedis.setex.mockResolvedValue('OK')
      
      ;(prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts)
      ;(prisma.post.count as jest.Mock).mockResolvedValue(1)
      
      const result = await cachePosts({ authorId: '1' })
      
      expect(result.posts).toEqual(mockPosts)
      expect(result.total).toBe(1)
    })

    it('should cache search results', async () => {
      const mockUsers = [{ id: '1', name: 'Test User' }]
      const mockPosts = [{ id: '1', title: 'Test Post' }]
      mockRedis.get.mockResolvedValue(null) // Cache miss
      mockRedis.setex.mockResolvedValue('OK')
      
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)
      ;(prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts)
      
      const result = await cacheSearchResults('test', { category: 'all' })
      
      expect(result.users).toEqual(mockUsers)
      expect(result.posts).toEqual(mockPosts)
      expect(result.query).toBe('test')
    })

    it('should cache stats query', async () => {
      const mockStats = { userCount: 10, postCount: 20, bookingCount: 5 }
      mockRedis.get.mockResolvedValue(null) // Cache miss
      mockRedis.setex.mockResolvedValue('OK')
      
      ;(prisma.user.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.post.count as jest.Mock).mockResolvedValue(20)
      ;(prisma.booking.count as jest.Mock).mockResolvedValue(5)
      
      const result = await cacheStats()
      
      expect(result.userCount).toBe(10)
      expect(result.postCount).toBe(20)
      expect(result.bookingCount).toBe(5)
    })
  })

  describe('Cache Statistics', () => {
    it('should get cache statistics', async () => {
      mockRedis.info.mockResolvedValue('used_memory_human:50M\n')
      
      const stats = await redisCache.getStats()
      
      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('keys')
      expect(stats).toHaveProperty('memory')
    })

    it('should handle Redis errors gracefully', async () => {
      mockRedis.info.mockRejectedValue(new Error('Redis error'))
      
      const stats = await redisCache.getStats()
      
      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('keys')
      expect(stats).toHaveProperty('memory')
    })
  })

  describe('Health Check', () => {
    it('should return true for successful health check', async () => {
      mockRedis.ping.mockResolvedValue('PONG')
      
      const isHealthy = await redisCache.healthCheck()
      
      expect(isHealthy).toBe(true)
    })

    it('should return false for failed health check', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'))
      
      const isHealthy = await redisCache.healthCheck()
      
      expect(isHealthy).toBe(false)
    })
  })

  describe('Cache Keys', () => {
    it('should have predefined cache keys', () => {
      expect(CACHE_KEYS.USERS).toBe('users')
      expect(CACHE_KEYS.USER_PROFILE).toBe('user:profile:')
      expect(CACHE_KEYS.POSTS).toBe('posts')
      expect(CACHE_KEYS.SEARCH_RESULTS).toBe('search:results:')
      expect(CACHE_KEYS.STATS).toBe('stats')
    })
  })

  describe('Error Handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Connection error'))
      
      // Should not throw error
      await expect(redisCache.set('test', 'value')).resolves.toBeUndefined()
    })

    it('should handle JSON parsing errors', async () => {
      mockRedis.get.mockResolvedValue('invalid-json')
      
      const result = await redisCache.get('test')
      
      expect(result).toBeNull()
    })
  })
}) 