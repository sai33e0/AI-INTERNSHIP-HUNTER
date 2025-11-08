import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          github_url: string | null
          linkedin_url: string | null
          resume_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          github_url?: string | null
          linkedin_url?: string | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          github_url?: string | null
          linkedin_url?: string | null
          resume_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      internships: {
        Row: {
          id: string
          title: string
          company: string
          location: string | null
          link: string
          description: string | null
          requirements: string | null
          salary_range: string | null
          posted_date: string | null
          deadline: string | null
          source_site: string | null
          match_score: number | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          company: string
          location?: string | null
          link: string
          description?: string | null
          requirements?: string | null
          salary_range?: string | null
          posted_date?: string | null
          deadline?: string | null
          source_site?: string | null
          match_score?: number | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          company?: string
          location?: string | null
          link?: string
          description?: string | null
          requirements?: string | null
          salary_range?: string | null
          posted_date?: string | null
          deadline?: string | null
          source_site?: string | null
          match_score?: number | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          internship_id: string
          user_id: string
          status: 'pending' | 'submitted' | 'reviewing' | 'accepted' | 'rejected'
          cover_letter: string | null
          notes: string | null
          applied_on: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          internship_id: string
          user_id: string
          status?: 'pending' | 'submitted' | 'reviewing' | 'accepted' | 'rejected'
          cover_letter?: string | null
          notes?: string | null
          applied_on?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          internship_id?: string
          user_id?: string
          status?: 'pending' | 'submitted' | 'reviewing' | 'accepted' | 'rejected'
          cover_letter?: string | null
          notes?: string | null
          applied_on?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scraping_sources: {
        Row: {
          id: string
          name: string
          base_url: string
          selector_config: any
          is_active: boolean
          last_scraped: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          base_url: string
          selector_config?: any
          is_active?: boolean
          last_scraped?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          base_url?: string
          selector_config?: any
          is_active?: boolean
          last_scraped?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Internship = Database['public']['Tables']['internships']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type ScrapingSource = Database['public']['Tables']['scraping_sources']['Row']