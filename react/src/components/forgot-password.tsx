"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card } from "./ui/card"
import { Link, useNavigate } from "react-router-dom"
import { Header } from "./header"
import { Footer } from "./footer"
import { ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react"

export function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000'

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send OTP')
      }

      setSuccessMessage('OTP sent to your email. Please check your inbox.')
      setStep('otp')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          otp: otp.trim(), 
          newPassword 
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to reset password')
      }

      setStep('success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <Card className="p-8 backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl">
          {/* Back to Login */}
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          {/* Step 1: Enter Email */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Forgot Password?</h1>
                <p className="text-muted-foreground mt-2">
                  Enter your email and we'll send you an OTP to reset your password
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/50 text-green-600 text-sm">
                    {successMessage}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </form>
            </>
          )}

          {/* Step 2: Enter OTP and New Password */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
                <p className="text-muted-foreground mt-2">
                  Enter the OTP sent to <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-2">
                    OTP Code
                  </label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    disabled={loading}
                    maxLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Didn't receive OTP? Send again
                </button>
              </form>
            </>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <>
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Password Reset Successful!</h1>
                <p className="text-muted-foreground mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button 
                  onClick={() => navigate('/login')} 
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <Footer />
    </main>
  )
}

export default ForgotPassword
