import { NextRequest, NextResponse } from 'next/server'
import { WriterAgent } from '@/lib/agents/writerAgent'
import { CoverLetterRequest, AIResponse } from '@/types'

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function rateLimit(ip: string, limit: number = 20, windowMs: number = 60000): boolean {
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

    // Apply rate limiting (cover letters are more expensive)
    if (!rateLimit(ip, 20, 60000)) { // 20 requests per minute
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const coverLetterRequest: CoverLetterRequest = {
      user_id: body.user_id,
      internship_id: body.internship_id,
      tone: body.tone || 'professional',
      length: body.length || 'medium',
      custom_points: body.custom_points || []
    }

    // Validate required fields
    if (!coverLetterRequest.user_id || !coverLetterRequest.internship_id) {
      return NextResponse.json(
        { error: 'User ID and Internship ID are required' },
        { status: 400 }
      )
    }

    // Validate tone
    const validTones = ['professional', 'casual', 'enthusiastic']
    if (!validTones.includes(coverLetterRequest.tone!)) {
      return NextResponse.json(
        { error: `Invalid tone. Valid options: ${validTones.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate length
    const validLengths = ['short', 'medium', 'long']
    if (!validLengths.includes(coverLetterRequest.length!)) {
      return NextResponse.json(
        { error: `Invalid length. Valid options: ${validLengths.join(', ')}` },
        { status: 400 }
      )
    }

    // Initialize writer agent
    const writer = new WriterAgent()

    // Generate cover letter
    console.log(`Generating cover letter for user ${coverLetterRequest.user_id}, internship ${coverLetterRequest.internship_id}`)
    const result: AIResponse = await writer.generateCoverLetter(coverLetterRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Cover letter generation failed' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      cover_letter: result.data?.coverLetter,
      word_count: result.data?.wordCount || 0,
      variations: result.data?.variations || [],
      metadata: result.data?.metadata
    })

  } catch (error) {
    console.error('Cover letter API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during cover letter generation' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const internship_id = searchParams.get('internship_id')

    if (!internship_id) {
      return NextResponse.json(
        { error: 'Internship ID is required' },
        { status: 400 }
      )
    }

    // Get cover letter tips for the internship
    const writer = new WriterAgent()
    const tipsResult = await writer.getCoverLetterTips(internship_id)

    if (!tipsResult.success) {
      return NextResponse.json(
        { error: tipsResult.error || 'Failed to get tips' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tips: tipsResult.data?.tips || [],
      company: tipsResult.data?.company,
      position: tipsResult.data?.position,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cover letter tips API error:', error)
    return NextResponse.json(
      { error: 'Failed to get cover letter tips' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

    // Apply rate limiting
    if (!rateLimit(ip, 10, 60000)) { // 10 requests per minute for optimization
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { user_id, internship_id, original_letter, feedback } = body

    // Validate required fields
    if (!user_id || !internship_id || !original_letter || !feedback) {
      return NextResponse.json(
        { error: 'User ID, Internship ID, original letter, and feedback are required' },
        { status: 400 }
      )
    }

    // Initialize writer agent
    const writer = new WriterAgent()

    // Optimize cover letter
    console.log(`Optimizing cover letter for user ${user_id}, internship ${internship_id}`)
    const result: AIResponse = await writer.optimizeCoverLetter(
      user_id,
      internship_id,
      original_letter,
      feedback
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Cover letter optimization failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      optimized_letter: result.data?.optimizedLetter,
      word_count: result.data?.wordCount || 0,
      improvements: result.data?.improvements || []
    })

  } catch (error) {
    console.error('Cover letter optimization API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during cover letter optimization' },
      { status: 500 }
    )
  }
}