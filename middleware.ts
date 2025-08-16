import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Routes publiques (accessibles sans authentification)
  const publicRoutes = [
    "/auth/login",
    "/auth/register",
    "/api/auth", // Pour NextAuth.js
    "/api/register", // Pour l'inscription
    "/_next", // Fichiers statiques Next.js
    "/favicon.ico",
    "/manifest.json",
    "/manifest.webmanifest",
    "/sw.js"
  ]

  const { pathname } = request.nextUrl

  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Si c'est une route publique, laisser passer
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Vérifier si l'utilisateur est authentifié
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Si pas de token (non connecté), rediriger vers login
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url)
    // Sauvegarder l'URL de destination pour redirection après login
    loginUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Si connecté, laisser passer
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - mais on gère les API auth séparément
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets with file extensions (e.g., .png, .jpg, .svg, .css, .js, .json, .webmanifest)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|css|js|json|webmanifest)).*)",
  ],
} 