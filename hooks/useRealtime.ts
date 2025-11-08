'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRealtimeSubscription, realtimeUtils, browserUtils } from '@/lib/realtime'
import { RealtimeEvent } from '@/lib/realtime'

interface UseRealtimeOptions {
  userId: string
  tables: ('applications' | 'internships' | 'pipeline')[]
  enableNotifications?: boolean
  onEvent?: (event: RealtimeEvent) => void
}

interface RealtimeState {
  isConnected: boolean
  lastEvent: RealtimeEvent | null
  unreadCount: number
  events: RealtimeEvent[]
}

export function useRealtime(options: UseRealtimeOptions) {
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    lastEvent: null,
    unreadCount: 0,
    events: []
  })

  const unsubscribeRef = useRef<(() => void) | null>(null)

  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    // Update state
    setState(prev => ({
      isConnected: true,
      lastEvent: event,
      unreadCount: prev.unreadCount + 1,
      events: [event, ...prev.events].slice(0, 50) // Keep last 50 events
    }))

    // Show notification if enabled
    if (options.enableNotifications) {
      const message = realtimeUtils.getNotificationMessage(event)
      const priority = realtimeUtils.getEventPriority(event)

      browserUtils.showNotification(
        'AI Internship Hunter',
        message,
        priority
      )
    }

    // Call custom callback
    if (options.onEvent) {
      options.onEvent(event)
    }
  }, [options.enableNotifications, options.onEvent])

  useEffect(() => {
    if (!options.userId) {
      return
    }

    // Request notification permission if needed
    if (options.enableNotifications) {
      browserUtils.requestNotificationPermission()
    }

    // Set up subscription
    unsubscribeRef.current = useRealtimeSubscription(
      options.userId,
      options.tables,
      handleRealtimeEvent
    )

    // Mark as connected after a short delay
    const connectionTimer = setTimeout(() => {
      setState(prev => ({ ...prev, isConnected: true }))
    }, 1000)

    return () => {
      clearTimeout(connectionTimer)
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [options.userId, options.tables, handleRealtimeEvent])

  const markAsRead = useCallback(() => {
    setState(prev => ({ ...prev, unreadCount: 0 }))
  }, [])

  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [] }))
  }, [])

  return {
    ...state,
    markAsRead,
    clearEvents
  }
}

// Hook for application-specific real-time updates
export function useApplicationsRealtime(userId: string, options: { enableNotifications?: boolean } = {}) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case 'INSERT':
        setApplications(prev => [event.payload.new, ...prev])
        break
      case 'UPDATE':
        setApplications(prev =>
          prev.map(app =>
            app.id === event.payload.new.id
              ? { ...app, ...event.payload.new }
              : app
          )
        )
        break
      case 'DELETE':
        setApplications(prev =>
          prev.filter(app => app.id !== event.payload.old.id)
        )
        break
    }
    setLoading(false)
  }, [])

  const realtime = useRealtime({
    userId,
    tables: ['applications'],
    enableNotifications: options.enableNotifications,
    onEvent: handleEvent
  })

  return {
    applications,
    loading,
    ...realtime
  }
}

// Hook for internship-specific real-time updates
export function useInternshipsRealtime(userId: string, options: { enableNotifications?: boolean } = {}) {
  const [internships, setInternships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case 'INSERT':
        setInternships(prev => [event.payload.new, ...prev])
        break
      case 'UPDATE':
        setInternships(prev =>
          prev.map(internship =>
            internship.id === event.payload.new.id
              ? { ...internship, ...event.payload.new }
              : internship
          )
        )
        break
      case 'DELETE':
        setInternships(prev =>
          prev.filter(internship => internship.id !== event.payload.old.id)
        )
        break
    }
    setLoading(false)
  }, [])

  const realtime = useRealtime({
    userId,
    tables: ['internships'],
    enableNotifications: options.enableNotifications,
    onEvent: handleEvent
  })

  return {
    internships,
    loading,
    ...realtime
  }
}

// Hook for pipeline status updates
export function usePipelineRealtime(userId: string, options: { enableNotifications?: boolean } = {}) {
  const [pipelineStatus, setPipelineStatus] = useState({
    scraping: 'idle',
    matching: 'idle',
    generating: 'idle'
  })

  const handleEvent = useCallback((event: RealtimeEvent) => {
    // Handle pipeline-specific updates
    if (event.table === 'users' && event.type === 'UPDATE') {
      const data = event.payload.new
      if (data.pipeline_status) {
        setPipelineStatus(prev => ({
          ...prev,
          ...data.pipeline_status
        }))
      }
    }
  }, [])

  const realtime = useRealtime({
    userId,
    tables: ['pipeline'],
    enableNotifications: options.enableNotifications,
    onEvent: handleEvent
  })

  return {
    pipelineStatus,
    ...realtime
  }
}