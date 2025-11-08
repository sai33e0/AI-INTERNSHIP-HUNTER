import { chromium, Browser, Page } from 'playwright'
import * as cheerio from 'cheerio'
import { ScrapingConfig, ScrapingRequest, AIResponse } from '@/types'

export class ScraperAgent {
  private browser: Browser | null = null
  private sources: ScrapingConfig[] = []

  constructor() {
    this.initializeSources()
  }

  private async initializeSources(): Promise<void> {
    // In a real implementation, this would fetch from database
    this.sources = [
      {
        id: 'linkedin',
        name: 'LinkedIn',
        base_url: 'https://www.linkedin.com/jobs',
        selector_config: {
          jobCard: '.jobs-search__results-list .base-card',
          title: '.base-search-card__title',
          company: '.base-search-card__subtitle a',
          location: '.job-search-card__location',
          link: '.base-card__full-link',
          description: '.show-more-less-html__markup',
          postedDate: '.job-search-card__listdate',
          easyApply: '.job-card-container__apply-method'
        },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'indeed',
        name: 'Indeed',
        base_url: 'https://www.indeed.com',
        selector_config: {
          jobCard: '.job_seen_beacon',
          title: '.jcs-JobTitle',
          company: '.companyName',
          location: '.companyLocation',
          link: '.jcs-JobTitle',
          description: '.job-snippet',
          postedDate: '.date',
          salary: '.salary-snippet-container'
        },
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'glassdoor',
        name: 'Glassdoor',
        base_url: 'https://www.glassdoor.com/Job',
        selector_config: {
          jobCard: '.jobCard',
          title: '.jobLink',
          company: '.compactEmployerName',
          location: '.loc',
          link: '.jobLink',
          description: '.jobDescription',
          postedDate: '.job-age',
          salary: '.salaryEstimate'
        },
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]
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

  async scrapeInternships(request: ScrapingRequest): Promise<AIResponse> {
    try {
      await this.initializeBrowser()

      const allInternships = []
      const activeSources = this.sources.filter(source =>
        source.is_active && request.sources.includes(source.id)
      )

      for (const source of activeSources) {
        try {
          console.log(`Scraping ${source.name}...`)
          const sourceInternships = await this.scrapeSource(source, request)
          allInternships.push(...sourceInternships)

          // Add delay to respect rate limits
          await this.delay(2000)
        } catch (error) {
          console.error(`Error scraping ${source.name}:`, error)
          // Continue with other sources even if one fails
        }
      }

      const uniqueInternships = this.removeDuplicates(allInternships)

      return {
        success: true,
        data: uniqueInternships,
        metadata: {
          totalScraped: allInternships.length,
          uniqueFound: uniqueInternships.length,
          sourcesProcessed: activeSources.length,
          keywords: request.keywords,
          locations: request.locations
        }
      }

    } catch (error) {
      console.error('Scraping failed:', error)
      return {
        success: false,
        error: `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    } finally {
      await this.closeBrowser()
    }
  }

  private async scrapeSource(source: ScrapingConfig, request: ScrapingRequest): Promise<any[]> {
    const page = await this.browser!.newPage()

    try {
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')

      // Construct search URL based on keywords and locations
      const searchUrl = this.buildSearchUrl(source, request)

      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 })

      // Wait for job cards to load
      await page.waitForSelector(source.selector_config.jobCard, { timeout: 10000 })

      // Scroll to load more results
      await this.scrollToLoadMore(page, source.selector_config.jobCard, request.limit || 50)

      // Extract job listings
      const jobListings = await page.$$eval(source.selector_config.jobCard, (cards, config) => {
        return cards.map(card => {
          const extractText = (selector: string) => {
            const element = card.querySelector(selector)
            return element ? element.textContent?.trim() || '' : ''
          }

          const extractLink = (selector: string) => {
            const element = card.querySelector('a' + selector) || card.querySelector(selector)
            if (element && element.hasAttribute('href')) {
              const href = element.getAttribute('href')!
              return href.startsWith('http') ? href : `https://www.linkedin.com${href}`
            }
            return ''
          }

          return {
            title: extractText(config.title),
            company: extractText(config.company),
            location: extractText(config.location),
            link: extractLink(config.link),
            description: extractText(config.description),
            postedDate: extractText(config.postedDate),
            salary: extractText(config.salary || ''),
            easyApply: card.querySelector(config.easyApply || '') ? true : false,
            source: 'LinkedIn' // Would be dynamic based on source
          }
        })
      }, source.selector_config)

      // Filter and enhance job listings
      const filteredListings = jobListings.filter(job =>
        job.title &&
        job.company &&
        job.link &&
        this.matchesCriteria(job, request)
      )

      return filteredListings.slice(0, request.limit || 50)

    } finally {
      await page.close()
    }
  }

  private buildSearchUrl(source: ScrapingConfig, request: ScrapingRequest): string {
    const baseUrl = source.base_url
    const keywords = request.keywords.join(' ')
    const location = request.locations[0] || '' // Use first location for simplicity

    switch (source.id) {
      case 'linkedin':
        return `${baseUrl}/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}&f_TPR=r86400&f_E=2` // Internships, posted in last 24h
      case 'indeed':
        return `${baseUrl}/jobs?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}&filter=internship`
      case 'glassdoor':
        return `${baseUrl}/${location.toLowerCase().replace(/\s+/g, '-')}-internship-jobs-SRCH_IL.0,13_IC${encodeURIComponent(keywords.replace(/\s+/g, '-')).toUpperCase()}.htm`
      default:
        return baseUrl
    }
  }

  private matchesCriteria(job: any, request: ScrapingRequest): boolean {
    const text = `${job.title} ${job.description} ${job.company}`.toLowerCase()

    // Check if any keywords match
    const hasKeywordMatch = request.keywords.length === 0 ||
      request.keywords.some(keyword => text.includes(keyword.toLowerCase()))

    // Check if any location matches
    const hasLocationMatch = request.locations.length === 0 ||
      request.locations.some(loc => job.location.toLowerCase().includes(loc.toLowerCase())) ||
      job.location.toLowerCase().includes('remote')

    return hasKeywordMatch && hasLocationMatch
  }

  private async scrollToLoadMore(page: Page, jobCardSelector: string, limit: number): Promise<void> {
    let previousHeight = 0
    let currentHeight = 0

    do {
      previousHeight = currentHeight
      currentHeight = await page.evaluate('document.body.scrollHeight')

      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
      await page.waitForTimeout(2000) // Wait for content to load

      const jobCount = await page.$$eval(jobCardSelector, cards => cards.length)
      if (jobCount >= limit) break

    } while (currentHeight !== previousHeight)
  }

  private removeDuplicates(internships: any[]): any[] {
    const seen = new Set()
    return internships.filter(internship => {
      const key = `${internship.company}-${internship.title}-${internship.location}`.toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async testConnection(): Promise<AIResponse> {
    try {
      await this.initializeBrowser()
      const page = await this.browser!.newPage()

      await page.goto('https://www.linkedin.com/jobs', { waitUntil: 'networkidle' })

      const title = await page.title()

      await page.close()
      await this.closeBrowser()

      return {
        success: true,
        data: {
          status: 'connected',
          title: title,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      await this.closeBrowser()
      return {
        success: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  async getSourceStatus(): Promise<AIResponse> {
    return {
      success: true,
      data: this.sources.map(source => ({
        id: source.id,
        name: source.name,
        is_active: source.is_active,
        last_scraped: source.last_scraped
      }))
    }
  }
}