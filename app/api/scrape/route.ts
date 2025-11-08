import { NextRequest, NextResponse } from 'next/server'
import { ScraperAgent } from '@/lib/agents/scraperAgent'
import { ScrapingRequest, AIResponse } from '@/types'

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting middleware
function rateLimit(ip: string, limit: number = 5, windowMs: number = 60000): boolean {
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

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

    // Apply rate limiting
    if (!rateLimit(ip, 5, 60000)) { // 5 requests per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await request.json()
    const scrapingRequest: ScrapingRequest = {
      sources: body.sources || ['linkedin', 'indeed', 'glassdoor'],
      keywords: body.keywords || [],
      locations: body.locations || [],
      limit: Math.min(body.limit || 50, 100) // Cap at 100 to prevent abuse
    }

    // Validate inputs
    if (!Array.isArray(scrapingRequest.sources) || scrapingRequest.sources.length === 0) {
      return NextResponse.json(
        { error: 'Invalid sources. Please provide at least one source.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(scrapingRequest.keywords) || scrapingRequest.keywords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid keywords. Please provide at least one keyword.' },
        { status: 400 }
      )
    }

    // Validate sources
    const validSources = ['linkedin', 'indeed', 'glassdoor']
    const invalidSources = scrapingRequest.sources.filter(source => !validSources.includes(source))
    if (invalidSources.length > 0) {
      return NextResponse.json(
        { error: `Invalid sources: ${invalidSources.join(', ')}. Valid sources: ${validSources.join(', ')}` },
        { status: 400 }
      )
    }

    // Initialize scraper agent
    const scraper = new ScraperAgent()

    // Perform scraping
    console.log(`Starting scraping for ${scrapingRequest.keywords.join(', ')} in ${scrapingRequest.locations.join(', ')}`)
    const result: AIResponse = await scraper.scrapeInternships(scrapingRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Scraping failed' },
        { status: 500 }
      )
    }

    // In a real implementation, save results to database
    // await saveInternshipResults(result.data, scrapingRequest)

    // Return success response
    return NextResponse.json({
      success: true,
      scraped: result.metadata?.totalScraped || 0,
      new: result.metadata?.uniqueFound || 0,
      duplicates: (result.metadata?.totalScraped || 0) - (result.metadata?.uniqueFound || 0),
      data: result.data?.slice(0, 10), // Return first 10 for preview
      metadata: result.metadata
    })

  } catch (error) {
    console.error('Scraping API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during scraping' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get scraper status and available sources
    const scraper = new ScraperAgent()
    const statusResult = await scraper.getSourceStatus()

    if (!statusResult.success) {
      return NextResponse.json(
        { error: 'Failed to get scraper status' },
        { status: 500 }
      )
    }

    // Test connection (optional, can be slow)
    const testResult = await scraper.testConnection()

    return NextResponse.json({
      success: true,
      sources: statusResult.data,
      connection: testResult.success ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Scraper status API error:', error)
    return NextResponse.json(
      { error: 'Failed to get scraper status' },
      { status: 500 }
    )
  }
}