import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('applications')
      .select(`
        *,
        internships (
          id,
          title,
          company,
          location,
          link,
          description,
          requirements,
          salary_range,
          posted_date,
          deadline,
          match_score
        )
      `)
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: applications, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('status', status || undefined)

    return NextResponse.json({
      success: true,
      applications: applications || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      }
    })

  } catch (error) {
    console.error('Applications API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, internship_id, status, cover_letter, notes } = body

    // Validate required fields
    if (!user_id || !internship_id) {
      return NextResponse.json(
        { error: 'User ID and Internship ID are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'submitted', 'reviewing', 'accepted', 'rejected']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid options: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if application already exists
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', user_id)
      .eq('internship_id', internship_id)
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Application already exists' },
        { status: 409 }
      )
    }

    // Create new application
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        user_id,
        internship_id,
        status: status || 'pending',
        cover_letter: cover_letter || null,
        notes: notes || null,
        applied_on: status === 'submitted' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application
    })

  } catch (error) {
    console.error('Create application API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { application_id, user_id, status, notes, cover_letter } = body

    // Validate required fields
    if (!application_id || !user_id) {
      return NextResponse.json(
        { error: 'Application ID and User ID are required' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'submitted', 'reviewing', 'accepted', 'rejected']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Valid options: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Check if application exists and belongs to user
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .eq('user_id', user_id)
      .single()

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Update application
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      if (status === 'submitted' && !existingApplication.applied_on) {
        updateData.applied_on = new Date().toISOString()
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (cover_letter !== undefined) {
      updateData.cover_letter = cover_letter
    }

    const { data: application, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', application_id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application
    })

  } catch (error) {
    console.error('Update application API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const application_id = searchParams.get('application_id')
    const user_id = searchParams.get('user_id')

    // Validate required parameters
    if (!application_id || !user_id) {
      return NextResponse.json(
        { error: 'Application ID and User ID are required' },
        { status: 400 }
      )
    }

    // Check if application exists and belongs to user
    const { data: existingApplication } = await supabase
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .eq('user_id', user_id)
      .single()

    if (!existingApplication) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Delete application
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', application_id)
      .eq('user_id', user_id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    })

  } catch (error) {
    console.error('Delete application API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}