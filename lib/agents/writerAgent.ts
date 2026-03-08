import { ChatOpenAI } from '@langchain/openai'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { CoverLetterRequest, AIResponse } from '@/types'

const CHAT_MODEL = 'gpt-4o-mini'

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
  private model: ChatOpenAI
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.model = this.buildModel(0.7)
    this.supabase = supabaseClient || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  private buildModel(temperature: number): ChatOpenAI {
    return new ChatOpenAI({
      model: CHAT_MODEL,
      temperature,
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async generateCoverLetter(request: CoverLetterRequest): Promise<AIResponse> {
    try {
      // Get user profile
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', request.user_id)
        .single()

      if (userError || !user) {
        throw new Error('User not found')
      }

      // Get internship details
      const { data: internship, error: internshipError } = await this.supabase
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
      const toneStyle = tone === 'professional' ? 'formal' : tone === 'casual' ? 'friendly but still professional' : 'enthusiastic and passionate'

      const parser = new StringOutputParser()

      const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          'You are an expert career counselor and professional writer specializing in ' +
          'crafting compelling cover letters. Your letters are authentic, persuasive, ' +
          'and tailored to each specific opportunity.'
        ),
        HumanMessagePromptTemplate.fromTemplate(
          'Write a compelling cover letter for the following internship application:\n\n' +
          'Applicant Information:\n' +
          'Name: {name}\nEmail: {email}\n' +
          'Resume Summary: {resumeText}\nGitHub Profile: {githubProfile}\n\n' +
          'Internship Details:\n' +
          'Position: {title}\nCompany: {company}\n' +
          'Location: {location}\nJob Description: {description}\nRequirements: {requirements}\n\n' +
          'Cover Letter Requirements:\n' +
          '- Tone: {tone} ({toneStyle} language)\n' +
          '- Word Count: {wordCount} words\n' +
          '- Custom Points to Include: {customPoints}\n\n' +
          'Guidelines:\n' +
          '1. Start with a strong opening that grabs attention\n' +
          '2. Connect the applicant\'s skills and experience to the specific job requirements\n' +
          '3. Show genuine interest in the company and position\n' +
          '4. Include specific examples of relevant projects or achievements\n' +
          '5. End with a strong call to action\n' +
          '6. Make it unique and avoid generic templates\n\n' +
          'Format the letter professionally with proper structure and signature.'
        ),
      ])

      const chain = prompt.pipe(this.model).pipe(parser)

      const coverLetter = await chain.invoke({
        name: user.name,
        email: user.email,
        resumeText,
        githubProfile,
        title: internship.title,
        company: internship.company,
        location: internship.location || 'Not specified',
        description: internship.description || 'No description provided',
        requirements: internship.requirements || 'No specific requirements listed',
        tone,
        toneStyle,
        wordCount,
        customPoints: customPoints.length > 0 ? customPoints.join(', ') : 'None specified',
      })

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
      const parser = new StringOutputParser()
      const variations: string[] = []

      // Variation 1: More enthusiastic tone
      const enthusiasticPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          'You are a career coach who helps candidates show more enthusiasm and passion in their applications.'
        ),
        HumanMessagePromptTemplate.fromTemplate(
          'Rewrite this cover letter with a more enthusiastic and passionate tone while maintaining professionalism.\n\n' +
          'Original Letter:\n{originalLetter}\n\n' +
          'Applicant: {name}\nPosition: {title}\nCompany: {company}\n\n' +
          'Make it more energetic and show genuine excitement for the opportunity.'
        ),
      ])

      const enthusiasticChain = enthusiasticPrompt.pipe(
        this.buildModel(0.8)
      ).pipe(parser)

      const enthusiasticVersion = await enthusiasticChain.invoke({
        originalLetter,
        name: user.name,
        title: internship.title,
        company: internship.company,
      })
      if (enthusiasticVersion) variations.push(enthusiasticVersion)

      // Variation 2: More concise version
      const concisePrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          'You are an expert editor who specializes in making writing more concise and impactful.'
        ),
        HumanMessagePromptTemplate.fromTemplate(
          'Create a more concise version of this cover letter (around 200-250 words) ' +
          'while maintaining the key points and impact:\n\n' +
          'Original Letter:\n{originalLetter}\n\n' +
          'Focus on the most compelling points and make every word count.'
        ),
      ])

      const conciseChain = concisePrompt.pipe(
        this.buildModel(0.6)
      ).pipe(parser)

      const conciseVersion = await conciseChain.invoke({ originalLetter })
      if (conciseVersion) variations.push(conciseVersion)

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
      const { data: existingApplication } = await this.supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
        .eq('internship_id', internshipId)
        .single()

      if (existingApplication) {
        // Update existing application
        await this.supabase
          .from('applications')
          .update({
            cover_letter: coverLetter,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingApplication.id)
      } else {
        // Create new application
        await this.supabase
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
      const { data: user } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const { data: internship } = await this.supabase
        .from('internships')
        .select('*')
        .eq('id', internshipId)
        .single()

      if (!user || !internship) {
        throw new Error('User or internship not found')
      }

      const parser = new StringOutputParser()

      const optimizationPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          'You are an expert cover letter editor who helps candidates improve their ' +
          'application materials based on feedback.'
        ),
        HumanMessagePromptTemplate.fromTemplate(
          'Optimize this cover letter based on the provided feedback:\n\n' +
          'Original Cover Letter:\n{originalLetter}\n\n' +
          'Feedback:\n{feedback}\n\n' +
          'Applicant: {name}\nPosition: {title}\nCompany: {company}\n\n' +
          'Job Description: {description}\n\n' +
          'Please:\n' +
          '1. Address the specific feedback provided\n' +
          '2. Maintain the letter\'s strengths\n' +
          '3. Ensure it better aligns with the job requirements\n' +
          '4. Keep it professional and authentic\n' +
          '5. Maintain appropriate length (300-400 words)\n\n' +
          'Provide the optimized cover letter without additional explanations.'
        ),
      ])

      const chain = optimizationPrompt.pipe(this.model).pipe(parser)

      const optimizedLetter = await chain.invoke({
        originalLetter,
        feedback,
        name: user.name,
        title: internship.title,
        company: internship.company,
        description: internship.description || 'No description provided',
      })

      if (!optimizedLetter) {
        throw new Error('No optimized letter generated')
      }

      // Save the optimized version
      // Note: We don't save here as the API handles saving after returning the result

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
      const { data: internship } = await this.supabase
        .from('internships')
        .select('*')
        .eq('id', internshipId)
        .single()

      if (!internship) {
        throw new Error('Internship not found')
      }

      const parser = new StringOutputParser()

      const tipsPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(
          'You are an experienced career counselor who provides expert advice on cover letter writing.'
        ),
        HumanMessagePromptTemplate.fromTemplate(
          'Provide specific tips for writing a strong cover letter for this internship:\n\n' +
          'Position: {title}\nCompany: {company}\n' +
          'Description: {description}\nRequirements: {requirements}\n\n' +
          'Provide 5-7 specific, actionable tips that will help candidates write a compelling ' +
          'cover letter for this specific opportunity. Focus on what the company is likely ' +
          'looking for and how candidates can best present themselves.'
        ),
      ])

      const chain = tipsPrompt.pipe(this.model).pipe(parser)

      const tips = await chain.invoke({
        title: internship.title,
        company: internship.company,
        description: internship.description || 'No description provided',
        requirements: internship.requirements || 'No specific requirements listed',
      })

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