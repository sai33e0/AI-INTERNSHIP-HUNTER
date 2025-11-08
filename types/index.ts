export interface UserProfile {
  id: string
  email: string
  name: string
  github_url?: string
  linkedin_url?: string
  resume_url?: string
  created_at: string
  updated_at: string
}

export interface InternshipMatch {
  id: string
  title: string
  company: string
  location?: string
  link: string
  description?: string
  requirements?: string
  salary_range?: string
  posted_date?: string
  deadline?: string
  source_site?: string
  match_score?: number
  user_id: string
  created_at: string
  updated_at: string
}

export interface ApplicationStatus {
  id: string
  internship_id: string
  user_id: string
  status: 'pending' | 'submitted' | 'reviewing' | 'accepted' | 'rejected'
  cover_letter?: string
  notes?: string
  applied_on?: string
  created_at: string
  updated_at: string
}

export interface ScrapingConfig {
  id: string
  name: string
  base_url: string
  selector_config: Record<string, any>
  is_active: boolean
  last_scraped?: string
  created_at: string
}

export interface AIResponse {
  success: boolean
  data?: any
  error?: string
  metadata?: Record<string, any>
}

export interface MatchingPreferences {
  skills: number
  experience: number
  location: number
  company: number
}

export interface CoverLetterRequest {
  user_id: string
  internship_id: string
  tone?: 'professional' | 'casual' | 'enthusiastic'
  length?: 'short' | 'medium' | 'long'
  custom_points?: string[]
}

export interface ScrapingRequest {
  sources: string[]
  keywords: string[]
  locations: string[]
  limit?: number
}

export interface DashboardStats {
  totalInternships: number
  highMatches: number
  pendingApplications: number
  submittedApplications: number
  interviewsScheduled: number
  offersReceived: number
}