import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cspHeaders } from '@/lib/validation'

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting middleware
function rateLimit(request: NextRequest, limit: number = 100, windowMs: number = 60000): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()

  const record = rateLimitStore.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Cleanup old rate limit records
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, 5 * 60 * 1000) // Cleanup every 5 minutes

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  Object.entries(cspHeaders).forEach(([header, value]) => {
    response.headers.set(header, value)
  })

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Different limits for different endpoints
    let limit = 100 // Default limit
    let windowMs = 60000 // 1 minute

    if (request.nextUrl.pathname.includes('/scrape')) {
      limit = 5 // Scraping is expensive
    } else if (request.nextUrl.pathname.includes('/coverletter')) {
      limit = 20 // Cover letters use OpenAI API
    } else if (request.nextUrl.pathname.includes('/apply')) {
      limit = 5 // Applications are sensitive
    }

    if (!rateLimit(request, limit, windowMs)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }
  }

  // Block suspicious user agents
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i
  ]

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    // Allow legitimate bots from search engines
    const legitimateBots = [
      'googlebot',
      'bingbot',
      'slurp',
      'duckduckbot'
    ]

    if (!legitimateBots.some(bot => userAgent.toLowerCase().includes(bot))) {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }

  // Log API requests for monitoring
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`${request.method} ${request.nextUrl.pathname} - ${request.ip || 'unknown'}`)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}