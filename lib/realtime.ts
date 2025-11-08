import { supabase } from '@/lib/supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeEvent = {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  payload: any
  userId: string
}

export type SubscriptionCallback = (event: RealtimeEvent) => void

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private callbacks: Map<string, Set<SubscriptionCallback>> = new Map()

  // Subscribe to user-specific application updates
  subscribeToApplications(userId: string, callback: SubscriptionCallback): () => void {
    const channelName = `applications_${userId}`

    // Add callback to the set
    if (!this.callbacks.has(channelName)) {
      this.callbacks.set(channelName, new Set())
    }
    this.callbacks.get(channelName)!.add(callback)

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'applications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const event: RealtimeEvent = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'applications',
              schema: 'public',
              payload: payload,
              userId
            }

            // Notify all callbacks for this channel
            const callbacks = this.callbacks.get(channelName)
            if (callbacks) {
              callbacks.forEach(cb => {
                try {
                  cb(event)
                } catch (error) {
                  console.error('Error in realtime callback:', error)
                }
              })
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${channelName}`)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to ${channelName}`)
          }
        })

      this.channels.set(channelName, channel)
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channelName, callback)
    }
  }

  // Subscribe to user-specific internship updates
  subscribeToInternships(userId: string, callback: SubscriptionCallback): () => void {
    const channelName = `internships_${userId}`

    // Add callback to the set
    if (!this.callbacks.has(channelName)) {
      this.callbacks.set(channelName, new Set())
    }
    this.callbacks.get(channelName)!.add(callback)

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'internships',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const event: RealtimeEvent = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'internships',
              schema: 'public',
              payload: payload,
              userId
            }

            // Notify all callbacks for this channel
            const callbacks = this.callbacks.get(channelName)
            if (callbacks) {
              callbacks.forEach(cb => {
                try {
                  cb(event)
                } catch (error) {
                  console.error('Error in realtime callback:', error)
                }
              })
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${channelName}`)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to ${channelName}`)
          }
        })

      this.channels.set(channelName, channel)
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channelName, callback)
    }
  }

  // Subscribe to AI pipeline updates (mock table for status updates)
  subscribeToPipelineUpdates(userId: string, callback: SubscriptionCallback): () => void {
    const channelName = `pipeline_${userId}`

    // Add callback to the set
    if (!this.callbacks.has(channelName)) {
      this.callbacks.set(channelName, new Set())
    }
    this.callbacks.get(channelName)!.add(callback)

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users', // Listen to user updates for pipeline status
            filter: `id=eq.${userId}`
          },
          (payload) => {
            const event: RealtimeEvent = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'users',
              schema: 'public',
              payload: payload,
              userId
            }

            // Notify all callbacks for this channel
            const callbacks = this.callbacks.get(channelName)
            if (callbacks) {
              callbacks.forEach(cb => {
                try {
                  cb(event)
                } catch (error) {
                  console.error('Error in realtime callback:', error)
                }
              })
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${channelName}`)
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to ${channelName}`)
          }
        })

      this.channels.set(channelName, channel)
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channelName, callback)
    }
  }

  // Private method to handle unsubscription
  private unsubscribe(channelName: string, callback: SubscriptionCallback): void {
    const callbacks = this.callbacks.get(channelName)
    if (callbacks) {
      callbacks.delete(callback)

      // If no more callbacks, unsubscribe from channel
      if (callbacks.size === 0) {
        const channel = this.channels.get(channelName)
        if (channel) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
        }
        this.callbacks.delete(channelName)
      }
    }
  }

  // Cleanup all subscriptions
  cleanup(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.callbacks.clear()
  }

  // Get subscription status
  getSubscriptionStatus(): { [key: string]: string } {
    const status: { [key: string]: string } = {}
    this.channels.forEach((channel, name) => {
      // channel may not have a status property, so we assume it's connected
      status[name] = 'connected'
    })
    return status
  }
}

// Create singleton instance
export const realtimeManager = new RealtimeManager()

// React hook for real-time subscriptions
export function useRealtimeSubscription(
  userId: string,
  tables: ('applications' | 'internships' | 'pipeline')[],
  callback: SubscriptionCallback
) {
  if (typeof window === 'undefined') {
    // Don't subscribe on server-side
    return () => {}
  }

  const unsubscribers: (() => void)[] = []

  if (tables.includes('applications')) {
    unsubscribers.push(realtimeManager.subscribeToApplications(userId, callback))
  }

  if (tables.includes('internships')) {
    unsubscribers.push(realtimeManager.subscribeToInternships(userId, callback))
  }

  if (tables.includes('pipeline')) {
    unsubscribers.push(realtimeManager.subscribeToPipelineUpdates(userId, callback))
  }

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsubscribe => unsubscribe())
  }
}

// Utility functions for handling real-time events
export const realtimeUtils = {
  // Check if event is relevant to current user
  isUserEvent: (event: RealtimeEvent, userId: string): boolean => {
    return event.userId === userId
  },

  // Extract relevant data from event
  extractData: (event: RealtimeEvent) => {
    switch (event.type) {
      case 'INSERT':
        return event.payload.new
      case 'UPDATE':
        return event.payload.new
      case 'DELETE':
        return event.payload.old
      default:
        return null
    }
  },

  // Get notification message for event
  getNotificationMessage: (event: RealtimeEvent): string => {
    const data = realtimeUtils.extractData(event)

    if (!data) return ''

    switch (event.table) {
      case 'applications':
        switch (event.type) {
          case 'INSERT':
            return 'New application created'
          case 'UPDATE':
            return `Application status updated to ${data.status}`
          case 'DELETE':
            return 'Application deleted'
          default:
            return 'Application updated'
        }
      case 'internships':
        switch (event.type) {
          case 'INSERT':
            return `New internship match: ${data.title} at ${data.company}`
          case 'UPDATE':
            if (data.match_score !== undefined) {
              return `Match score updated for ${data.title}: ${Math.round((data.match_score || 0) * 100)}%`
            }
            return 'Internship updated'
          case 'DELETE':
            return 'Internship removed'
          default:
            return 'Internship updated'
        }
      default:
        return 'Data updated'
    }
  },

  // Check if event requires immediate attention
  requiresAttention: (event: RealtimeEvent): boolean => {
    if (event.table === 'applications' && event.type === 'UPDATE') {
      const data = realtimeUtils.extractData(event)
      const attentionStatuses = ['reviewing', 'accepted', 'rejected']
      return data && attentionStatuses.includes(data.status)
    }
    return false
  },

  // Get event priority
  getEventPriority: (event: RealtimeEvent): 'high' | 'medium' | 'low' => {
    if (realtimeUtils.requiresAttention(event)) {
      return 'high'
    }
    if (event.table === 'internships' && event.type === 'INSERT') {
      return 'medium'
    }
    return 'low'
  }
}

// Browser-specific utilities
export const browserUtils = {
  // Request notification permission
  requestNotificationPermission: async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  },

  // Show browser notification
  showNotification: (title: string, body: string, priority: 'high' | 'medium' | 'low' = 'medium'): void => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    if (Notification.permission === 'granted') {
      const icon = priority === 'high' ? '/icons/high-priority.png' : '/icons/default.png'
      const notification = new Notification(title, {
        body,
        icon,
        tag: 'ai-internship-hunter',
        requireInteraction: priority === 'high'
      })

      // Auto-close after 5 seconds for non-high priority
      if (priority !== 'high') {
        setTimeout(() => notification.close(), 5000)
      }

      // Handle click
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    }
  }
}