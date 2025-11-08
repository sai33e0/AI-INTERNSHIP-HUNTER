'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Star,
  MapPin,
  Building,
  Calendar,
  ExternalLink,
  FileText,
  Heart,
  X,
  ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { InternshipMatch } from '@/types'

export default function MatchesPage() {
  const [matches, setMatches] = useState<InternshipMatch[]>([])
  const [filteredMatches, setFilteredMatches] = useState<InternshipMatch[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    matchScore: 'all',
    location: 'all',
    company: 'all'
  })
  const [savedInternships, setSavedInternships] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadMatches()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [matches, searchTerm, selectedFilters])

  const loadMatches = async () => {
    try {
      setIsLoading(true)
      // Mock data - would be replaced with actual API calls
      const mockMatches: InternshipMatch[] = [
        {
          id: '1',
          title: 'Software Engineering Intern',
          company: 'Google',
          location: 'Mountain View, CA',
          link: 'https://careers.google.com',
          description: 'Join our team to work on cutting-edge technology that impacts billions of users worldwide.',
          requirements: 'Currently pursuing a degree in Computer Science or related field. Strong programming skills in Java, Python, or C++.',
          salary_range: '$45-65/hr',
          posted_date: new Date().toISOString(),
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          source_site: 'LinkedIn',
          match_score: 0.95,
          user_id: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Frontend Developer Intern',
          company: 'Meta',
          location: 'Remote',
          link: 'https://careers.meta.com',
          description: 'Build user interfaces for Meta family of apps used by billions of people around the world.',
          requirements: 'Experience with React, JavaScript, HTML5, CSS3. Strong portfolio of web projects.',
          salary_range: '$40-60/hr',
          posted_date: new Date().toISOString(),
          deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          source_site: 'Indeed',
          match_score: 0.88,
          user_id: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Data Science Intern',
          company: 'Microsoft',
          location: 'Redmond, WA',
          link: 'https://careers.microsoft.com',
          description: 'Work on machine learning models and data analysis for various Microsoft products.',
          requirements: 'Strong background in statistics, machine learning, and Python. Experience with data visualization.',
          salary_range: '$50-70/hr',
          posted_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          source_site: 'Glassdoor',
          match_score: 0.82,
          user_id: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          title: 'Mobile Developer Intern',
          company: 'Apple',
          location: 'Cupertino, CA',
          link: 'https://careers.apple.com',
          description: 'Develop innovative mobile applications for iOS platform.',
          requirements: 'Experience with Swift, Objective-C, and mobile app development. Strong understanding of iOS SDK.',
          salary_range: '$48-68/hr',
          posted_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          source_site: 'LinkedIn',
          match_score: 0.79,
          user_id: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          title: 'Backend Engineering Intern',
          company: 'Amazon',
          location: 'Seattle, WA',
          link: 'https://careers.amazon.com',
          description: 'Build scalable backend systems for AWS services.',
          requirements: 'Experience with distributed systems, cloud computing, and microservices. Strong knowledge of Java or Python.',
          salary_range: '$42-62/hr',
          posted_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          source_site: 'Indeed',
          match_score: 0.75,
          user_id: 'user-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      setMatches(mockMatches)
    } catch (error) {
      console.error('Error loading matches:', error)
      toast.error('Failed to load internship matches')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...matches]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(match =>
        match.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Match score filter
    if (selectedFilters.matchScore !== 'all') {
      const minScore = selectedFilters.matchScore === 'high' ? 0.8 :
                      selectedFilters.matchScore === 'medium' ? 0.6 : 0.4
      filtered = filtered.filter(match => (match.match_score || 0) >= minScore)
    }

    // Location filter
    if (selectedFilters.location !== 'all') {
      filtered = filtered.filter(match =>
        selectedFilters.location === 'remote' ?
        match.location?.toLowerCase().includes('remote') :
        match.location?.toLowerCase().includes(selectedFilters.location.toLowerCase())
      )
    }

    setFilteredMatches(filtered)
  }

  const toggleSavedInternship = (internshipId: string) => {
    const newSaved = new Set(savedInternships)
    if (newSaved.has(internshipId)) {
      newSaved.delete(internshipId)
      toast.success('Removed from saved internships')
    } else {
      newSaved.add(internshipId)
      toast.success('Saved to your list')
    }
    setSavedInternships(newSaved)
  }

  const generateCoverLetter = async (internshipId: string) => {
    try {
      toast.loading('Generating cover letter...', { id: 'cover-letter' })
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Cover letter generated successfully!', { id: 'cover-letter' })
    } catch (error) {
      console.error('Error generating cover letter:', error)
      toast.error('Failed to generate cover letter', { id: 'cover-letter' })
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-600 bg-gray-100'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Internship Matches</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredMatches.length} of {matches.length} matches
              </span>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search internships, companies, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4 text-gray-400" />}
              />
            </div>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="p-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Match Score
                    </label>
                    <select
                      value={selectedFilters.matchScore}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, matchScore: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Scores</option>
                      <option value="high">High (80%+)</option>
                      <option value="medium">Medium (60%+)</option>
                      <option value="low">Low (40%+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <select
                      value={selectedFilters.location}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All Locations</option>
                      <option value="remote">Remote</option>
                      <option value="ca">California</option>
                      <option value="wa">Washington</option>
                      <option value="ny">New York</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      defaultValue="match-score"
                    >
                      <option value="match-score">Match Score</option>
                      <option value="posted-date">Recently Posted</option>
                      <option value="deadline">Application Deadline</option>
                      <option value="company">Company Name</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your internship matches...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search terms to find more opportunities.
              </p>
              <Button onClick={() => {
                setSearchTerm('')
                setSelectedFilters({ matchScore: 'all', location: 'all', company: 'all' })
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredMatches.map((internship) => (
              <Card key={internship.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {internship.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(internship.match_score || 0)}`}>
                          {Math.round((internship.match_score || 0) * 100)}% Match
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {internship.company}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {internship.location}
                        </span>
                        {internship.salary_range && (
                          <span className="flex items-center">
                            <span className="h-4 w-4 mr-1">$</span>
                            {internship.salary_range}
                          </span>
                        )}
                      </div>
                      {internship.description && (
                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {internship.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Posted {formatDate(internship.posted_date || '')}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Deadline {formatDate(internship.deadline || '')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => toggleSavedInternship(internship.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Heart className={`h-5 w-5 ${savedInternships.has(internship.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="flex gap-3">
                      <a
                        href={internship.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Original
                      </a>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateCoverLetter(internship.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Cover Letter
                      </Button>
                      <Button size="sm">
                        Apply Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}