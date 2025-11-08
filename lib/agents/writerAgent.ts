import { OpenAI } from 'openai'
import { supabase } from '@/lib/supabaseClient'
import { CoverLetterRequest, AIResponse } from '@/types'

interface UserProfile {
  id: string
  name: string
  email: string
  github_url?: string
  linkedin_url?: string
  resume_url?: string
}

interface Internship {
  id: string
  title: string
  company: string
  location?: string
  description?: string
  requirements?: string
}

export class WriterAgent {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async generateCoverLetter(request: CoverLetterRequest): Promise<AIResponse> {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', request.user_id)
        .single()

      if (userError || !user) {
        throw new Error('User not found')
      }

      // Get internship details
      const { data: internship, error: internshipError } = await supabase
        .from('internships')
        .select('*')
        .eq('id', request.internship_id)
        .single()

      if (internshipError || !internship) {
        throw new Error('Internship not found')
      }

      // Generate cover letter
      const coverLetter = await this.createCoverLetter(
        user,
        internship,
        request.tone || 'professional',
        request.length || 'medium',
        request.custom_points || []
      )

      // Save cover letter to applications table
      await this.saveCoverLetter(request.user_id, request.internship_id, coverLetter)

      // Generate variations for A/B testing
      const variations = await this.generateVariations(user, internship, coverLetter)

      return {
        success: true,
        data: {
          coverLetter,
          variations,
          wordCount: coverLetter.split(' ').length,
          metadata: {
            tone: request.tone || 'professional',
            length: request.length || 'medium',
            customPointsCount: request.custom_points?.length || 0
          }
        }
      }

    } catch (error) {
      console.error('Cover letter generation failed:', error)
      return {
        success: false,
        error: `Failed to generate cover letter: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async createCoverLetter(
    user: UserProfile,
    internship: Internship,
    tone: string,
    length: string,
    customPoints: string[]
  ): Promise<string> {
    try {
      // Extract user information
      const resumeText = await this.extractResumeText(user.resume_url)
      const githubProfile = await this.extractGitHubProfile(user.github_url)

      // Determine letter length guidelines
      const wordCount = length === 'short' ? '200-300' : length === 'long' ? '400-500' : '300-400'

      const prompt = `
        Write a compelling cover letter for the following internship application:

        Applicant Information:
        Name: ${user.name}
        Email: ${user.email}
        Resume Summary: ${resumeText}
        GitHub Profile: ${githubProfile}

        Internship Details:
        Position: ${internship.title}
        Company: ${internship.company}
        Location: ${internship.location || 'Not specified'}
        Job Description: ${internship.description || 'No description provided'}
        Requirements: ${internship.requirements || 'No specific requirements listed'}

        Cover Letter Requirements:
        - Tone: ${tone}
        - Word Count: ${wordCount} words
        - Custom Points to Include: ${customPoints.length > 0 ? customPoints.join(', ') : 'None specified'}

        Guidelines:
        1. Start with a strong opening that grabs attention
        2. Connect the applicant's skills and experience to the specific job requirements
        3. Show genuine interest in the company and position
        4. Include specific examples of relevant projects or achievements
        5. End with a strong call to action
        6. Use ${tone === 'professional' ? 'formal' : tone === 'casual' ? 'friendly but still' : 'enthusiastic and'} language
        7. Make it unique and avoid generic templates
        8. Highlight how the applicant can contribute to the company

        Format the letter professionally with:
        - Applicant's contact information at the top
        - Date
        - Hiring manager information (use generic if not specified)
        - Proper salutation
        - 3-4 well-structured paragraphs
        - Professional closing
        - Signature line

        Make it sound natural and authentic, not robotic.
      `

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert career counselor and professional writer specializing in crafting compelling cover letters. Your letters are authentic, persuasive, and tailored to each specific opportunity."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const coverLetter = response.choices[0].message.content

      if (!coverLetter) {
        throw new Error('No cover letter generated')
      }

      return this.formatCoverLetter(coverLetter, user.name)

    } catch (error) {
      console.error('Error creating cover letter:', error)
      throw new Error('Failed to create cover letter')
    }
  }

  private async generateVariations(
    user: UserProfile,
    internship: Internship,
    originalLetter: string
  ): Promise<string[]> {
    try {
      const variations = []

      // Variation 1: More enthusiastic tone
      const enthusiasticPrompt = `
        Rewrite this cover letter with a more enthusiastic and passionate tone while maintaining professionalism:

        Original Letter:
        ${originalLetter}

        Applicant: ${user.name}
        Position: ${internship.title}
        Company: ${internship.company}

        Make it more energetic and show genuine excitement for the opportunity.
      `

      const enthusiasticResponse = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a career coach who helps candidates show more enthusiasm and passion in their applications."
          },
          {
            role: "user",
            content: enthusiasticPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      })

      if (enthusiasticResponse.choices[0].message.content) {
        variations.push(enthusiasticResponse.choices[0].message.content)
      }

      // Variation 2: More concise version
      const concisePrompt = `
        Create a more concise version of this cover letter (around 200-250 words) while maintaining the key points and impact:

        Original Letter:
        ${originalLetter}

        Focus on the most compelling points and make every word count.
      `

      const conciseResponse = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert editor who specializes in making writing more concise and impactful."
          },
          {
            role: "user",
            content: concisePrompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1500,
      })

      if (conciseResponse.choices[0].message.content) {
        variations.push(conciseResponse.choices[0].message.content)
      }

      return variations

    } catch (error) {
      console.error('Error generating variations:', error)
      return []
    }
  }

  private formatCoverLetter(letter: string, applicantName: string): string {
    // Ensure proper formatting and structure
    let formattedLetter = letter.trim()

    // Add signature if not present
    if (!formattedLetter.includes(applicantName)) {
      formattedLetter += `\n\n${applicantName}`
    }

    // Ensure proper spacing between paragraphs
    formattedLetter = formattedLetter.replace(/\n\s*\n\s*\n/g, '\n\n')

    return formattedLetter
  }

  private async extractResumeText(resumeUrl?: string): Promise<string> {
    if (!resumeUrl) return 'No resume provided'

    try {
      // In a real implementation, this would:
      // 1. Download the resume from Supabase Storage
      // 2. Use a PDF parser to extract text
      // 3. Parse and structure the content

      // Mock implementation for now
      return `Software Engineering student with strong background in web development.
      Experienced in React, Node.js, Python, and cloud technologies.
      Built multiple full-stack applications and contributed to open-source projects.
      Strong problem-solving skills and team collaboration experience.`
    } catch (error) {
      console.error('Error extracting resume text:', error)
      return 'Resume text extraction failed'
    }
  }

  private async extractGitHubProfile(githubUrl?: string): Promise<string> {
    if (!githubUrl) return 'No GitHub profile provided'

    try {
      // Extract username from URL
      const usernameMatch = githubUrl.match(/github\.com\/([^\/]+)/)
      if (!usernameMatch) return 'Invalid GitHub URL'

      const username = usernameMatch[1]

      // In a real implementation, this would use GitHub API
      return `Active GitHub user with contributions to various open-source projects.
      Proficient in modern web technologies and development best practices.
      Strong portfolio of personal projects and collaborative work.`
    } catch (error) {
      console.error('Error extracting GitHub profile:', error)
      return 'GitHub profile extraction failed'
    }
  }

  private async saveCoverLetter(
    userId: string,
    internshipId: string,
    coverLetter: string
  ): Promise<void> {
    try {
      // Check if application already exists
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
        .eq('internship_id', internshipId)
        .single()

      if (existingApplication) {
        // Update existing application
        await supabase
          .from('applications')
          .update({
            cover_letter: coverLetter,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingApplication.id)
      } else {
        // Create new application
        await supabase
          .from('applications')
          .insert({
            user_id: userId,
            internship_id: internshipId,
            status: 'pending',
            cover_letter: coverLetter,
          })
      }
    } catch (error) {
      console.error('Error saving cover letter:', error)
      // Don't throw error - the cover letter was generated successfully
    }
  }

  async optimizeCoverLetter(
    userId: string,
    internshipId: string,
    originalLetter: string,
    feedback: string
  ): Promise<AIResponse> {
    try {
      // Get user and internship context
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const { data: internship } = await supabase
        .from('internships')
        .select('*')
        .eq('id', internshipId)
        .single()

      if (!user || !internship) {
        throw new Error('User or internship not found')
      }

      const optimizationPrompt = `
        Optimize this cover letter based on the provided feedback:

        Original Cover Letter:
        ${originalLetter}

        Feedback:
        ${feedback}

        Applicant: ${user.name}
        Position: ${internship.title}
        Company: ${internship.company}

        Job Description: ${internship.description || 'No description provided'}

        Please:
        1. Address the specific feedback provided
        2. Maintain the letter's strengths
        3. Ensure it better aligns with the job requirements
        4. Keep it professional and authentic
        5. Maintain appropriate length (300-400 words)

        Provide the optimized cover letter without additional explanations.
      `

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert cover letter editor who helps candidates improve their application materials based on feedback."
          },
          {
            role: "user",
            content: optimizationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const optimizedLetter = response.choices[0].message.content

      if (!optimizedLetter) {
        throw new Error('No optimized letter generated')
      }

      // Save the optimized version
      await this.saveCoverLetter(userId, internshipId, optimizedLetter)

      return {
        success: true,
        data: {
          optimizedLetter,
          wordCount: optimizedLetter.split(' ').length,
          improvements: this.identifyImprovements(originalLetter, optimizedLetter, feedback)
        }
      }

    } catch (error) {
      console.error('Cover letter optimization failed:', error)
      return {
        success: false,
        error: `Failed to optimize cover letter: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private identifyImprovements(original: string, optimized: string, feedback: string): string[] {
    const improvements = []

    if (feedback.toLowerCase().includes('length')) {
      improvements.push('Optimized letter length based on feedback')
    }

    if (feedback.toLowerCase().includes('tone')) {
      improvements.push('Adjusted tone to better match requirements')
    }

    if (feedback.toLowerCase().includes('specific')) {
      improvements.push('Added more specific examples and details')
    }

    if (optimized.length !== original.length) {
      improvements.push('Improved word choice and conciseness')
    }

    return improvements
  }

  async getCoverLetterTips(internshipId: string): Promise<AIResponse> {
    try {
      const { data: internship } = await supabase
        .from('internships')
        .select('*')
        .eq('id', internshipId)
        .single()

      if (!internship) {
        throw new Error('Internship not found')
      }

      const tipsPrompt = `
        Provide specific tips for writing a strong cover letter for this internship:

        Position: ${internship.title}
        Company: ${internship.company}
        Description: ${internship.description || 'No description provided'}
        Requirements: ${internship.requirements || 'No specific requirements listed'}

        Provide 5-7 specific, actionable tips that will help candidates write a compelling cover letter for this specific opportunity.
        Focus on what the company is likely looking for and how candidates can best present themselves.
      `

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an experienced career counselor who provides expert advice on cover letter writing."
          },
          {
            role: "user",
            content: tipsPrompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1000,
      })

      const tips = response.choices[0].message.content

      if (!tips) {
        throw new Error('No tips generated')
      }

      return {
        success: true,
        data: {
          tips: tips.split('\n').filter((tip, index, array) =>
            tip.trim() && (index === 0 || tip.trim() !== array[index - 1]?.trim())
          ),
          company: internship.company,
          position: internship.title
        }
      }

    } catch (error) {
      console.error('Error generating tips:', error)
      return {
        success: false,
        error: `Failed to generate tips: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}