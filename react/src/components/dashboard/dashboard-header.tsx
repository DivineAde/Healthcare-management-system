"use client"

import { Link } from "react-router-dom"
import { Menu, Search, Settings, Bell, X, UserPlus, CheckCircle, AlertCircle, Info } from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import type { Notification } from "./NotificationCenter"

interface HeaderProps {
  onSidebarToggle: () => void
  notifications?: Notification[]
  onClearNotifications?: () => void
  onRemoveNotification?: (id: string) => void
}

const traditionalCatalog = [
  { id: 'trad-1', ayush: 'Unmada', ayushSystem: 'Ayurveda', icd: '6A00', title: 'Psychotic disorder (example)', description: 'Traditional term mapped to ICD-11.' },
  { id: 'trad-2', ayush: 'Chitta-Vikriti', ayushSystem: 'NAMASTE', icd: 'MB24.0', title: 'Depressive episode (example)', description: 'Traditional depressive presentation.' },
  { id: 'trad-3', ayush: 'Prana-Vikriti', ayushSystem: 'Ayurveda', icd: '6A40', title: 'Anxiety disorder (example)', description: 'Anxiety-like concept mapped.' }
]

export default function Header({ onSidebarToggle, notifications = [], onClearNotifications, onRemoveNotification }: HeaderProps) {
  const [query, setQuery] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { user, authFetch } = useAuth()

  const unreadCount = notifications.length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'patient-assigned':
        return <UserPlus className="w-4 h-4" />
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      case 'warning':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const formatNotificationTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getUserInitials = (name?: string, email?: string, userRole?: string, adminName?: string) => {
    if (userRole === 'organization' && adminName) {
      const parts = adminName.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) {
        return `${parts[0][0]?.toUpperCase() || 'A'}${parts[1][0]?.toUpperCase() || ''}`
      }
      return `${parts[0]?.[0]?.toUpperCase() || 'A'}${parts[0]?.[1]?.toUpperCase() || ''}`
    }

    if (!name || name.trim().length === 0) return (email && email[0]?.toUpperCase()) || 'D'

    const titles = new Set(['dr', 'dr.', 'doctor'])
    const parts = name.split(/\s+/).filter(Boolean).filter(p => !titles.has(p.toLowerCase()))
    if (parts.length === 0) return (email && email[0]?.toUpperCase()) || 'D'
    if (parts.length === 1) {
      const first = parts[0][0]?.toUpperCase() || 'D'
      return `D${first}`
    }
    const a = parts[0][0]?.toUpperCase() || 'D'
    const b = parts[1][0]?.toUpperCase() || ''
    return `${a}${b}`
  }

  useEffect(() => {
    const fetchOrganizationName = async () => {
      if (!user) {
        setProfileLoading(false)
        return
      }

      try {
        setProfileLoading(true)

        if (user.role === 'organization') {
          const orgName = (user.profile as any)?.organization
          setOrganizationName(orgName || 'Unknown Organization')
        }
        else if (user.role === 'doctor') {
          const orgId = (user.profile as any)?.organizationId
          if (orgId) {
            try {
              const orgResponse = await authFetch(`/api/organizations/${orgId}`)
              if (orgResponse.ok) {
                const orgData = await orgResponse.json()
                setOrganizationName(orgData.name || 'Unknown Organization')
              } else {
                setOrganizationName('Unknown Organization')
              }
            } catch {
              setOrganizationName('Unknown Organization')
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setProfileLoading(false)
      }
    }

    fetchOrganizationName()
  }, [user, authFetch])

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const filteredTraditional = traditionalCatalog.filter((d) => {
      const q = query.toLowerCase()
      return (d.title.toLowerCase().includes(q) || d.ayush.toLowerCase().includes(q) || d.icd.toLowerCase().includes(q))
    })

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://clinicaltables.nlm.nih.gov/api/icd11_codes/v3/search?terms=${encodeURIComponent(query)}&maxList=7`)
        const data = await res.json()
        const codes = data[1]
        const titles = data[3].map((entry: string[]) => entry[1])
        const apiResults = codes.map((code: string, idx: number) => ({
          id: `icd-${code}`,
          icd: code,
          title: titles[idx],
          description: 'ICD-11 official terminology',
          source: 'ICD-11'
        }))

        const combined = [...filteredTraditional.map(t => ({ ...t, source: 'Traditional' })), ...apiResults]
        setSearchResults(combined)
        setLoading(false)
        setShowResults(true)
      } catch {
        setSearchResults(filteredTraditional.map(t => ({ ...t, source: 'Traditional' })))
        setLoading(false)
        setShowResults(true)
      }
    }, 400)
  }, [query])

  return (
    <header className="h-12 border-b bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-3 flex-1">
        <Button variant="ghost" size="sm" onClick={onSidebarToggle} className="md:hidden">
          <Menu className="w-4 h-4" />
        </Button>

        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowResults(true) }}
            placeholder="Search patients, codes..."
            className="pl-8 h-8 text-sm"
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            autoComplete="off"
          />
          {showResults && query.trim() && (
            <div className="absolute left-0 top-full mt-1 w-full z-10 bg-popover border rounded-md shadow-md max-h-72 overflow-auto">
              {loading && <div className="p-3 text-xs text-muted-foreground">Loading...</div>}
              {searchResults.length === 0 && !loading && (
                <div className="p-3 text-xs text-muted-foreground">No results found</div>
              )}
              {searchResults.length > 0 && (
                <ul>
                  {searchResults.map(result => (
                    <li key={result.id} className="border-b last:border-b-0">
                      <button
                        type="button"
                        className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex flex-col"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{result.title}</span>
                          <span className="text-xs rounded px-1.5 py-0.5 bg-muted text-muted-foreground ml-2">
                            {result.icd}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{result.description}</span>
                        <span className="text-xs text-muted-foreground">{result.source === "Traditional" ? result.ayushSystem : "ICD-11"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        {user?.role === 'doctor' && (
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}
              onBlur={() => setTimeout(() => setShowNotifications(false), 200)}
              aria-label="View notifications"
              className="relative w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed md:absolute right-2 md:right-0 left-2 md:left-auto top-12 md:top-full mt-0 md:mt-1 w-auto md:w-80 bg-popover border rounded-md shadow-md z-50">
                <div className="p-3 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && onClearNotifications && (
                    <button onClick={(e) => { e.stopPropagation(); onClearNotifications() }} className="text-xs text-primary hover:underline">
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-3 hover:bg-muted/50 transition-colors relative group">
                          <button
                            onClick={(e) => { e.stopPropagation(); onRemoveNotification?.(notification.id) }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                            aria-label="Dismiss"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="flex gap-2 pr-5">
                            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium leading-tight">{notification.title}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                              {notification.data?.patientName && (
                                <div className="flex items-center gap-2 text-xs mt-1">
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                    {notification.data.patientName as string}
                                  </span>
                                  {notification.data.patientAge && (
                                    <span className="text-muted-foreground">Age: {notification.data.patientAge}</span>
                                  )}
                                </div>
                              )}
                              <span className="text-xs text-muted-foreground/70 mt-1 block">{formatNotificationTime(notification.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
            onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
            aria-label="Open user menu"
            className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary font-medium text-xs transition-colors"
          >
            {getUserInitials(
              (user?.profile as any)?.name,
              user?.email,
              user?.role,
              (user?.profile as any)?.admin
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-popover border rounded-md shadow-md z-50">
              <div className="p-3 border-b">
                <div className="font-medium text-sm text-foreground truncate">
                  {user?.role === 'organization'
                    ? (user?.profile as any)?.admin || 'Admin'
                    : (user?.profile as any)?.name || 'User'
                  }
                </div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {profileLoading ? (
                    <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                  ) : organizationName || 'HealthSync'}
                </div>
              </div>
              <div className="p-1">
                <Link
                  to="/dashboard/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm hover:bg-muted transition-colors text-sm"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
