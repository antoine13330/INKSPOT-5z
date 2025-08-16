import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { auditLogger } from '@/lib/audit-logger'
import { validateInput, sanitizeText } from '@/lib/validation'

export interface SecurityConfig {
  rateLimit: {
    windowMs: number
    maxRequests: number
  }
  enableAuditLogging: boolean
  enableCSRF: boolean
  enableXSSProtection: boolean
}

const defaultConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  enableAuditLogging: true,
  enableCSRF: true,
  enableXSSProtection: true,
}

export function createSecurityMiddleware(config: Partial<SecurityConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }

  return async function securityMiddleware(request: NextRequest) {
    const startTime = Date.now()
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const path = request.nextUrl.pathname

    try {
      // 1. Rate Limiting
      const rateLimitResult = rateLimit(
        `${ip}:${path}`,
        finalConfig.rateLimit.maxRequests,
        finalConfig.rateLimit.windowMs
      )

      if (!rateLimitResult.success) {
        await auditLogger.logSecurityEvent({
          action: 'RATE_LIMIT_EXCEEDED',
          resource: path,
          details: { ip, userAgent, limit: finalConfig.rateLimit.maxRequests },
          ipAddress: ip,
          userAgent,
          timestamp: new Date(),
          severity: 'HIGH',
          type: 'SECURITY',
          success: false,
          errorMessage: 'Rate limit exceeded',
        })

        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': '900' } }
        )
      }

      // 2. Input Sanitization for GET parameters
      const url = request.nextUrl.clone()
      const searchParams = url.searchParams

      for (const [key, value] of searchParams.entries()) {
        const sanitizedValue = sanitizeText(value)
        if (sanitizedValue !== value) {
          searchParams.set(key, sanitizedValue)
        }
      }

      // 3. CSRF Protection for state-changing requests
      if (finalConfig.enableCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfToken = request.headers.get('x-csrf-token')
        const sessionToken = request.cookies.get('csrf-token')?.value

        if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
          await auditLogger.logSecurityEvent({
            action: 'CSRF_ATTEMPT',
            resource: path,
            details: { ip, userAgent, method: request.method },
            ipAddress: ip,
            userAgent,
            timestamp: new Date(),
            severity: 'HIGH',
            type: 'SECURITY',
            success: false,
            errorMessage: 'CSRF token validation failed',
          })

          return NextResponse.json(
            { error: 'CSRF token validation failed' },
            { status: 403 }
          )
        }
      }

      // 4. XSS Protection Headers
      const response = NextResponse.next()
      
      if (finalConfig.enableXSSProtection) {
        response.headers.set('X-XSS-Protection', '1; mode=block')
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
        response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;")
      }

      // 5. Audit Logging
      if (finalConfig.enableAuditLogging) {
        const duration = Date.now() - startTime
        
        await auditLogger.logSecurityEvent({
          action: request.method,
          resource: path,
          details: {
            ip,
            userAgent,
            method: request.method,
            duration,
            rateLimitRemaining: rateLimitResult.remaining,
          },
          ipAddress: ip,
          userAgent,
          timestamp: new Date(),
          severity: 'LOW',
          type: 'SYSTEM',
          success: true,
        })
      }

      return response
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Security middleware error:', error)
      }
      
      await auditLogger.logSecurityEvent({
        action: 'SECURITY_ERROR',
        resource: path,
        details: { ip, userAgent, error: error instanceof Error ? error.message : 'Unknown error' },
        ipAddress: ip,
        userAgent,
        timestamp: new Date(),
        severity: 'CRITICAL',
        type: 'SECURITY',
        success: false,
        errorMessage: 'Security middleware error',
      })

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Specific middleware for different route types
export function createAPISecurityMiddleware() {
  return createSecurityMiddleware({
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 50, // Lower limit for API
    },
    enableAuditLogging: true,
    enableCSRF: true,
    enableXSSProtection: true,
  })
}

export function createAuthSecurityMiddleware() {
  return createSecurityMiddleware({
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // Very low limit for auth endpoints
    },
    enableAuditLogging: true,
    enableCSRF: true,
    enableXSSProtection: true,
  })
}

export function createPublicSecurityMiddleware() {
  return createSecurityMiddleware({
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 200, // Higher limit for public pages
    },
    enableAuditLogging: false, // Less logging for public pages
    enableCSRF: false, // No CSRF for GET requests
    enableXSSProtection: true,
  })
} 