import { NextRequest, NextResponse } from 'next/server'
import { MatcherAgent } from '@/lib/agents/matcherAgent'
import { MatchingPreferences, AIResponse } from '@/types'

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
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
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

    // Apply rate limiting
    if (!rateLimit(ip, 10, 60000)) { // 10 requests per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { user_id, internship_ids, weight_preferences } = body

    // Validate required fields
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate weight preferences
    const defaultPreferences: MatchingPreferences = {
      skills: 0.4,
      experience: 0.3,
      location: 0.2,
      company: 0.1
    }

    let preferences: MatchingPreferences = defaultPreferences
    if (weight_preferences) {
      const total = Object.values(weight_preferences).reduce((sum: number, val: number) => sum + val, 0)

      if (Math.abs(total - 1.0) > 0.1) {
        return NextResponse.json(
          { error: 'Weight preferences must sum to 1.0' },
          { status: 400 }
        )
      }

      preferences = {
        skills: weight_preferences.skills || defaultPreferences.skills,
        experience: weight_preferences.experience || defaultPreferences.experience,
        location: weight_preferences.location || defaultPreferences.location,
        company: weight_preferences.company || defaultPreferences.company
      }
    }

    // Initialize matcher agent
    const matcher = new MatcherAgent()

    // Perform matching
    console.log(`Starting matching for user ${user_id} with ${internship_ids?.length || 'all'} internships`)
    const result: AIResponse = await matcher.matchUserToInternships(
      user_id,
      internship_ids || [],
      preferences
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Matching failed' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      processed: result.metadata?.processed || 0,
      high_matches: result.metadata?.highMatches || 0,
      medium_matches: result.metadata?.mediumMatches || 0,
      low_matches: result.metadata?.lowMatches || 0,
      matches: result.data || [],
      preferences_used: preferences
    })

  } catch (error) {
    console.error('Matching API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during matching' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get matching insights for the user
    const matcher = new MatcherAgent()
    const insightsResult = await matcher.getMatchingInsights(user_id)

    if (!insightsResult.success) {
      return NextResponse.json(
        { error: insightsResult.error || 'Failed to get insights' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      insights: insightsResult.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Matching insights API error:', error)
    return NextResponse.json(
      { error: 'Failed to get matching insights' },
      { status: 500 }
    )
  }
}