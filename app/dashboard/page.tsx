'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Brain,
  Search,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  Target,
  BarChart3,
  RefreshCw,
  Play,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { DashboardStats } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInternships: 0,
    highMatches: 0,
    pendingApplications: 0,
    submittedApplications: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
  })
  const [isScraping, setIsScraping] = useState(false)
  const [isMatching, setIsMatching] = useState(false)
  const [lastScraped, setLastScraped] = useState<Date | null>(null)

  useEffect(() => {
    // Load user stats
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Mock data for now - would be replaced with actual API calls
      setStats({
        totalInternships: 156,
        highMatches: 23,
        pendingApplications: 8,
        submittedApplications: 12,
        interviewsScheduled: 3,
        offersReceived: 1,
      })
      setLastScraped(new Date(Date.now() - 1000 * 60 * 30)) // 30 minutes ago
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Failed to load dashboard data')
    }
  }

  const startScraping = async () => {
    setIsScraping(true)
    try {
      // Mock scraping process
      await new Promise(resolve => setTimeout(resolve, 3000))
      setLastScraped(new Date())
      setStats(prev => ({
        ...prev,
        totalInternships: prev.totalInternships + 15
      }))
      toast.success('Found 15 new internships!')
    } catch (error) {
      console.error('Scraping error:', error)
      toast.error('Failed to scrape internships')
    } finally {
      setIsScraping(false)
    }
  }

  const startMatching = async () => {
    setIsMatching(true)
    try {
      // Mock matching process
      await new Promise(resolve => setTimeout(resolve, 2000))
      setStats(prev => ({
        ...prev,
        highMatches: prev.highMatches + 5
      }))
      toast.success('Updated match scores for all internships!')
    } catch (error) {
      console.error('Matching error:', error)
      toast.error('Failed to update matches')
    } finally {
      setIsMatching(false)
    }
  }

  const formatLastScraped = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    return `${days} days ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">AI Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/matches">
                <Button variant="outline">View Matches</Button>
              </Link>
              <Link href="/tracker">
                <Button>Application Tracker</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Pipeline Status */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">AI Pipeline Status</h2>
            <span className="text-sm text-gray-500">
              Last updated: {formatLastScraped(lastScraped)}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Scraper Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Search className="h-5 w-5 mr-2 text-primary-600" />
                    Internship Scraper
                  </span>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Jobs Found Today</span>
                    <span className="font-semibold">+15</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Sources</span>
                    <span className="font-semibold">3</span>
                  </div>
                  <Button
                    onClick={startScraping}
                    loading={isScraping}
                    disabled={isScraping}
                    className="w-full"
                    size="sm"
                  >
                    {isScraping ? 'Scraping...' : 'Start Scraping'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Matcher Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-primary-600" />
                    AI Matcher
                  </span>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Ready</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">High Matches</span>
                    <span className="font-semibold text-green-600">{stats.highMatches}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Match Score</span>
                    <span className="font-semibold">87%</span>
                  </div>
                  <Button
                    onClick={startMatching}
                    loading={isMatching}
                    disabled={isMatching}
                    className="w-full"
                    size="sm"
                  >
                    {isMatching ? 'Matching...' : 'Update Matches'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cover Letter Generator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary-600" />
                    Cover Letter AI
                  </span>
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Online</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Generated Today</span>
                    <span className="font-semibold">8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quality Score</span>
                    <span className="font-semibold">92%</span>
                  </div>
                  <Button
                    onClick={() => toast.success('Cover letter generator ready!')}
                    className="w-full"
                    size="sm"
                  >
                    Configure Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Matches</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalInternships}</p>
                  </div>
                  <Brain className="h-8 w-8 text-primary-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Submitted</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.submittedApplications}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Interviews</p>
                    <p className="text-2xl font-bold text-green-600">{stats.interviewsScheduled}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/tracker">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">New high match found</p>
                      <p className="text-sm text-gray-600">Software Engineering Intern at Google</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">2 hours ago</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Cover letter generated</p>
                      <p className="text-sm text-gray-600">Frontend Developer Intern at Meta</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">4 hours ago</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Application submitted</p>
                      <p className="text-sm text-gray-600">Data Science Intern at Microsoft</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">1 day ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/matches">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Search className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Browse Matches</h3>
                      <p className="text-sm text-gray-600">View and filter your internship matches</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/tracker">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Track Applications</h3>
                      <p className="text-sm text-gray-600">Monitor your application progress</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6" onClick={() => toast.success('AI optimization running...')}>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Optimize Profile</h3>
                    <p className="text-sm text-gray-600">AI-powered resume optimization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}