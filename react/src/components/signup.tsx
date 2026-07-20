"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input, PasswordInput } from "./ui/input"
import { Card } from "./ui/card"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from '../lib/auth'

export function Signup() {
  const navigate = useNavigate()
  const [role, setRole] = useState<"doctor" | "organization">("doctor")

  const [doctorName, setDoctorName] = useState("")
  const [license, setLicense] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [selectedOrg, setSelectedOrg] = useState("")
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    let mounted = true
    async function loadOrgs() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/organizations`)
        if (!res.ok) return
        const data = await res.json()
        if (mounted && Array.isArray(data.organizations)) setOrgOptions(data.organizations)
      } catch {
        // ignore
      }
    }
    loadOrgs()
    return () => { mounted = false }
  }, [])

  const [orgName, setOrgName] = useState("")
  const [adminName, setAdminName] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordChecks, setPasswordChecks] = useState({
    upper: false,
    lower: false,
    digit: false,
    symbol: false,
    length: false,
  })
  const [passwordValid, setPasswordValid] = useState(false)
  const auth = useAuth()

  useEffect(() => {
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSymbol = /[^A-Za-z0-9]/.test(password)
    const meetsLength = password.length >= 8

    setPasswordChecks({
      upper: hasUpper,
      lower: hasLower,
      digit: hasDigit,
      symbol: hasSymbol,
      length: meetsLength,
    })

    setPasswordValid(hasUpper && hasLower && hasDigit && hasSymbol && meetsLength)
  }, [password])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (role === "doctor") {
      if (!doctorName.trim() || !email.trim() || !password.trim()) {
        setError("Please complete your name, email and password.")
        return
      }
      if (!selectedOrg) {
        setError("Please select your organization from the list.")
        return
      }
    } else {
      if (!orgName.trim() || !adminName.trim() || !email.trim() || !password.trim()) {
        setError("Please complete organization name, admin name, email and password.")
        return
      }
    }

    if (!passwordValid) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.")
      return
    }

    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const payload = role === "doctor"
        ? { email, password, role, profile: { name: doctorName, license, specialty, organizationId: selectedOrg } }
        : { email, password, role, profile: { organization: orgName, admin: adminName } }

      await auth.signup(payload)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Signup failed')
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Create an account</h1>
            <p className="text-sm text-muted-foreground">Get started with CareReport</p>
          </div>

          <Card className="p-6">
            <div className="flex rounded-md border mb-6">
              <button
                type="button"
                onClick={() => setRole("doctor")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  role === "doctor"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => setRole("organization")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  role === "organization"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Organization
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              {role === "doctor" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="doctorName">Full name *</label>
                    <Input
                      id="doctorName"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Dr. Jane Smith"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="license">License (optional)</label>
                      <Input
                        id="license"
                        value={license}
                        onChange={(e) => setLicense(e.target.value)}
                        placeholder="License #"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="specialty">Specialty (optional)</label>
                      <Input
                        id="specialty"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Cardiology"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="org">Organization *</label>
                    <select
                      id="org"
                      value={selectedOrg}
                      onChange={(e) => setSelectedOrg(e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                    >
                      <option value="">Select organization...</option>
                      {orgOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="orgName">Organization name *</label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Your Clinic or Hospital"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="adminName">Admin contact *</label>
                    <Input
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Administrator name"
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">Email *</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.org"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="password">Password *</label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="confirm">Confirm *</label>
                  <PasswordInput
                    id="confirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              {password && (
                <div className="text-xs space-y-1 border rounded-md p-3">
                  <div className="font-medium text-foreground mb-1">Password must include:</div>
                  {[
                    { key: "upper", label: "An uppercase letter (A-Z)" },
                    { key: "lower", label: "A lowercase letter (a-z)" },
                    { key: "digit", label: "A number (0-9)" },
                    { key: "symbol", label: "A symbol (e.g. !@#$)" },
                    { key: "length", label: "At least 8 characters" },
                  ].map(({ key, label }) => {
                    const met = passwordChecks[key as keyof typeof passwordChecks]
                    return (
                      <div key={key} className={`flex items-center gap-2 ${met ? 'text-muted-foreground line-through' : 'text-destructive'}`}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: met ? 'var(--primary)' : 'var(--destructive)' }} />
                        <span>{label}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (role === 'doctor' ? 'Creating account…' : 'Setting up org…') : 'Create account'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By continuing you agree to our{" "}
                <a href="#" className="text-primary hover:underline">Terms</a>
                {" "}and{" "}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
