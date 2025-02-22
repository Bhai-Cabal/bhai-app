import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Add the public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/jobs', "/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // Check for authentication cookie/token
  const isAuthenticated = request.cookies.has('privy-token')

  if (!isAuthenticated) {
    // Redirect to home page if not authenticated
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (static files)
     * 4. /favicon.ico, etc.
     */
    '/((?!api|_next|static|favicon.ico).*)',
  ],
}
