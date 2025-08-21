import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Get all environment variables (filtered for security)
    const envVars = Object.keys(process.env).reduce((acc, key) => {
      // Don't expose sensitive values
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
        acc[key] = '***HIDDEN***'
      } else if (key.includes('DATABASE_URL')) {
        acc[key] = process.env[key] ? '***CONFIGURED***' : '***MISSING***'
      } else {
        acc[key] = process.env[key] || '***NOT_SET***'
      }
      return acc
    }, {} as Record<string, string>)

    const debugInfo = {
      status: 'debug',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      platform: process.platform,
      nodeVersion: process.version,
      envVars,
      criticalVars: {
        NODE_ENV: process.env.NODE_ENV || '***MISSING***',
        DATABASE_URL: process.env.DATABASE_URL ? '***CONFIGURED***' : '***MISSING***',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***CONFIGURED***' : '***MISSING***',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || '***MISSING***'
      }
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    console.error('Debug endpoint failed:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
