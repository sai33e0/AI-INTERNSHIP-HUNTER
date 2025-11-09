'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, Github, Linkedin, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUpload } from '@/components/ui/FileUpload'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabaseClient'

interface FormData {
  name: string
  email: string
  github_url: string
  linkedin_url: string
}

export default function UploadPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState<'form' | 'uploading' | 'success'>('form')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>()

  const handleFileSelect = (file: File) => {
    setResumeFile(file)
  }

  const uploadResumeToStorage = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/resume.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const onSubmit = async (data: FormData) => {
    if (!resumeFile) {
      toast.error('Please upload your resume')
      return
    }

    setIsUploading(true)
    setUploadStep('uploading')

    try {
      // Create user profile using server-side API to bypass RLS
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          github_url: data.github_url || null,
          linkedin_url: data.linkedin_url || null,
        }),
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      const { user: userData } = await userResponse.json()
      var userId = userData.id

      // Upload resume
      const resumeUrl = await uploadResumeToStorage(resumeFile, userId)

      // Update user with resume URL
      const { error: resumeError } = await supabase
        .from('users')
        .update({ resume_url: resumeUrl })
        .eq('id', userId)

      if (resumeError) throw resumeError

      setUploadStep('success')
      toast.success('Profile uploaded successfully!')

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload profile')
      setUploadStep('form')
    } finally {
      setIsUploading(false)
    }
  }

  if (uploadStep === 'uploading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploading Your Profile</h3>
            <p className="text-gray-600">Please wait while we process your information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (uploadStep === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Created Successfully!</h3>
            <p className="text-gray-600 mb-6">
              Your AI internship hunt is ready to begin. Our system will now start matching you with perfect opportunities.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="text-center">
            <Upload className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Profile</h1>
            <p className="text-gray-600">
              Upload your resume and connect your profiles to start your AI-powered internship search
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Tell us about yourself so we can find the best matches for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={errors.email?.message}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Profiles</CardTitle>
              <CardDescription>
                Connect your professional profiles to help AI understand your skills better
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="GitHub Profile URL"
                placeholder="https://github.com/username"
                {...register('github_url', {
                  pattern: {
                    value: /^https?:\/\/(www\.)?github\.com\/[\w-]+(\/?|\/[\w-]*)?$/,
                    message: 'Please enter a valid GitHub URL'
                  }
                })}
                error={errors.github_url?.message}
                icon={<Github className="h-4 w-4 text-gray-400" />}
              />

              <Input
                label="LinkedIn Profile URL"
                placeholder="https://linkedin.com/in/username"
                {...register('linkedin_url', {
                  pattern: {
                    value: /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w.-]+\/?$/,
                    message: 'Please enter a valid LinkedIn URL'
                  }
                })}
                error={errors.linkedin_url?.message}
                icon={<Linkedin className="h-4 w-4 text-gray-400" />}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resume Upload</CardTitle>
              <CardDescription>
                Upload your current resume (PDF, DOC, or DOCX format)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.doc,.docx"
                maxSize={5}
                label="Upload Resume"
                helperText="Drag and drop your resume here or click to browse"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href="/">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              loading={isUploading}
              disabled={!resumeFile || isUploading}
            >
              {isUploading ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}