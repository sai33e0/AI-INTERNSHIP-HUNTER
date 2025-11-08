'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Clock,
  CheckCircle,
  Send,
  Eye,
  Calendar,
  Building,
  FileText,
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ApplicationStatus } from '@/types'

interface Application extends ApplicationStatus {
  internship: {
    title: string
    company: string
    location?: string
    link?: string
  }
}

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [showNotesModal, setShowNotesModal] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setIsLoading(true)
      // Mock data - would be replaced with actual API calls
      const mockApplications: Application[] = [
        {
          id: '1',
          internship_id: 'internship-1',
          user_id: 'user-1',
          status: 'pending',
          cover_letter: 'Generated cover letter for Software Engineering Intern position at Google...',
          notes: 'Focus on machine learning experience and GitHub projects',
          applied_on: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          internship: {
            title: 'Software Engineering Intern',
            company: 'Google',
            location: 'Mountain View, CA',
            link: 'https://careers.google.com'
          }
        },
        {
          id: '2',
          internship_id: 'internship-2',
          user_id: 'user-1',
          status: 'submitted',
          cover_letter: 'Personalized cover letter highlighting React expertise...',
          notes: 'Strong alignment with frontend development requirements',
          applied_on: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          internship: {
            title: 'Frontend Developer Intern',
            company: 'Meta',
            location: 'Remote',
            link: 'https://careers.meta.com'
          }
        },
        {
          id: '3',
          internship_id: 'internship-3',
          user_id: 'user-1',
          status: 'reviewing',
          cover_letter: 'Cover letter emphasizing data analysis and ML projects...',
          notes: 'Phone screening scheduled for next week',
          applied_on: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          internship: {
            title: 'Data Science Intern',
            company: 'Microsoft',
            location: 'Redmond, WA',
            link: 'https://careers.microsoft.com'
          }
        },
        {
          id: '4',
          internship_id: 'internship-4',
          user_id: 'user-1',
          status: 'accepted',
          cover_letter: 'Cover letter showcasing iOS development portfolio...',
          notes: 'Offer accepted! Starting in June 2024',
          applied_on: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          internship: {
            title: 'Mobile Developer Intern',
            company: 'Apple',
            location: 'Cupertino, CA',
            link: 'https://careers.apple.com'
          }
        },
        {
          id: '5',
          internship_id: 'internship-5',
          user_id: 'user-1',
          status: 'rejected',
          cover_letter: 'Cover letter focusing on distributed systems experience...',
          notes: 'Position went to internal candidate',
          applied_on: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          internship: {
            title: 'Backend Engineering Intern',
            company: 'Amazon',
            location: 'Seattle, WA',
            link: 'https://careers.amazon.com'
          }
        }
      ]

      setApplications(mockApplications)
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setApplications(prev => prev.map(app =>
        app.id === applicationId
          ? {
              ...app,
              status: newStatus as ApplicationStatus['status'],
              applied_on: newStatus === 'submitted' ? new Date().toISOString() : app.applied_on || undefined,
              updated_at: new Date().toISOString()
            }
          : app
      ))

      toast.success(`Application status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update application status')
    }
  }

  const getStatusColumns = () => {
    const columns = [
      {
        id: 'pending',
        title: 'Pending',
        icon: <Clock className="h-5 w-5 text-yellow-600" />,
        color: 'border-yellow-200 bg-yellow-50',
        count: applications.filter(app => app.status === 'pending').length
      },
      {
        id: 'submitted',
        title: 'Submitted',
        icon: <Send className="h-5 w-5 text-blue-600" />,
        color: 'border-blue-200 bg-blue-50',
        count: applications.filter(app => app.status === 'submitted').length
      },
      {
        id: 'reviewing',
        title: 'Reviewing',
        icon: <Eye className="h-5 w-5 text-purple-600" />,
        color: 'border-purple-200 bg-purple-50',
        count: applications.filter(app => app.status === 'reviewing').length
      },
      {
        id: 'accepted',
        title: 'Accepted',
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        color: 'border-green-200 bg-green-50',
        count: applications.filter(app => app.status === 'accepted').length
      },
      {
        id: 'rejected',
        title: 'Rejected',
        icon: <X className="h-5 w-5 text-red-600" />,
        color: 'border-red-200 bg-red-50',
        count: applications.filter(app => app.status === 'rejected').length
      }
    ]

    return columns
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not applied'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaysAgo = (dateString: string | null) => {
    if (!dateString) return null
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`
  }

  const getStats = () => {
    const total = applications.length
    const submitted = applications.filter(app => app.status === 'submitted').length
    const reviewing = applications.filter(app => app.status === 'reviewing').length
    const accepted = applications.filter(app => app.status === 'accepted').length
    const rejected = applications.filter(app => app.status === 'rejected').length

    return { total, submitted, reviewing, accepted, rejected }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    )
  }

  const stats = getStats()

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
              <h1 className="text-2xl font-bold text-gray-900">Application Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={viewMode === 'kanban' ? 'primary' : 'outline'}
                onClick={() => setViewMode('kanban')}
                size="sm"
              >
                Kanban Board
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'primary' : 'outline'}
                onClick={() => setViewMode('timeline')}
                size="sm"
              >
                Timeline
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
              <div className="text-sm text-gray-600">Submitted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.reviewing}</div>
              <div className="text-sm text-gray-600">Under Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {getStatusColumns().map((column) => (
              <Card key={column.id} className={`${column.color} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      {column.icon}
                      <span className="ml-2">{column.title}</span>
                    </span>
                    <span className="bg-white rounded-full px-2 py-1 text-xs font-medium">
                      {column.count}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[400px]">
                  {applications
                    .filter(app => app.status === column.id)
                    .map((application) => (
                      <Card key={application.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedApplication(application)}>
                        <CardContent className="p-4">
                          <div className="mb-2">
                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                              {application.internship.title}
                            </h4>
                            <p className="text-xs text-gray-600 flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {application.internship.company}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            {application.internship.location && (
                              <div className="flex items-center">
                                <span className="h-3 w-3 mr-1">📍</span>
                                {application.internship.location}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(application.applied_on)}
                            </div>
                          </div>
                          {application.notes && (
                            <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded p-2">
                              <p className="line-clamp-2">{application.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
              <CardDescription>
                Chronological view of your application progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((application, index) => (
                    <div key={application.id} className="flex items-start space-x-4 p-4 border-l-4 border-gray-200 hover:border-primary-500 transition-colors">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          application.status === 'accepted' ? 'bg-green-100 text-green-600' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          application.status === 'reviewing' ? 'bg-purple-100 text-purple-600' :
                          application.status === 'submitted' ? 'bg-blue-100 text-blue-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {
                            application.status === 'accepted' ? <CheckCircle className="h-5 w-5" /> :
                            application.status === 'rejected' ? <X className="h-5 w-5" /> :
                            application.status === 'reviewing' ? <Eye className="h-5 w-5" /> :
                            application.status === 'submitted' ? <Send className="h-5 w-5" /> :
                            <Clock className="h-5 w-5" />
                          }
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {application.internship.title} at {application.internship.company}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {getDaysAgo(application.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Status: <span className="font-medium">{application.status}</span>
                        </p>
                        {application.applied_on && (
                          <p className="text-xs text-gray-500">
                            Applied on {formatDate(application.applied_on)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedApplication.internship.title}</CardTitle>
                    <CardDescription>{selectedApplication.internship.company}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApplication(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedApplication.status}
                    onChange={(e) => {
                      updateApplicationStatus(selectedApplication.id, e.target.value)
                      setSelectedApplication({
                        ...selectedApplication,
                        status: e.target.value as ApplicationStatus['status']
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <p className="text-gray-900">{selectedApplication.internship.location || 'Not specified'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Applied Date</label>
                  <p className="text-gray-900">{formatDate(selectedApplication.applied_on || null)}</p>
                </div>

                {selectedApplication.cover_letter && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <p className="text-sm text-gray-700">{selectedApplication.cover_letter}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={selectedApplication.notes || ''}
                    onChange={(e) => setSelectedApplication({
                      ...selectedApplication,
                      notes: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Add notes about this application..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedApplication(null)}
                  >
                    Close
                  </Button>
                  <Button>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}