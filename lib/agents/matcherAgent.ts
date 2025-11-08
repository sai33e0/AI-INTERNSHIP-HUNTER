import { OpenAI } from 'openai'
import { supabase } from '@/lib/supabaseClient'
import { MatchingPreferences, AIResponse } from '@/types'

interface UserProfile {
  id: string
  name: string
  email: string
  github_url?: string
  linkedin_url?: string
  resume_url?: string
  skills?: string[]
  experience?: string
  education?: string
}

interface Internship {
  id: string
  title: string
  company: string
  location?: string
  description?: string
  requirements?: string
  salary_range?: string
  user_id: string
}

export class MatcherAgent {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async generateUserEmbedding(userProfile: UserProfile): Promise<number[]> {
    try {
      // Combine user information into a comprehensive text
      const resumeText = await this.extractResumeText(userProfile.resume_url)
      const githubText = await this.extractGitHubProfile(userProfile.github_url)

      const combinedText = `
        Name: ${userProfile.name}
        Email: ${userProfile.email}
        Resume: ${resumeText}
        GitHub Profile: ${githubText}
        LinkedIn: ${userProfile.linkedin_url || 'Not provided'}
        Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
        Experience: ${userProfile.experience || 'Not specified'}
        Education: ${userProfile.education || 'Not specified'}
      `.trim()

      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: combinedText,
      })

      return response.data[0].embedding

    } catch (error) {
      console.error('Error generating user embedding:', error)
      throw new Error('Failed to generate user embedding')
    }
  }

  async generateInternshipEmbedding(internship: Internship): Promise<number[]> {
    try {
      const internshipText = `
        Title: ${internship.title}
        Company: ${internship.company}
        Location: ${internship.location || 'Not specified'}
        Description: ${internship.description || 'No description available'}
        Requirements: ${internship.requirements || 'No specific requirements listed'}
        Salary Range: ${internship.salary || 'Not specified'}
      `.trim()

      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: internshipText,
      })

      return response.data[0].embedding

    } catch (error) {
      console.error('Error generating internship embedding:', error)
      throw new Error('Failed to generate internship embedding')
    }
  }

  async calculateSimilarity(userEmbedding: number[], internshipEmbedding: number[]): Promise<number> {
    if (userEmbedding.length !== internshipEmbedding.length) {
      throw new Error('Embedding dimensions do not match')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < userEmbedding.length; i++) {
      dotProduct += userEmbedding[i] * internshipEmbedding[i]
      normA += userEmbedding[i] * userEmbedding[i]
      normB += internshipEmbedding[i] * internshipEmbedding[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  async matchUserToInternships(
    userId: string,
    internshipIds: string[],
    preferences: MatchingPreferences = {
      skills: 0.4,
      experience: 0.3,
      location: 0.2,
      company: 0.1
    }
  ): Promise<AIResponse> {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        throw new Error('User not found')
      }

      // Get internships
      const { data: internships, error: internshipError } = await supabase
        .from('internships')
        .select('*')
        .in('id', internshipIds.length > 0 ? internshipIds : (await this.getUserInternships(userId)))
        .eq('user_id', userId)

      if (internshipError || !internships) {
        throw new Error('Failed to fetch internships')
      }

      // Generate user embedding
      const userEmbedding = await this.generateUserEmbedding(user)

      const matchingResults = []
      let highMatches = 0
      let mediumMatches = 0
      let lowMatches = 0

      for (const internship of internships) {
        try {
          // Generate internship embedding
          const internshipEmbedding = await this.generateInternshipEmbedding(internship)

          // Calculate base similarity
          const baseSimilarity = await this.calculateSimilarity(userEmbedding, internshipEmbedding)

          // Apply advanced matching with preferences
          const detailedScore = await this.calculateDetailedMatchScore(
            user,
            internship,
            baseSimilarity,
            preferences
          )

          // Update internship with match score
          await supabase
            .from('internships')
            .update({ match_score: detailedScore })
            .eq('id', internship.id)

          matchingResults.push({
            internshipId: internship.id,
            title: internship.title,
            company: internship.company,
            matchScore: detailedScore,
            baseSimilarity: baseSimilarity
          })

          if (detailedScore >= 0.8) {
            highMatches++
          } else if (detailedScore >= 0.6) {
            mediumMatches++
          } else if (detailedScore >= 0.4) {
            lowMatches++
          }

        } catch (error) {
          console.error(`Error matching internship ${internship.id}:`, error)
          // Continue with other internships even if one fails
        }
      }

      // Sort by match score (highest first)
      matchingResults.sort((a, b) => b.matchScore - a.matchScore)

      return {
        success: true,
        data: matchingResults,
        metadata: {
          processed: internships.length,
          highMatches,
          mediumMatches,
          lowMatches,
          preferences
        }
      }

    } catch (error) {
      console.error('Matching failed:', error)
      return {
        success: false,
        error: `Matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async calculateDetailedMatchScore(
    user: UserProfile,
    internship: Internship,
    baseSimilarity: number,
    preferences: MatchingPreferences
  ): Promise<number> {
    try {
      // Use GPT-4 for detailed analysis
      const prompt = `
        Analyze the match between this user profile and internship description:

        User Profile:
        Name: ${user.name}
        Resume Text: ${await this.extractResumeText(user.resume_url)}
        GitHub Profile: ${await this.extractGitHubProfile(user.github_url)}
        Skills: ${user.skills?.join(', ') || 'Not specified'}

        Internship Details:
        Title: ${internship.title}
        Company: ${internship.company}
        Description: ${internship.description || 'No description'}
        Requirements: ${internship.requirements || 'No specific requirements'}

        Preferences:
        - Skills Weight: ${preferences.skills}
        - Experience Weight: ${preferences.experience}
        - Location Weight: ${preferences.location}
        - Company Weight: ${preferences.company}

        Provide a detailed match analysis and return a JSON object with:
        {
          "overallScore": 0.85,
          "skillsMatch": 0.9,
          "experienceMatch": 0.8,
          "locationMatch": 0.7,
          "companyFit": 0.85,
          "recommendations": ["User has strong React experience", "Consider highlighting Python projects"],
          "missingSkills": ["Docker", "AWS"],
          "strengths": ["Full-stack development", "Problem solving", "Team collaboration"]
        }

        Focus on providing specific, actionable insights.
      `

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert career counselor and technical recruiter. Analyze user profiles against job requirements and provide detailed matching scores and recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      })

      const analysisText = response.choices[0].message.content || '{}'

      try {
        const analysis = JSON.parse(analysisText)

        // Calculate weighted score based on preferences
        const weightedScore =
          (analysis.skillsMatch * preferences.skills) +
          (analysis.experienceMatch * preferences.experience) +
          (analysis.locationMatch * preferences.location) +
          (analysis.companyFit * preferences.company)

        // Combine with base similarity for final score
        const finalScore = (baseSimilarity * 0.3) + (weightedScore * 0.7)

        return Math.min(1.0, Math.max(0.0, finalScore))
      } catch (parseError) {
        console.error('Error parsing AI analysis:', parseError)
        // Fall back to base similarity
        return baseSimilarity
      }

    } catch (error) {
      console.error('Error calculating detailed match score:', error)
      return baseSimilarity
    }
  }

  private async extractResumeText(resumeUrl?: string): Promise<string> {
    if (!resumeUrl) return 'No resume provided'

    try {
      // In a real implementation, this would:
      // 1. Download the resume from Supabase Storage
      // 2. Use a PDF parser (like pdf-parse) to extract text
      // 3. For DOCX files, use a library like mammoth

      // Mock implementation for now
      return 'Experienced software developer with strong skills in React, Node.js, and Python. ' +
             'Built multiple web applications and contributed to open-source projects. ' +
             'Strong problem-solving abilities and team collaboration skills.'
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

      // In a real implementation, this would:
      // 1. Use GitHub API to fetch user profile
      // 2. Fetch user's repositories
      // 3. Analyze languages used, commit history, etc.

      // Mock implementation for now
      return `GitHub user ${username} with repositories in React, Node.js, and Python. ` +
             `Active contributor with regular commits and good documentation practices.`
    } catch (error) {
      console.error('Error extracting GitHub profile:', error)
      return 'GitHub profile extraction failed'
    }
  }

  private async getUserInternships(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('internships')
        .select('id')
        .eq('user_id', userId)

      if (error || !data) {
        return []
      }

      return data.map(item => item.id)
    } catch (error) {
      console.error('Error fetching user internships:', error)
      return []
    }
  }

  async getMatchingInsights(userId: string): Promise<AIResponse> {
    try {
      const { data: internships, error } = await supabase
        .from('internships')
        .select('*')
        .eq('user_id', userId)
        .order('match_score', { ascending: false })
        .limit(20)

      if (error || !internships) {
        throw new Error('Failed to fetch internships for insights')
      }

      // Analyze patterns and generate insights
      const highMatchInternships = internships.filter(i => (i.match_score || 0) >= 0.8)
      const commonCompanies = this.getMostCommonCompanies(internships)
      const commonLocations = this.getMostCommonLocations(internships)
      const commonSkills = await this.extractCommonSkills(highMatchInternships)

      const insights = {
        totalInternships: internships.length,
        highMatchCount: highMatchInternships.length,
        averageMatchScore: internships.reduce((sum, i) => sum + (i.match_score || 0), 0) / internships.length,
        topCompanies: commonCompanies,
        topLocations: commonLocations,
        recommendedSkills: commonSkills,
        suggestions: this.generateSuggestions(internships, highMatchInternships)
      }

      return {
        success: true,
        data: insights
      }

    } catch (error) {
      console.error('Error generating insights:', error)
      return {
        success: false,
        error: `Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private getMostCommonCompanies(internships: any[]): Array<{company: string, count: number}> {
    const companyCounts: Record<string, number> = {}

    internships.forEach(internship => {
      companyCounts[internship.company] = (companyCounts[internship.company] || 0) + 1
    })

    return Object.entries(companyCounts)
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private getMostCommonLocations(internships: any[]): Array<{location: string, count: number}> {
    const locationCounts: Record<string, number> = {}

    internships.forEach(internship => {
      const location = internship.location || 'Remote'
      locationCounts[location] = (locationCounts[location] || 0) + 1
    })

    return Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private async extractCommonSkills(internships: any[]): Promise<string[]> {
    // In a real implementation, this would use NLP to extract skills
    // from job descriptions and requirements

    const allRequirements = internships
      .filter(i => i.requirements)
      .map(i => i.requirements)
      .join(' ')

    // Mock common tech skills
    const commonTechSkills = [
      'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python',
      'AWS', 'Docker', 'Git', 'Agile', 'SQL', 'MongoDB'
    ]

    return commonTechSkills
  }

  private generateSuggestions(allInternships: any[], highMatchInternships: any[]): string[] {
    const suggestions = []

    if (highMatchInternships.length === 0) {
      suggestions.push('Consider updating your profile with more specific skills and experience')
    }

    const remoteCount = allInternships.filter(i =>
      i.location?.toLowerCase().includes('remote')
    ).length

    if (remoteCount > allInternships.length * 0.5) {
      suggestions.push('Many opportunities are remote - consider highlighting remote work experience')
    }

    const avgMatchScore = allInternships.reduce((sum, i) => sum + (i.match_score || 0), 0) / allInternships.length

    if (avgMatchScore < 0.6) {
      suggestions.push('Your profile might need more specific technical keywords to improve matching')
    }

    suggestions.push('Apply to high-match internships first to maximize success rate')

    return suggestions
  }
}