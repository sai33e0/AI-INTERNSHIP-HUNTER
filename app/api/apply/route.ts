import { NextRequest, NextResponse } from 'next/server'
import { chromium, Browser, Page } from 'playwright'
import { supabase } from '@/lib/supabaseClient'
import { AIResponse } from '@/types'

interface ApplicationRequest {
  user_id: string
  internship_id: string
  auto_apply?: boolean
  resume_path?: string
  cover_letter_path?: string
  additional_info?: Record<string, any>
}

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

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
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

    // Apply strict rate limiting for applications
    if (!rateLimit(ip, 5, 60000)) { // 5 applications per minute
      return NextResponse.json(
        { error: 'Too many application attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const applicationRequest: ApplicationRequest = {
      user_id: body.user_id,
      internship_id: body.internship_id,
      auto_apply: body.auto_apply || false,
      resume_path: body.resume_path,
      cover_letter_path: body.cover_letter_path,
      additional_info: body.additional_info || {}
    }

    // Validate required fields
    if (!applicationRequest.user_id || !applicationRequest.internship_id) {
      return NextResponse.json(
        { error: 'User ID and Internship ID are required' },
        { status: 400 }
      )
    }

    // Get user and internship details
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', applicationRequest.user_id)
      .single()

    const { data: internship } = await supabase
      .from('internships')
      .select('*')
      .eq('id', applicationRequest.internship_id)
      .single()

    if (!user || !internship) {
      return NextResponse.json(
        { error: 'User or internship not found' },
        { status: 404 }
      )
    }

    // Check if application already exists
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', applicationRequest.user_id)
      .eq('internship_id', applicationRequest.internship_id)
      .single()

    if (existingApplication && existingApplication.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application already submitted' },
        { status: 400 }
      )
    }

    let applicationResult: AIResponse

    if (applicationRequest.auto_apply) {
      // Automated application
      applicationResult = await submitAutomatedApplication(
        user,
        internship,
        applicationRequest
      )
    } else {
      // Manual application tracking
      applicationResult = await trackManualApplication(
        user,
        internship,
        applicationRequest
      )
    }

    if (!applicationResult.success) {
      return NextResponse.json(
        { error: applicationResult.error || 'Application submission failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application_id: applicationResult.data?.applicationId,
      status: applicationResult.data?.status,
      method: applicationRequest.auto_apply ? 'automated' : 'manual',
      submitted_at: applicationResult.data?.submittedAt,
      details: applicationResult.data?.details
    })

  } catch (error) {
    console.error('Application API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during application submission' },
      { status: 500 }
    )
  }
}

async function submitAutomatedApplication(
  user: any,
  internship: any,
  request: ApplicationRequest
): Promise<AIResponse> {
  let browser: Browser | null = null

  try {
    console.log(`Starting automated application for ${user.name} to ${internship.title} at ${internship.company}`)

    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    // Navigate to application page
    if (!internship.link) {
      throw new Error('No application link available')
    }

    await page.goto(internship.link, { waitUntil: 'networkidle' })

    // Check if it's a known application portal (LinkedIn, Indeed, etc.)
    const portalType = detectApplicationPortal(page.url())

    let applicationSuccess = false
    let details = ''

    switch (portalType) {
      case 'linkedin':
        const linkedinResult = await applyViaLinkedIn(page, user, internship, request)
        applicationSuccess = linkedinResult.success
        details = linkedinResult.details
        break

      case 'indeed':
        const indeedResult = await applyViaIndeed(page, user, internship, request)
        applicationSuccess = indeedResult.success
        details = indeedResult.details
        break

      default:
        // Generic application attempt
        const genericResult = await applyViaGenericPortal(page, user, internship, request)
        applicationSuccess = genericResult.success
        details = genericResult.details
        break
    }

    await browser.close()

    if (!applicationSuccess) {
      throw new Error(details || 'Automated application failed')
    }

    // Record successful application in database
    const { data: applicationRecord } = await supabase
      .from('applications')
      .insert({
        user_id: request.user_id,
        internship_id: request.internship_id,
        status: 'submitted',
        applied_on: new Date().toISOString(),
        notes: `Automated application submitted: ${details}`
      })
      .select()
      .single()

    return {
      success: true,
      data: {
        applicationId: applicationRecord.id,
        status: 'submitted',
        submittedAt: applicationRecord.applied_on,
        details
      }
    }

  } catch (error) {
    if (browser) {
      await browser.close()
    }
    throw error
  }
}

async function trackManualApplication(
  user: any,
  internship: any,
  request: ApplicationRequest
): Promise<AIResponse> {
  try {
    console.log(`Tracking manual application for ${user.name} to ${internship.title} at ${internship.company}`)

    // Create or update application record
    const { data: applicationRecord } = await supabase
      .from('applications')
      .upsert({
        user_id: request.user_id,
        internship_id: request.internship_id,
        status: 'submitted',
        applied_on: new Date().toISOString(),
        notes: 'Manual application submitted'
      })
      .select()
      .single()

    return {
      success: true,
      data: {
        applicationId: applicationRecord.id,
        status: 'submitted',
        submittedAt: applicationRecord.applied_on,
        details: 'Manual application tracked successfully'
      }
    }

  } catch (error) {
    throw new Error(`Failed to track manual application: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function detectApplicationPortal(url: string): string {
  if (url.includes('linkedin.com')) return 'linkedin'
  if (url.includes('indeed.com')) return 'indeed'
  if (url.includes('glassdoor.com')) return 'glassdoor'
  return 'generic'
}

async function applyViaLinkedIn(
  page: Page,
  user: any,
  internship: any,
  request: ApplicationRequest
): Promise<{ success: boolean; details: string }> {
  try {
    // Look for "Easy Apply" button
    const easyApplyButton = await page.$('[data-control-name="apply"]')

    if (easyApplyButton) {
      await easyApplyButton.click()
      await page.waitForTimeout(2000)

      // Fill out application form
      await fillApplicationForm(page, user, request)

      // Submit application
      const submitButton = await page.$('[aria-label="Submit application"]')
      if (submitButton) {
        await submitButton.click()
        await page.waitForTimeout(3000)

        // Check for success message
        const successMessage = await page.$('.artdeco-toast-item')

        if (successMessage) {
          return {
            success: true,
            details: 'Applied via LinkedIn Easy Apply'
          }
        }
      }
    }

    return {
      success: false,
      details: 'LinkedIn Easy Apply not available or failed'
    }

  } catch (error) {
    return {
      success: false,
      details: `LinkedIn application failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function applyViaIndeed(
  page: Page,
  user: any,
  internship: any,
  request: ApplicationRequest
): Promise<{ success: boolean; details: string }> {
  try {
    // Look for "Apply Now" button
    const applyButton = await page.$('[data-testid="apply-button"]')

    if (applyButton) {
      await applyButton.click()
      await page.waitForTimeout(2000)

      // Fill out Indeed application form
      await fillIndeedApplicationForm(page, user, request)

      // Submit application
      const submitButton = await page.$('[data-testid="form-submit"]')
      if (submitButton) {
        await submitButton.click()
        await page.waitForTimeout(3000)

        // Check for success confirmation
        const successElement = await page.$('.apply-success-message')

        if (successElement) {
          return {
            success: true,
            details: 'Applied via Indeed'
          }
        }
      }
    }

    return {
      success: false,
      details: 'Indeed application form not available or failed'
    }

  } catch (error) {
    return {
      success: false,
      details: `Indeed application failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function applyViaGenericPortal(
  page: Page,
  user: any,
  internship: any,
  request: ApplicationRequest
): Promise<{ success: boolean; details: string }> {
  try {
    // Look for common application form elements
    const submitButton = await page.$('button[type="submit"], input[type="submit"], .apply-button, .submit-application')

    if (submitButton) {
      // Fill in common form fields
      await fillGenericApplicationForm(page, user, request)

      // Attempt to submit
      await submitButton.click()
      await page.waitForTimeout(3000)

      // Check for success indicators
      const successIndicators = [
        '.success-message',
        '.application-success',
        '.thank-you',
        '[data-testid="success"]',
        '.confirmation'
      ]

      for (const selector of successIndicators) {
        const successElement = await page.$(selector)
        if (successElement) {
          return {
            success: true,
            details: 'Applied via generic portal'
          }
        }
      }
    }

    return {
      success: false,
      details: 'Generic application form not detected or submission failed'
    }

  } catch (error) {
    return {
      success: false,
      details: `Generic application failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

async function fillApplicationForm(
  page: Page,
  user: any,
  request: ApplicationRequest
): Promise<void> {
  try {
    // Fill email field
    const emailField = await page.$('input[type="email"]')
    if (emailField) {
      await emailField.fill(user.email)
    }

    // Fill name field
    const nameField = await page.$('input[name*="name"], input[placeholder*="name"]')
    if (nameField) {
      await nameField.fill(user.name)
    }

    // Fill phone field (if available)
    const phoneField = await page.$('input[type="tel"], input[name*="phone"]')
    if (phoneField && request.additional_info?.phone) {
      await phoneField.fill(request.additional_info.phone)
    }

    // Upload resume (if path provided and file input available)
    if (request.resume_path) {
      const resumeInput = await page.$('input[type="file"][accept*="pdf"], input[type="file"][accept*="doc"]')
      if (resumeInput) {
        await resumeInput.setInputFiles(request.resume_path)
      }
    }

    // Add cover letter (if provided)
    if (request.cover_letter_path) {
      const coverLetterInput = await page.$('textarea[name*="cover"], textarea[placeholder*="cover"]')
      if (coverLetterInput) {
        // In a real implementation, you'd read the cover letter file
        await coverLetterInput.fill('Cover letter attached')
      }
    }

  } catch (error) {
    console.warn('Error filling application form:', error)
    // Continue even if some fields fail
  }
}

async function fillIndeedApplicationForm(
  page: Page,
  user: any,
  request: ApplicationRequest
): Promise<void> {
  // Indeed-specific form filling logic
  await fillApplicationForm(page, user, request)
}

async function fillGenericApplicationForm(
  page: Page,
  user: any,
  request: ApplicationRequest
): Promise<void> {
  // Generic form filling logic
  await fillApplicationForm(page, user, request)
}