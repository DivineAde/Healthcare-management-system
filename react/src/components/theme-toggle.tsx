"use client"

import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { MoonIcon, SunIcon } from "./ui/icons"

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null)

  useEffect(() => {
    // Determine initial theme: read localStorage or system preference
    try {
      const stored = localStorage.getItem('theme')
      if (stored === 'dark') {
        document.documentElement.classList.add('dark')
        setIsDark(true)
        return
      }
      if (stored === 'light') {
        document.documentElement.classList.remove('dark')
        setIsDark(false)
        return
      }

      // fallback to system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
        setIsDark(true)
      } else {
        document.documentElement.classList.remove('dark')
        setIsDark(false)
      }
    } catch (e) {
      // ignore
      setIsDark(false)
    }
  }, [])

  function toggle() {
    try {
      const now = !(isDark ?? false)
      setIsDark(now)
      if (now) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
    } catch (e) {
      // ignore
    }
  }

  // Render nothing until we know the theme to avoid hydration mismatch
  if (isDark === null) return null

  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme">
      {isDark ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
    </Button>
  )
}
