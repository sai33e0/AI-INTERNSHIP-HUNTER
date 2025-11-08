import Link from 'next/link'
import { ArrowRight, Brain, FileText, Search, TrendingUp, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">AI Internship Hunter</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/upload">
                <Button variant="outline">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Find Your Perfect
              <span className="text-primary-600"> Internship</span>
              <br />
              with AI Power
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Automatically discover internships that match your skills, generate personalized cover letters with GPT-4, and track all your applications in one intelligent platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/upload">
                <Button size="lg" className="text-lg px-8 py-3">
                  Start Your Hunt
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our intelligent platform handles the heavy lifting so you can focus on what matters - landing your dream internship.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>Smart Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI analyzes your resume and GitHub profile to find internships that perfectly match your skills, experience level, and interests.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>Cover Letter Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  GPT-4 powered cover letters tailored to each internship, highlighting your relevant experience and skills automatically.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>Application Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor all your applications in real-time, track response rates, and get insights to improve your internship search strategy.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>Automated Scraping</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Continuously scans LinkedIn, Indeed, Glassdoor, and more to bring you the latest internship opportunities from top companies.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>Skills Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Advanced AI analyzes job requirements and your skill set to provide personalized recommendations for skill development.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>Company Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get detailed information about company culture, interview processes, and tips from other applicants in your field.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in minutes and let AI handle your internship search
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Profile</h3>
              <p className="text-gray-600">
                Upload your resume and connect your GitHub profile to showcase your skills and projects.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Matching</h3>
              <p className="text-gray-600">
                Our AI analyzes thousands of internships and finds the best matches for your profile.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Apply Smart</h3>
              <p className="text-gray-600">
                Generate personalized cover letters and track your applications with one click.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Land Internship</h3>
              <p className="text-gray-600">
                Monitor your progress and celebrate when you land your dream internship!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Your Dream Internship?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of students who are already using AI to land their perfect internships.
          </p>
          <Link href="/upload">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="h-6 w-6 text-primary-500" />
              <span className="text-lg font-semibold text-white">AI Internship Hunter</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering students to find their perfect internship with AI technology
            </p>
            <p className="text-sm text-gray-500">
              © 2024 AI Internship Hunter. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}