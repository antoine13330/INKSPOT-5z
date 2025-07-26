import { NextResponse } from "next/server"

export function middleware(req: any) {
  // Protect certain routes that require authentication
  const protectedRoutes = [
    "/conversations",
    "/profile", 
    "/booking",
    "/pro/dashboard",
    "/admin/dashboard",
  ]

  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  )

  // For now, allow all routes but we can add authentication checks later
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
} 