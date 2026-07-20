"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import { Input, PasswordInput } from "./ui/input"
import { Card } from "./ui/card"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../lib/auth"

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()

  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [googleCredential, setGoogleCredential] = useState<string | null>(null)
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', ''])
  const pinRefs = useRef<HTMLInputElement[]>([])
  const [hasSavedPin, setHasSavedPin] = useState<boolean | null>(null)

  useEffect(() => {
    if (showPinModal) {
      setTimeout(() => { try { pinRefs.current[0]?.focus() } catch (err) { console.debug('focus pin failed', err) } }, 100)
    }
  }, [showPinModal])
  const [googleLoading, setGoogleLoading] = useState(false)
  const [setPinForFuture, setSetPinForFuture] = useState(true)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
    if (!clientId) return

    function setRenderedButtonFullWidth() {
      try {
        const root = googleButtonRef.current
        if (!root) return
        const btn = root.querySelector('button') as HTMLButtonElement | null
        if (btn) {
          btn.style.setProperty('width', '100%', 'important')
          btn.style.display = 'flex'
          btn.style.justifyContent = 'center'
          btn.setAttribute('type', 'button')
          btn.classList.add('w-full')
        }
      } catch (err) {
        console.debug('setRenderedButtonFullWidth failed', err)
      }
    }

    let observer: MutationObserver | null = null
    function observeAndEnsureFullWidth() {
      setRenderedButtonFullWidth()
      try {
        const root = googleButtonRef.current
        if (!root) return
        if (observer) observer.disconnect()
        observer = new MutationObserver(() => setRenderedButtonFullWidth())
        observer.observe(root, { childList: true, subtree: true })
      } catch (err) {
        console.debug('observeAndEnsureFullWidth failed', err)
      }
    }
    function handleCredentialResponse(response: any) {
      if (response && response.credential) {
        const cred = response.credential
        if (auth.checkGoogleCredential) {
          auth.checkGoogleCredential(cred).then((info) => {
            setHasSavedPin(info.hasPin)
            setGoogleCredential(cred)
            setShowPinModal(true)
          }).catch((err) => {
            console.debug('check google credential failed', err)
            setHasSavedPin(false)
            setGoogleCredential(cred)
            setShowPinModal(true)
          })
        } else {
          setHasSavedPin(null)
          setGoogleCredential(cred)
          setShowPinModal(true)
        }
      }
    }

    if (!(window as any).google) {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = () => {
        try {
          ;(window as any).google.accounts.id.initialize({ client_id: clientId, callback: handleCredentialResponse })
          if (googleButtonRef.current) {
            ;(window as any).google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large' })
            observeAndEnsureFullWidth()
          }
        } catch (err) {
          console.debug('google init failed', err)
        }
      }
      document.head.appendChild(s)
    } else {
      try {
        ;(window as any).google.accounts.id.initialize({ client_id: clientId, callback: handleCredentialResponse })
        if (googleButtonRef.current) {
          ;(window as any).google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large' })
          observeAndEnsureFullWidth()
        }
      } catch (err) { console.debug('google render failed', err) }
    }

    return () => {
      try {
        if (observer) observer.disconnect()
      } catch (e) {}
    }
  }, [auth])

  async function handleGooglePinSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!googleCredential) return
    const pin = pinDigits.join('')
    if (!pin || pin.length !== 4) {
      setError('Please enter your 4-digit PIN')
      return
    }
    setGoogleLoading(true)
    setError(null)
    try {
      if (!auth.loginWithGoogle) throw new Error('Google login not supported')
      await auth.loginWithGoogle(googleCredential, pin, setPinForFuture, remember)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Google sign-in failed')
    } finally {
      setGoogleLoading(false)
      setShowPinModal(false)
      setPinDigits(['', '', '', ''])
      setGoogleCredential(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password.trim()) {
      setError("Please provide both email and password.")
      return
    }
    setLoading(true)

    try {
      await auth.login(email.trim(), password, remember)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative shrink-0">
        <img
          src="/spirals.webp"
          alt="CareReport"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-10 text-white">
          <h2 className="text-3xl font-bold tracking-tight">Care Report</h2>
          <p className="mt-2 text-sm text-white/80 max-w-sm">Modern healthcare management for doctors and organizations.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 lg:px-16 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to Care Report</p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@clinic.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-input"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground">Remember me</label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="space-y-2">
              <div ref={googleButtonRef} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">A PIN will be required for Google sign-in.</p>
            </div>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="pin-modal-title" onKeyDown={(e) => { if (e.key === 'Escape') { setShowPinModal(false); setGoogleCredential(null); setPinDigits(['', '', '', '']) } }}>
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowPinModal(false); setGoogleCredential(null); setPinDigits(['', '', '', '']) }} />
          <div className="relative w-full max-w-sm mx-4 bg-card border rounded-lg shadow-lg p-6">
            <button aria-label="Close dialog" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground text-lg" onClick={() => { setShowPinModal(false); setGoogleCredential(null); setPinDigits(['', '', '', '']) }}>×</button>
            <div className="text-center mb-4">
              <h3 id="pin-modal-title" className="text-lg font-semibold text-foreground">{hasSavedPin ? 'Enter your PIN' : 'Create a 4-digit PIN'}</h3>
              <p className="text-sm text-muted-foreground mt-1">{hasSavedPin ? 'Enter the 4-digit PIN for your account.' : 'Create a PIN to protect your Google sign-in.'}</p>
            </div>
            <form onSubmit={handleGooglePinSubmit} className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                {[0,1,2,3].map((i) => (
                  <input
                    key={i}
                    ref={(el) => { if (el) pinRefs.current[i] = el }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={pinDigits[i]}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '').slice(0,1)
                      setPinDigits(prev => {
                        const next = [...prev]
                        next[i] = v
                        return next
                      })
                      if (v && pinRefs.current[i+1]) pinRefs.current[i+1].focus()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        if (pinDigits[i]) {
                          setPinDigits(prev => {
                            const next = [...prev]
                            next[i] = ''
                            return next
                          })
                        } else if (pinRefs.current[i-1]) {
                          pinRefs.current[i-1].focus()
                          setPinDigits(prev => {
                            const next = [...prev]
                            next[i-1] = ''
                            return next
                          })
                        }
                      } else if (e.key === 'ArrowLeft' && pinRefs.current[i-1]) {
                        pinRefs.current[i-1].focus()
                      } else if (e.key === 'ArrowRight' && pinRefs.current[i+1]) {
                        pinRefs.current[i+1].focus()
                      }
                    }}
                    className="w-12 h-12 text-center text-lg font-semibold rounded-md border bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                    aria-label={`PIN digit ${i+1}`}
                  />
                ))}
              </div>
              {!hasSavedPin && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={setPinForFuture} onChange={(e) => setSetPinForFuture(e.target.checked)} className="w-4 h-4 rounded border-input" />
                  Save this PIN for future Google sign-ins
                </label>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setShowPinModal(false); setGoogleCredential(null); setPinDigits(['', '', '', '']) }}>Cancel</Button>
                <Button type="submit" disabled={googleLoading || pinDigits.some(d => d === '')}>
                  {googleLoading ? 'Signing in…' : 'Continue'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
