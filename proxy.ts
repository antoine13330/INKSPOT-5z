import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/api/auth",
    "/api/register",
    "/_next",
    "/favicon.ico",
    "/manifest.json",
    "/manifest.webmanifest",
    "/sw.js"
  ]

  const { pathname } = request.nextUrl

  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  if (!token) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|css|js|json|webmanifest)).*)",
  ],
}
