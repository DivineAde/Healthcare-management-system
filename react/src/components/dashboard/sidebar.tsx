"use client"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, Home, BookOpen, Users, Settings, Search, LogOut, Bell, Info, AlertCircle, CheckCircle, UserPlus, FileText, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "../ui/input"
import ThemeToggle from "../theme-toggle"
import { useAuth } from "@/lib/auth"
import { useState } from "react"
import type { Notification } from "./NotificationCenter"

function LogoutButton() {
  const { logout } = useAuth()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
      onClick={() => void logout()}
      aria-label="Logout"
    >
      <LogOut className="w-4 h-4" />
      <span className="text-sm">Logout</span>
    </Button>
  )
}

interface SidebarProps {
  open: boolean
  onToggle: () => void
  notifications?: Notification[]
  onClearNotifications?: () => void
  onRemoveNotification?: (id: string) => void
}

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/icd11", label: "ICD-11 Codes", icon: BookOpen },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
]

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

export default function Sidebar({ open, onToggle, notifications = [], onClearNotifications, onRemoveNotification }: SidebarProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const location = useLocation()
  const pathname = location.pathname
  const { user } = useAuth()
  const unreadCount = notifications.length

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex md:fixed md:top-0 md:left-0 md:h-screen w-64 flex-col bg-card border-r z-40 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-64"
        }`}
      >
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Care Report</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 h-9 text-sm font-medium"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            )
          })}
          <Link to="/dashboard/settings">
            <Button
              variant={pathname === '/dashboard/settings' ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 h-9 text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </Link>
        </nav>

        <div className="p-3 border-t">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-card border-b flex items-center px-4 gap-3">
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-8 h-8 text-sm" />
        </div>
        <ThemeToggle />
        {user?.role === 'doctor' && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
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
              <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-md shadow-md z-50">
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
      </div>

      {/* Mobile Sidebar Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/50" onClick={onToggle} />
          <div className="relative w-64 h-screen bg-card border-r flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-bold text-foreground">Care Report</span>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} to={item.href} onClick={onToggle}>
                    <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-2 h-9 text-sm font-medium">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
              <Link to="/dashboard/settings" onClick={onToggle}>
                <Button variant={pathname === '/dashboard/settings' ? "secondary" : "ghost"} className="w-full justify-start gap-2 h-9 text-sm font-medium">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </Link>
            </nav>
            <div className="p-3 border-t">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
