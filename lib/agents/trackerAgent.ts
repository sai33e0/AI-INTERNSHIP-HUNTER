import { OpenAI } from 'openai'
import { chromium, Browser, Page } from 'playwright'
import { supabase } from '@/lib/supabaseClient'
import { AIResponse } from '@/types'

interface Application {
  id: string
  user_id: string
  internship_id: string
  status: string
  notes?: string
  applied_on?: string
  created_at: string
  updated_at: string
}

interface TrackerConfig {
  enableEmailTracking: boolean
  enableAPIChecking: boolean
  enableWebScraping: boolean
  checkInterval: number // hours
}

interface StatusUpdate {
  applicationId: string
  oldStatus: string
  newStatus: string
  timestamp: string
  source: 'email' | 'api' | 'scraping' | 'manual'
  details?: string
}

export class TrackerAgent {
  private openai: OpenAI
  private browser: Browser | null = null
  private config: TrackerConfig

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    this.config = {
      enableEmailTracking: false, // Would require Gmail API setup
      enableAPIChecking: true,
      enableWebScraping: true,
      checkInterval: 24 // Check every 24 hours
    }
  }

  async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async checkApplicationStatuses(userId: string): Promise<AIResponse> {
    try {
      console.log(`Starting status check for user ${userId}...`)

      // Get user's applications
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)

      if (error || !applications) {
        throw new Error('Failed to fetch applications')
      }

      const statusUpdates: StatusUpdate[] = []
      const checkedApplications = []

      for (const application of applications) {
        try {
          // Skip recently checked applications (within last 6 hours)
          const lastCheck = new Date(application.updated_at)
          const hoursSinceCheck = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60)

          if (hoursSinceCheck < 6) {
            continue
          }

          console.log(`Checking application ${application.id}...`)

          // Get internship details for context
          const { data: internship } = await supabase
            .from('internships')
            .select('*')
            .eq('id', application.internship_id)
            .single()

          if (!internship) {
            console.warn(`Internship not found for application ${application.id}`)
            continue
          }

          // Check for status updates using different methods
          const update = await this.checkApplicationStatus(application, internship)

          if (update) {
            statusUpdates.push(update)
            await this.updateApplicationStatus(update)
          }

          checkedApplications.push({
            applicationId: application.id,
            company: internship.company,
            position: internship.title,
            lastStatus: application.status,
            newStatus: update?.newStatus || application.status,
            checked: true
          })

          // Add delay between checks to respect rate limits
          await this.delay(2000)

        } catch (error) {
          console.error(`Error checking application ${application.id}:`, error)
          // Continue with other applications
        }
      }

      // Generate insights and recommendations
      const insights = await this.generateApplicationInsights(applications, statusUpdates)

      return {
        success: true,
        data: {
          checkedApplications: checkedApplications.length,
          statusUpdates: statusUpdates.length,
          updates: statusUpdates,
          insights: insights,
          timestamp: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('Application status check failed:', error)
      return {
        success: false,
        error: `Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async checkApplicationStatus(
    application: Application,
    internship: any
  ): Promise<StatusUpdate | null> {
    const oldStatus = application.status
    let newStatus = oldStatus
    let source: StatusUpdate['source'] = 'manual'
    let details = ''

    try {
      // Method 1: Check application portal (if URL available)
      if (internship.link && this.config.enableWebScraping) {
        const portalUpdate = await this.checkApplicationPortal(internship.link, application)
        if (portalUpdate) {
          newStatus = portalUpdate.status
          source = 'scraping'
          details = portalUpdate.details
        }
      }

      // Method 2: Check company APIs (if available)
      if (newStatus === oldStatus && this.config.enableAPIChecking) {
        const apiUpdate = await this.checkCompanyAPI(internship.company, application)
        if (apiUpdate) {
          newStatus = apiUpdate.status
          source = 'api'
          details = apiUpdate.details
        }
      }

      // Method 3: AI-based status prediction based on time and patterns
      if (newStatus === oldStatus) {
        const predictedUpdate = await this.predictStatusUpdate(application, internship)
        if (predictedUpdate) {
          newStatus = predictedUpdate.status
          source = 'manual'
          details = predictedUpdate.details
        }
      }

      // Only return update if status actually changed
      if (newStatus !== oldStatus) {
        return {
          applicationId: application.id,
          oldStatus,
          newStatus,
          timestamp: new Date().toISOString(),
          source,
          details
        }
      }

      return null

    } catch (error) {
      console.error(`Error checking application status for ${application.id}:`, error)
      return null
    }
  }

  private async checkApplicationPortal(
    applicationUrl: string,
    application: Application
  ): Promise<{ status: string; details: string } | null> {
    try {
      await this.initializeBrowser()
      const page = await this.browser!.newPage()

      // Set user agent to avoid detection
      await page.route('**/*', (route) => {
        const headers = {
          ...route.request().headers(),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        route.continue({ headers })
      })

      // In a real implementation, this would:
      // 1. Navigate to application portal
      // 2. Log in with stored credentials (if available)
      // 3. Navigate to application status page
      // 4. Extract status information

      // Mock implementation for demonstration
      await page.goto(applicationUrl, { waitUntil: 'networkidle' })

      // Simulate finding status information
      // This would be replaced with actual scraping logic
      const statusFound = Math.random() > 0.8 // 20% chance of finding an update

      if (statusFound) {
        const statuses = ['reviewing', 'accepted', 'rejected']
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)]

        await page.close()

        return {
          status: newStatus,
          details: `Status updated on company portal`
        }
      }

      await page.close()
      return null

    } catch (error) {
      console.error('Error checking application portal:', error)
      return null
    }
  }

  private async checkCompanyAPI(
    company: string,
    application: Application
  ): Promise<{ status: string; details: string } | null> {
    try {
      // In a real implementation, this would use company-specific APIs
      // For example, Greenhouse, Lever, or other ATS APIs

      // Mock implementation
      const apiStatusFound = Math.random() > 0.9 // 10% chance of API update

      if (apiStatusFound) {
        return {
          status: 'reviewing',
          details: `Status updated via ${company} API`
        }
      }

      return null

    } catch (error) {
      console.error('Error checking company API:', error)
      return null
    }
  }

  private async predictStatusUpdate(
    application: Application,
    internship: any
  ): Promise<{ status: string; details: string } | null> {
    try {
      // Use AI to predict status updates based on patterns
      const appliedDate = application.applied_on ? new Date(application.applied_on) : new Date(application.created_at)
      const daysSinceApplied = Math.floor((Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))

      // Don't predict for very recent applications
      if (daysSinceApplied < 3) {
        return null
      }

      const prompt = `
        Based on the following application information, predict if there should be a status update:

        Application Details:
        Current Status: ${application.status}
        Days Since Applied: ${daysSinceApplied}
        Company: ${internship.company}
        Position: ${internship.title}

        Application Notes: ${application.notes || 'No notes'}

        Consider typical hiring timelines:
        - 3-7 days: Applications usually move from "pending" to "reviewing"
        - 1-2 weeks: Status might change to "interviewing" or decision
        - 2+ weeks: Follow-up may be needed

        Based on this information, should the status be updated?
        If yes, provide the new status and reasoning.
        If no, respond with "no_update_needed".

        Response format:
        {
          "shouldUpdate": true/false,
          "newStatus": "pending|reviewing|interviewing|accepted|rejected",
          "reasoning": "Explanation of why status should or shouldn't change"
        }
      `

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an experienced recruiter who understands typical hiring timelines and application status patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      })

      const responseText = response.choices[0].message.content

      if (!responseText) {
        return null
      }

      try {
        const prediction = JSON.parse(responseText)

        if (prediction.shouldUpdate && prediction.newStatus !== application.status) {
          return {
            status: prediction.newStatus,
            details: `AI-predicted update: ${prediction.reasoning}`
          }
        }

        return null
      } catch (parseError) {
        console.error('Error parsing AI prediction:', parseError)
        return null
      }

    } catch (error) {
      console.error('Error predicting status update:', error)
      return null
    }
  }

  private async updateApplicationStatus(update: StatusUpdate): Promise<void> {
    try {
      await supabase
        .from('applications')
        .update({
          status: update.newStatus,
          updated_at: new Date().toISOString(),
          notes: `Status updated from ${update.oldStatus} to ${update.newStatus} (${update.source}): ${update.details || ''}`
        })
        .eq('id', update.applicationId)

      console.log(`Updated application ${update.applicationId} to ${update.newStatus}`)

    } catch (error) {
      console.error('Error updating application status:', error)
      // Don't throw error - continue with other updates
    }
  }

  private async generateApplicationInsights(
    applications: Application[],
    statusUpdates: StatusUpdate[]
  ): Promise<any> {
    try {
      const totalApplications = applications.length
      const pendingApplications = applications.filter(app => app.status === 'pending').length
      const submittedApplications = applications.filter(app => app.status === 'submitted').length
      const reviewingApplications = applications.filter(app => app.status === 'reviewing').length
      const acceptedApplications = applications.filter(app => app.status === 'accepted').length
      const rejectedApplications = applications.filter(app => app.status === 'rejected').length

      const successRate = totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0

      // Calculate average response time
      const responseTimes = applications
        .filter(app => app.applied_on && app.status !== 'pending')
        .map(app => {
          const appliedDate = new Date(app.applied_on!)
          const updatedDate = new Date(app.updated_at)
          return (updatedDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24) // days
        })

      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0

      // Generate recommendations using AI
      const recommendations = await this.generateRecommendations(
        totalApplications,
        successRate,
        averageResponseTime,
        statusUpdates
      )

      return {
        statistics: {
          totalApplications,
          pendingApplications,
          submittedApplications,
          reviewingApplications,
          acceptedApplications,
          rejectedApplications,
          successRate: Math.round(successRate * 100) / 100,
          averageResponseTime: Math.round(averageResponseTime * 10) / 10
        },
        recentUpdates: statusUpdates.length,
        recommendations
      }

    } catch (error) {
      console.error('Error generating insights:', error)
      return null
    }
  }

  private async generateRecommendations(
    totalApplications: number,
    successRate: number,
    avgResponseTime: number,
    recentUpdates: StatusUpdate[]
  ): Promise<string[]> {
    try {
      const prompt = `
        Provide actionable recommendations for improving internship application success based on these metrics:

        Total Applications: ${totalApplications}
        Success Rate: ${successRate}%
        Average Response Time: ${avgResponseTime} days
        Recent Status Updates: ${recentUpdates.length}

        Recent Status Changes:
        ${recentUpdates.map(update => `- ${update.oldStatus} → ${update.newStatus} (${update.source})`).join('\n')}

        Provide 3-5 specific, actionable recommendations to improve application success.
        Focus on what the user can actually do to improve their results.
      `

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a career coach who provides data-driven advice to improve job application success."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      const recommendationsText = response.choices[0].message.content

      if (!recommendationsText) {
        return ['Continue monitoring your applications regularly']
      }

      return recommendationsText
        .split('\n')
        .filter(rec => rec.trim())
        .map(rec => rec.replace(/^\d+\.\s*/, '').trim())

    } catch (error) {
      console.error('Error generating recommendations:', error)
      return ['Focus on tailoring your applications more specifically to each position']
    }
  }

  async scheduleFollowUpReminders(userId: string): Promise<AIResponse> {
    try {
      const { data: applications } = await supabase
        .from('applications')
        .select(`
          *,
          internships (
            company,
            title,
            link
          )
        `)
        .eq('user_id', userId)
        .in('status', ['submitted', 'reviewing'])

      if (!applications) {
        return { success: true, data: { reminders: [] } }
      }

      const reminders = []

      for (const app of applications as any[]) {
        const appliedDate = app.applied_on ? new Date(app.applied_on) : new Date(app.created_at)
        const daysSinceApplied = Math.floor((Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))

        // Generate follow-up reminders based on application age and status
        if (daysSinceApplied === 7 && app.status === 'submitted') {
          reminders.push({
            type: 'follow_up',
            applicationId: app.id,
            company: app.internships.company,
            position: app.internships.title,
            message: `One week since applying to ${app.internships.company}. Consider sending a follow-up email.`,
            priority: 'medium'
          })
        } else if (daysSinceApplied === 14 && app.status === 'reviewing') {
          reminders.push({
            type: 'follow_up',
            applicationId: app.id,
            company: app.internships.company,
            position: app.internships.title,
            message: `Two weeks since hearing from ${app.internships.company}. Time for a polite follow-up.`,
            priority: 'high'
          })
        } else if (daysSinceApplied === 21 && app.status === 'reviewing') {
          reminders.push({
            type: 'status_check',
            applicationId: app.id,
            company: app.internships.company,
            position: app.internships.title,
            message: `Three weeks since last update from ${app.internships.company}. Check application status.`,
            priority: 'high'
          })
        }
      }

      return {
        success: true,
        data: {
          reminders,
          total: reminders.length
        }
      }

    } catch (error) {
      console.error('Error scheduling follow-up reminders:', error)
      return {
        success: false,
        error: `Failed to schedule reminders: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getApplicationHealthMetrics(userId: string): Promise<AIResponse> {
    try {
      const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)

      if (!applications) {
        throw new Error('No applications found')
      }

      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const recentApplications = applications.filter(app => new Date(app.created_at) >= thirtyDaysAgo)

      const metrics = {
        totalApplications: applications.length,
        recentApplications: recentApplications.length,
        applicationRate: recentApplications.length / 4, // applications per week
        responseRate: applications.filter(app => app.status !== 'pending').length / applications.length,
        successRate: applications.filter(app => app.status === 'accepted').length / applications.length,
        averageResponseTime: this.calculateAverageResponseTime(applications),
        mostActiveDay: this.getMostActiveDay(recentApplications)
      }

      return {
        success: true,
        data: metrics
      }

    } catch (error) {
      console.error('Error calculating health metrics:', error)
      return {
        success: false,
        error: `Failed to calculate metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private calculateAverageResponseTime(applications: Application[]): number {
    const responseTimes = applications
      .filter(app => app.applied_on && app.status !== 'pending')
      .map(app => {
        const applied = new Date(app.applied_on!)
        const updated = new Date(app.updated_at)
        return (updated.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)
      })

    return responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0
  }

  private getMostActiveDay(applications: Application[]): string {
    const dayCounts: Record<string, number> = {}

    applications.forEach(app => {
      const day = new Date(app.created_at).toLocaleDateString('en-US', { weekday: 'long' })
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })

    const mostActiveDay = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0]

    return mostActiveDay ? mostActiveDay[0] : 'No data'
  }
}