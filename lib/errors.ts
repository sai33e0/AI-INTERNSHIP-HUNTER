import { NextResponse } from 'next/server'

// Custom error classes
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public details: any

  constructor(message: string, details?: any) {
    super(message, 400)
    this.details = details
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429)
  }
}

export class ExternalServiceError extends AppError {
  public service: string

  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502)
    this.service = service
  }
}

// Error handling utilities
export class ErrorHandler {
  static handle(error: Error): NextResponse {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    if (error instanceof AppError) {
      return this.handleAppError(error)
    }

    // Handle database errors
    if (error.name === 'PostgresError') {
      return this.handleDatabaseError(error as any)
    }

    // Handle OpenAI errors
    if (error.name === 'OpenAIError') {
      return this.handleOpenAIError(error as any)
    }

    // Handle Playwright errors
    if (error.name === 'PlaywrightError') {
      return this.handlePlaywrightError(error as any)
    }

    // Handle unknown errors
    return this.handleUnknownError(error)
  }

  private static handleAppError(error: AppError): NextResponse {
    const response = {
      success: false,
      error: error.message,
      ...(error instanceof ValidationError && { details: error.details })
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  private static handleDatabaseError(error: any): NextResponse {
    // Handle common PostgreSQL errors
    switch (error.code) {
      case '23505': // Unique violation
        return NextResponse.json(
          {
            success: false,
            error: 'Resource already exists'
          },
          { status: 409 }
        )

      case '23503': // Foreign key violation
        return NextResponse.json(
          {
            success: false,
            error: 'Referenced resource does not exist'
          },
          { status: 400 }
        )

      case '23502': // Not null violation
        return NextResponse.json(
          {
            success: false,
            error: 'Required field is missing'
          },
          { status: 400 }
        )

      case '42703': // Undefined column
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid field name'
          },
          { status: 400 }
        )

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Database operation failed'
          },
          { status: 500 }
        )
    }
  }

  private static handleOpenAIError(error: any): NextResponse {
    // Handle OpenAI API errors
    if (error.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API rate limit exceeded'
        },
        { status: 429 }
      )
    }

    if (error.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API authentication failed'
        },
        { status: 500 }
      )
    }

    if (error.status >= 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI service temporarily unavailable'
        },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'AI service error'
      },
      { status: 500 }
    )
  }

  private static handlePlaywrightError(error: any): NextResponse {
    // Handle Playwright errors
    if (error.message.includes('Timeout')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timeout - please try again'
        },
        { status: 408 }
      )
    }

    if (error.message.includes('Target closed')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Browser session ended unexpectedly'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Web scraping failed'
      },
      { status: 500 }
    )
  }

  private static handleUnknownError(error: Error): NextResponse {
    // Log full error for debugging
    console.error('Unhandled error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Async error wrapper
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R | NextResponse> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      return ErrorHandler.handle(error)
    })
  }
}

// Validation error wrapper
export function validateAsync<T>(
  validator: (data: T) => { valid: boolean; error?: string }
) {
  return (data: T): void => {
    const result = validator(data)
    if (!result.valid) {
      throw new ValidationError(result.error || 'Validation failed')
    }
  }
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private failures: number = 0
  private lastFailureTime: number = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new ExternalServiceError('Circuit breaker', 'Service temporarily unavailable')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
    }
  }

  getState(): string {
    return this.state
  }

  reset(): void {
    this.failures = 0
    this.state = 'CLOSED'
    this.lastFailureTime = 0
  }
}

// Global circuit breakers for external services
export const circuitBreakers = {
  openai: new CircuitBreaker(5, 60000),
  playwright: new CircuitBreaker(3, 30000),
  supabase: new CircuitBreaker(10, 30000)
}

// Retry mechanism with exponential backoff
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxAttempts) {
        break
      }

      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Error logging utility
export class ErrorLogger {
  static log(error: Error, context?: any): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: error.message,
      stack: error.stack,
      name: error.name,
      context
    }

    console.error(JSON.stringify(logData, null, 2))

    // In production, you would send this to a logging service
    // await sendToLoggingService(logData)
  }

  static logApiError(
    method: string,
    url: string,
    error: Error,
    userId?: string,
    requestId?: string
  ): void {
    this.log(error, {
      type: 'API_ERROR',
      method,
      url,
      userId,
      requestId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    })
  }

  static logSecurityEvent(
    event: string,
    details: any,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      level: severity === 'HIGH' ? 'CRITICAL' : 'WARNING',
      event: `SECURITY_${event}`,
      details,
      severity
    }

    console.warn(JSON.stringify(logData, null, 2))

    // In production, send to security monitoring service
    // await sendToSecurityService(logData)
  }
}

// Global error handler for uncaught exceptions
if (typeof process !== 'undefined') {
  process.on('uncaughtException', (error) => {
    ErrorLogger.log(error, { type: 'UNCAUGHT_EXCEPTION' })
    process.exit(1)
  })

  process.on('unhandledRejection', (reason, promise) => {
    ErrorLogger.log(new Error(`Unhandled rejection: ${reason}`), {
      type: 'UNHANDLED_REJECTION',
      promise: promise.toString()
    })
  })
}