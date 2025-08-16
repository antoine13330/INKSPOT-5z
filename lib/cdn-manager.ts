import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface CDNConfig {
  provider: 'supabase' | 'aws' | 'cloudflare'
  bucket: string
  region?: string
  domain?: string
  enabled: boolean
}

export interface CDNStats {
  totalFiles: number
  totalSize: number
  bandwidth: number
  requests: number
}

class CDNManager {
  private static instance: CDNManager
  private config: CDNConfig
  private supabase: SupabaseClient | null
  private stats: CDNStats

  private constructor() {
    this.config = {
      provider: 'supabase',
      bucket: 'inkspot-assets',
      enabled: process.env.SUPABASE_URL ? true : false,
    }

    this.stats = {
      totalFiles: 0,
      totalSize: 0,
      bandwidth: 0,
      requests: 0,
    }

    this.supabase = null

    if (this.config.enabled && this.config.provider === 'supabase') {
      this.supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_ANON_KEY || ''
      )
    }
  }

  static getInstance(): CDNManager {
    if (!CDNManager.instance) {
      CDNManager.instance = new CDNManager()
    }
    return CDNManager.instance
  }

  // Upload file to CDN
  async uploadFile(
    file: File | Buffer,
    path: string,
    options?: {
      contentType?: string
      cacheControl?: string
      public?: boolean
    }
  ): Promise<string> {
    if (!this.config.enabled || !this.supabase) {
      throw new Error('CDN is not enabled')
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.config.bucket)
        .upload(path, file, {
          contentType: options?.contentType,
          cacheControl: options?.cacheControl || 'public, max-age=31536000',
          upsert: true,
        })

      if (error) throw error

      const { data: urlData } = this.supabase.storage
        .from(this.config.bucket)
        .getPublicUrl(path)

      this.stats.totalFiles++
      this.stats.totalSize += file instanceof File ? file.size : file.length

      return urlData.publicUrl
    } catch (error) {
      console.error('CDN upload error:', error)
      throw error
    }
  }

  // Get CDN URL for file
  getCDNUrl(path: string): string {
    if (!this.config.enabled) {
      return `/api/assets/${path}`
    }

    if (this.config.provider === 'supabase' && this.supabase) {
      const { data } = this.supabase.storage
        .from(this.config.bucket)
        .getPublicUrl(path)

      return data.publicUrl
    }

    return `${this.config.domain}/${path}`
  }

  // Delete file from CDN
  async deleteFile(path: string): Promise<void> {
    if (!this.config.enabled || !this.supabase) return

    try {
      const { error } = await this.supabase.storage
        .from(this.config.bucket)
        .remove([path])

      if (error) throw error
    } catch (error) {
      console.error('CDN delete error:', error)
      throw error
    }
  }

  // List files in CDN
  async listFiles(prefix?: string): Promise<string[]> {
    if (!this.config.enabled || !this.supabase) return []

    try {
      const { data, error } = await this.supabase.storage
        .from(this.config.bucket)
        .list(prefix || '')

      if (error) throw error

      return data.map((file: any) => file.name)
    } catch (error) {
      console.error('CDN list error:', error)
      return []
    }
  }

  // Get CDN statistics
  async getStats(): Promise<CDNStats> {
    if (!this.config.enabled) {
      return { ...this.stats, totalFiles: 0, totalSize: 0 }
    }

    try {
      const files = await this.listFiles()
      const totalSize = await this.calculateTotalSize(files)

      return {
        ...this.stats,
        totalFiles: files.length,
        totalSize,
      }
    } catch (error) {
      console.error('CDN stats error:', error)
      return this.stats
    }
  }

  // Calculate total size of files
  private async calculateTotalSize(files: string[]): Promise<number> {
    if (!this.supabase) return 0
    
    let totalSize = 0

    for (const file of files) {
      try {
        const { data } = await this.supabase.storage
          .from(this.config.bucket)
          .download(file)

        if (data) {
          totalSize += data.size
        }
      } catch (error) {
        console.error(`Error calculating size for ${file}:`, error)
      }
    }

    return totalSize
  }

  // Optimize image for CDN
  async optimizeImage(
    file: File,
    options?: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png'
    }
  ): Promise<File> {
    // This would integrate with an image optimization service
    // For now, return the original file
    return file
  }

  // Generate optimized image URLs
  generateOptimizedImageUrl(
    originalUrl: string,
    options?: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png'
    }
  ): string {
    if (!options) return originalUrl

    const params = new URLSearchParams()
    if (options.width) params.append('w', options.width.toString())
    if (options.height) params.append('h', options.height.toString())
    if (options.quality) params.append('q', options.quality.toString())
    if (options.format) params.append('f', options.format)

    return `${originalUrl}?${params.toString()}`
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.config.enabled || !this.supabase) return true

    try {
      await this.supabase.storage.from(this.config.bucket).list('', { limit: 1 })
      return true
    } catch (error) {
      console.error('CDN health check failed:', error)
      return false
    }
  }
}

export const cdnManager = CDNManager.getInstance()

// Predefined CDN paths
export const CDN_PATHS = {
  IMAGES: 'images',
  AVATARS: 'avatars',
  POSTS: 'posts',
  DOCUMENTS: 'documents',
  TEMP: 'temp',
} as const

// CDN helpers
export const uploadImage = async (file: File, category = 'images') => {
  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
  const path = `${CDN_PATHS.IMAGES}/${category}/${timestamp}.${extension}`

  return cdnManager.uploadFile(file, path, {
    contentType: file.type,
    public: true,
  })
}

export const uploadAvatar = async (file: File, userId: string) => {
  const extension = file.name.split('.').pop()
  const path = `${CDN_PATHS.AVATARS}/${userId}.${extension}`

  return cdnManager.uploadFile(file, path, {
    contentType: file.type,
    public: true,
  })
}

export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality = 80
) => {
  return cdnManager.generateOptimizedImageUrl(url, {
    width,
    height,
    quality,
    format: 'webp',
  })
} 