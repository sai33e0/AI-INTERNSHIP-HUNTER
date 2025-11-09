import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const token = authHeader.replace('Bearer ', '')
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

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
      user_id: user.id,
      internship_id: body.internship_id,
      tone: body.tone || 'professional',
      length: body.length || 'medium',
      custom_points: body.custom_points || []
    }

    // Validate required fields
    if (!coverLetterRequest.internship_id) {
      return NextResponse.json(
        { error: 'Internship ID is required' },
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

    // Initialize writer agent with authenticated client
    const writer = new WriterAgent(authenticatedSupabase)

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
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const token = authHeader.replace('Bearer ', '')
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

    // Apply rate limiting
    if (!rateLimit(ip, 10, 60000)) { // 10 requests per minute for optimization
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { internship_id, original_letter, feedback } = body

    // Validate required fields
    if (!internship_id || !original_letter || !feedback) {
      return NextResponse.json(
        { error: 'Internship ID, original letter, and feedback are required' },
        { status: 400 }
      )
    }

    // Initialize writer agent with authenticated client
    const writer = new WriterAgent(authenticatedSupabase)

    // Optimize cover letter
    console.log(`Optimizing cover letter for user ${user.id}, internship ${internship_id}`)
    const result: AIResponse = await writer.optimizeCoverLetter(
      user.id,
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

    // Save the optimized cover letter
    try {
      // Check if application already exists
      const { data: existingApplication } = await authenticatedSupabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)
        .eq('internship_id', internship_id)
        .single()

      if (existingApplication) {
        // Update existing application
        await authenticatedSupabase
          .from('applications')
          .update({
            cover_letter: result.data?.optimizedLetter,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingApplication.id)
      } else {
        // Create new application
        await authenticatedSupabase
          .from('applications')
          .insert({
            user_id: user.id,
            internship_id: internship_id,
            status: 'pending',
            cover_letter: result.data?.optimizedLetter,
          })
      }
    } catch (saveError) {
      console.error('Error saving optimized cover letter:', saveError)
      // Don't fail the request if saving fails, but log it
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
