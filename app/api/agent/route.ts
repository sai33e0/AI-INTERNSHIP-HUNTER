import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OrchestratorAgent } from '@/lib/agents/orchestratorAgent'

// Simple in-process rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function rateLimit(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  if (record.count >= limit) return false
  record.count++
  return true
}

/**
 * POST /api/agent
 *
 * Runs the LangGraph multi-agent orchestration workflow.
 *
 * Request body:
 * {
 *   user_id: string        – authenticated user's ID
 *   goal: string           – what the user wants to accomplish
 *   profile?: object       – optional additional profile data to merge in
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const authenticatedSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { authorization: `Bearer ${token}` } } }
    )

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
    if (!rateLimit(ip, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // ── Parse and validate body ───────────────────────────────────────────────
    const body = await request.json()
    const { user_id, goal, profile: extraProfile } = body

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return NextResponse.json({ error: 'goal is required' }, { status: 400 })
    }

    // ── Load user profile from Supabase ───────────────────────────────────────
    const { data: userProfile, error: profileError } = await authenticatedSupabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (profileError) {
      // Non-fatal: proceed with whatever profile info was passed directly
      console.warn('Could not load user profile from DB:', profileError.message)
    }

    const mergedProfile = { ...(userProfile ?? {}), ...(extraProfile ?? {}) }

    // ── Run LangGraph orchestration ───────────────────────────────────────────
    const orchestrator = new OrchestratorAgent()
    const result = await orchestrator.run(user_id, goal.trim(), mergedProfile)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Orchestration failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ...result.data,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('Agent API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during agent orchestration' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agent
 *
 * Returns information about the available LangGraph workflow.
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    name: 'AI Internship Hunter Orchestrator',
    version: '1.0.0',
    framework: 'LangGraph + LangChain + OpenAI',
    nodes: [
      'analyzeProfile',
      'planStrategy',
      'searchInternships',
      'matchInternships',
      'generateCoverLetter',
      'finalize',
    ],
    description:
      'Stateful multi-agent workflow that analyses your profile, devises a ' +
      'search strategy, discovers matching internships, and generates a ' +
      'tailored cover letter – all in a single orchestrated run.',
  })
}
