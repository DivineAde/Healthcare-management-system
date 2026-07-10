"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, BarChart3, CalendarClock, RefreshCw, Stethoscope, UserCheck, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"

type Patient = {
  id: string
  name?: string
  age?: number
  disease?: string
  icd11?: string
  createdAt?: string
}

type Diagnosis = {
  id: string
  patientId?: string
  patientName?: string
  disease?: string | null
  icd11?: string | null
  createdAt?: string | null
}

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" })

function isValidDate(value?: string | null) {
  if (!value) return false
  return !Number.isNaN(new Date(value).getTime())
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getAgeGroup(age?: number) {
  if (!age || Number.isNaN(age)) return "Unknown"
  if (age <= 18) return "0-18"
  if (age <= 35) return "19-35"
  if (age <= 50) return "36-50"
  if (age <= 65) return "51-65"
  return "65+"
}

function InsightCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  note: string
  icon: typeof Users
  tone: "blue" | "green" | "amber" | "cyan"
}) {
  const toneClass = {
    blue: "from-blue-500/12 to-blue-500/5 text-blue-600 dark:text-blue-300",
    green: "from-green-500/12 to-green-500/5 text-green-600 dark:text-green-300",
    amber: "from-amber-500/14 to-amber-500/5 text-amber-600 dark:text-amber-300",
    cyan: "from-cyan-500/12 to-cyan-500/5 text-cyan-600 dark:text-cyan-300",
  }[tone]

  return (
    <Card className="gap-0 rounded-lg border-border/80 bg-card/95 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold leading-none text-foreground">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{note}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

export default function DashboardInsights() {
  const { authFetch } = useAuth()
  const [patients, setPatients] = useState<Patient[]>([])
  const [diagnosis, setDiagnosis] = useState<Diagnosis[]>([])
  const [loading, setLoading] = useState(false)

  async function loadInsights(signal?: AbortSignal) {
    setLoading(true)
    try {
      const [patientsRes, diagnosisRes] = await Promise.all([
        authFetch("/api/patients", { signal }),
        authFetch("/api/patients/diagnosis", { signal }),
      ])

      if (patientsRes.ok) {
        const body = await patientsRes.json()
        setPatients(Array.isArray(body.patients) ? body.patients : [])
      } else {
        setPatients([])
      }

      if (diagnosisRes.ok) {
        const body = await diagnosisRes.json()
        setDiagnosis(Array.isArray(body.diagnosis) ? body.diagnosis : [])
      } else {
        setDiagnosis([])
      }
    } catch (err) {
      const error = err as { name?: string }
      if (error?.name !== "AbortError") {
        console.error("dashboard insights fetch error", err)
        setPatients([])
        setDiagnosis([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    loadInsights(controller.signal)
    return () => controller.abort()
  }, [authFetch])

  const stats = useMemo(() => {
    const diagnosedPatientIds = new Set(diagnosis.map((d) => d.patientId).filter(Boolean))
    const ages = patients.map((p) => Number(p.age)).filter((age) => age > 0)
    const averageAge = ages.length ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0

    const today = startOfDay(new Date())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - 6)

    const weekDiagnosis = diagnosis.filter((d) => isValidDate(d.createdAt) && new Date(d.createdAt as string) >= weekStart)

    const diagnosisByDay = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + index)
      const count = weekDiagnosis.filter((d) => {
        if (!d.createdAt) return false
        return startOfDay(new Date(d.createdAt)).getTime() === date.getTime()
      }).length
      return { label: dayFormatter.format(date), count }
    })

    const diseaseCounts = new Map<string, number>()
    diagnosis.forEach((d) => {
      const label = d.disease || d.icd11 || "Unspecified"
      diseaseCounts.set(label, (diseaseCounts.get(label) || 0) + 1)
    })
    const topDiagnosis = Array.from(diseaseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }))

    const ageGroups = ["0-18", "19-35", "36-50", "51-65", "65+", "Unknown"].map((label) => ({
      label,
      count: patients.filter((p) => getAgeGroup(p.age) === label).length,
    }))

    return {
      totalPatients: patients.length,
      totalDiagnosis: diagnosis.length,
      diagnosedPatients: diagnosedPatientIds.size,
      pendingPatients: Math.max(patients.length - diagnosedPatientIds.size, 0),
      averageAge,
      weekDiagnosisCount: weekDiagnosis.length,
      diagnosisByDay,
      topDiagnosis,
      ageGroups,
    }
  }, [patients, diagnosis])

  const maxDaily = Math.max(...stats.diagnosisByDay.map((item) => item.count), 1)
  const maxTopDiagnosis = Math.max(...stats.topDiagnosis.map((item) => item.count), 1)
  const maxAgeGroup = Math.max(...stats.ageGroups.map((item) => item.count), 1)
  const diagnosedPercent = stats.totalPatients ? Math.round((stats.diagnosedPatients / stats.totalPatients) * 100) : 0

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Clinical Snapshot</h2>
          <p className="mt-1 text-sm text-muted-foreground">Live metrics from your patient and diagnosis records</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => loadInsights()} disabled={loading} className="w-fit">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard label="Total Patients" value={stats.totalPatients} note={`${stats.pendingPatients} waiting for diagnosis`} icon={Users} tone="blue" />
        <InsightCard label="Diagnosis Records" value={stats.totalDiagnosis} note={`${stats.weekDiagnosisCount} added in the last 7 days`} icon={Stethoscope} tone="green" />
        <InsightCard label="Diagnosed Patients" value={`${diagnosedPercent}%`} note={`${stats.diagnosedPatients} of ${stats.totalPatients} patients`} icon={UserCheck} tone="cyan" />
        <InsightCard label="Average Age" value={stats.averageAge || "-"} note="Based on patients with age recorded" icon={Activity} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="gap-0 rounded-lg border-border/80 bg-card/95 p-5 xl:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Diagnosis Activity</h3>
          </div>
          <div className="flex h-48 items-end gap-2 sm:gap-3">
            {stats.diagnosisByDay.map((item) => (
              <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="flex min-h-0 flex-1 items-end rounded-md bg-muted/70 px-1.5">
                  <div
                    className="w-full rounded-md bg-linear-to-t from-primary to-cyan-400 transition-all"
                    style={{ height: `${Math.max((item.count / maxDaily) * 100, item.count ? 12 : 2)}%` }}
                    title={`${item.count} diagnosis`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">{item.count}</p>
                  <p className="text-[11px] text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-0 rounded-lg border-border/80 bg-card/95 p-5">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Top Diagnosis</h3>
          </div>
          {stats.topDiagnosis.length ? (
            <div className="space-y-4">
              {stats.topDiagnosis.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: `${(item.count / maxTopDiagnosis) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              No diagnosis data yet
            </div>
          )}
        </Card>
      </div>

      <Card className="gap-0 rounded-lg border-border/80 bg-card/95 p-5">
        <div className="mb-5 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Patient Age Mix</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.ageGroups.map((item) => (
            <div key={item.label} className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.count}</p>
              </div>
              <div className="h-2 rounded-full bg-background">
                <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${(item.count / maxAgeGroup) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
