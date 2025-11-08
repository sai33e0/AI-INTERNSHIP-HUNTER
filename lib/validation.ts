import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address')
export const urlSchema = z.string().url('Invalid URL').optional().nullable()
export const uuidSchema = z.string().uuid('Invalid ID format')
export const nonEmptyStringSchema = z.string().min(1, 'This field is required')

// User validation schemas
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: emailSchema,
  github_url: z.string().url('Invalid GitHub URL').optional().nullable(),
  linkedin_url: z.string().url('Invalid LinkedIn URL').optional().nullable(),
  resume_url: z.string().url('Invalid resume URL').optional().nullable()
})

export const updateUserSchema = createUserSchema.partial()

// Internship validation schemas
export const createInternshipSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  company: z.string().min(2, 'Company name is required'),
  location: z.string().optional().nullable(),
  link: z.string().url('Invalid application link'),
  description: z.string().optional().nullable(),
  requirements: z.string().optional().nullable(),
  salary_range: z.string().optional().nullable(),
  posted_date: z.string().datetime().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  source_site: z.string().optional().nullable(),
  match_score: z.number().min(0).max(1).optional(),
  user_id: uuidSchema
})

export const updateInternshipSchema = createInternshipSchema.partial()

// Application validation schemas
export const createApplicationSchema = z.object({
  user_id: uuidSchema,
  internship_id: uuidSchema,
  status: z.enum(['pending', 'submitted', 'reviewing', 'accepted', 'rejected']).default('pending'),
  cover_letter: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

export const updateApplicationSchema = createApplicationSchema.partial().omit({
  user_id: true,
  internship_id: true
})

// API Request validation schemas
export const scrapingRequestSchema = z.object({
  sources: z.array(z.enum(['linkedin', 'indeed', 'glassdoor'])).min(1, 'At least one source is required'),
  keywords: z.array(z.string().min(2)).min(1, 'At least one keyword is required'),
  locations: z.array(z.string().min(2)).optional(),
  limit: z.number().min(1).max(100).default(50)
})

export const matchingRequestSchema = z.object({
  user_id: uuidSchema,
  internship_ids: z.array(uuidSchema).optional(),
  weight_preferences: z.object({
    skills: z.number().min(0).max(1),
    experience: z.number().min(0).max(1),
    location: z.number().min(0).max(1),
    company: z.number().min(0).max(1)
  }).refine(
    (prefs) => Math.abs(Object.values(prefs).reduce((sum, val) => sum + val, 0) - 1.0) < 0.01,
    {
      message: 'Weight preferences must sum to 1.0'
    }
  ).optional()
})

export const coverLetterRequestSchema = z.object({
  user_id: uuidSchema,
  internship_id: uuidSchema,
  tone: z.enum(['professional', 'casual', 'enthusiastic']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  custom_points: z.array(z.string().min(5)).optional()
})

export const applicationRequestSchema = z.object({
  user_id: uuidSchema,
  internship_id: uuidSchema,
  auto_apply: z.boolean().default(false),
  resume_path: z.string().optional(),
  cover_letter_path: z.string().optional(),
  additional_info: z.record(z.string(), z.unknown()).optional()
})

// File validation schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.string().regex(/^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/),
  size: z.number().min(1).max(5 * 1024 * 1024) // 5MB max
})

// Query parameter validation schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0)
})

export const applicationsQuerySchema = paginationSchema.extend({
  user_id: uuidSchema,
  status: z.enum(['pending', 'submitted', 'reviewing', 'accepted', 'rejected']).optional()
})

export const internshipsQuerySchema = paginationSchema.extend({
  user_id: uuidSchema,
  min_match_score: z.coerce.number().min(0).max(1).optional(),
  company: z.string().optional(),
  location: z.string().optional()
})

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return { success: false, error: errorMessages }
    }
    return { success: false, error: 'Validation failed' }
  }
}

// Security validation functions
export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PDF, DOC, and DOCX files are allowed' }
  }

  // Check file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }

  // Check filename
  const sanitizedFilename = sanitizeFilename(file.name)
  if (sanitizedFilename !== file.name) {
    return { valid: false, error: 'Invalid filename' }
  }

  return { valid: true }
}

// Rate limiting validation
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || []

    // Remove old requests outside the window
    requests = requests.filter((timestamp: number) => timestamp > windowStart)

    // Check if under the limit
    if (requests.length < this.maxRequests) {
      requests.push(now)
      this.requests.set(identifier, requests)
      return true
    }

    return false
  }

  cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.windowMs

    for (const [identifier, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter((timestamp: number) => timestamp > windowStart)
      if (validTimestamps.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validTimestamps)
      }
    }
  }
}

// Input sanitization for database queries
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return sanitizeHtml(input.trim())
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }

  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }

  return input
}

// Content Security Policy headers
export const cspHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com https://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}