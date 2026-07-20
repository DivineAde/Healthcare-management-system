"use client"

import { useState, useEffect } from "react"
import Sidebar from "./sidebar"
import Header from "./dashboard-header"
import { Outlet } from "react-router-dom"
import NotificationCenter from "./NotificationCenter"
import type { Notification } from "./NotificationCenter"
import { useSocket } from "@/lib/useSocket"
import { useAuth } from "@/lib/auth"

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])
  const [toastNotifications, setToastNotifications] = useState<Notification[]>([])
  const { socket, isConnected } = useSocket()
  const { authFetch } = useAuth()

  // Listen for real-time patient assignment notifications
  useEffect(() => {
    if (!socket) return

    const handlePatientAssigned = async (data: {
      patientId: string
      patientName: string
      patientAge?: number
      assignedBy: string
      organizationName: string
      timestamp: string
      message: string
    }) => {
      try {
        const response = await authFetch('/api/notifications')
        if (response.ok) {
          const result = await response.json()
          const latestNotification = result.notifications[0]

          if (latestNotification && latestNotification.data.patientId === data.patientId) {
            const newNotification: Notification = {
              id: latestNotification.id,
              type: latestNotification.type,
              title: latestNotification.title,
              message: latestNotification.message,
              timestamp: new Date(latestNotification.timestamp),
              read: latestNotification.read,
              autoClose: true,
              duration: 8000,
              data: latestNotification.data
            }

            setAllNotifications((prev) => {
              const exists = prev.some(n => n.id === newNotification.id)
              if (exists) return prev
              return [newNotification, ...prev]
            })

            setToastNotifications((prev) => [newNotification, ...prev])

            try {
              const audio = new Audio('/notification.mp3')
              audio.volume = 0.3
              audio.play().catch(() => {})
            } catch {
              // ignore
            }
          }
        }
      } catch {
        const notificationId = `notification-${Date.now()}-${Math.random()}`
        const newNotification: Notification = {
          id: notificationId,
          type: 'patient-assigned',
          title: 'New Patient Assigned',
          message: data.message,
          timestamp: new Date(data.timestamp),
          autoClose: true,
          duration: 8000,
          data: {
            patientId: data.patientId,
            patientName: data.patientName,
            patientAge: data.patientAge,
            assignedBy: data.assignedBy,
            organizationName: data.organizationName,
          },
        }

        setAllNotifications((prev) => [newNotification, ...prev])
        setToastNotifications((prev) => [newNotification, ...prev])
      }
    }

    socket.on('patient:assigned', handlePatientAssigned)

    return () => {
      socket.off('patient:assigned', handlePatientAssigned)
    }
  }, [socket, authFetch])

  // Fetch notifications from database on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await authFetch('/api/notifications')
        if (!response.ok) return

        const data = await response.json()
        const notifications: Notification[] = (data.notifications || []).map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: new Date(n.timestamp),
          read: n.read,
          autoClose: false,
          data: n.data || {}
        }))

        setAllNotifications(notifications)
      } catch {
        // ignore
      }
    }

    fetchNotifications()
  }, [authFetch])

  const removeToastNotification = (id: string) => {
    setToastNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const removeNotification = async (id: string) => {
    setAllNotifications((prev) => prev.filter((n) => n.id !== id))
    setToastNotifications((prev) => prev.filter((n) => n.id !== id))

    try {
      await authFetch(`/api/notifications/${id}`, { method: 'DELETE' })
    } catch {
      // ignore
    }
  }

  const clearAllNotifications = async () => {
    setAllNotifications([])
    setToastNotifications([])

    try {
      await authFetch('/api/notifications', { method: 'DELETE' })
    } catch {
      // ignore
    }
  }

  const getTodaysNotifications = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return allNotifications.filter(n => {
      const notifDate = new Date(n.timestamp)
      notifDate.setHours(0, 0, 0, 0)
      return notifDate.getTime() === today.getTime()
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <NotificationCenter notifications={toastNotifications} onRemove={removeToastNotification} />

      {!isConnected && (
        <div className="fixed bottom-4 right-4 z-50 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-3 py-2 rounded-md text-xs">
          Real-time notifications offline. Refresh to reconnect.
        </div>
      )}

      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        notifications={getTodaysNotifications()}
        onClearNotifications={clearAllNotifications}
        onRemoveNotification={removeNotification}
      />

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${
        sidebarOpen ? 'md:ml-64' : 'md:ml-0'
      }`}>
        <Header
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          notifications={getTodaysNotifications()}
          onClearNotifications={clearAllNotifications}
          onRemoveNotification={removeNotification}
        />

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl w-full mx-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
