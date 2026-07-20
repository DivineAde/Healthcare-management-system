"use client"

import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth"
import { BarChart3, PieChart, TrendingUp, Users, Activity, Calendar, RefreshCw } from "lucide-react"

type Diagnosis = {
  id: string
  patientId?: string
  disease?: string
  icd11?: string
  createdAt?: string
  createdBy?: string
}

type Patient = {
  id: string
  name?: string
  age?: number
  disease?: string
  icd11?: string
  createdAt?: string
  createdBy?: string
}

type Doctor = {
  id: string
  email?: string
  profile?: { name?: string }
  patients?: Patient[]
  diagnosis?: Diagnosis[]
}

export default function AnalyticsTab({ orgId }: { orgId: string | null }) {
  const { authFetch } = useAuth()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    if (!orgId) return
    loadData()
  }, [orgId])

  async function loadData() {
    if (!orgId) return
    setLoading(true)
    try {
      const res = await authFetch(`/api/organizations/${orgId}/doctors`)
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setDoctors(data.doctors || [])
    } catch (err) {
      console.error('load analytics data error', err)
    } finally {
      setLoading(false)
    }
  }

  const analytics = useMemo(() => {
    const allDiagnosis: Diagnosis[] = []
    const allPatients: Patient[] = []
    
    doctors.forEach(doc => {
      if (doc.diagnosis) allDiagnosis.push(...doc.diagnosis)
      if (doc.patients) allPatients.push(...doc.patients)
    })

    const finalDiagnosis = doctors
      .filter(d => d.diagnosis && d.diagnosis.length > 0)
      .map(d => d.diagnosis)
      .flat()

    const now = new Date()
    const periodDays = timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : timeFilter === '90d' ? 90 : null
    const periodStart = periodDays
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - (periodDays - 1))
      : null
    const periodDiagnosis = periodStart
      ? finalDiagnosis.filter(d => d?.createdAt && new Date(d.createdAt) >= periodStart)
      : finalDiagnosis

    // Disease prevalence
    const diseaseCount = new Map<string, number>()
    periodDiagnosis.forEach(d => {
      const disease = d?.disease || 'Unknown'
      diseaseCount.set(disease, (diseaseCount.get(disease) || 0) + 1)
    })
    const topDiseases = Array.from(diseaseCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([disease, count]) => ({ disease, count }))

    // Age distribution
    const ageGroups = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0, 'Unknown': 0 }
    allPatients.forEach(p => {
      if (!p.age) ageGroups['Unknown']++
      else if (p.age <= 18) ageGroups['0-18']++
      else if (p.age <= 35) ageGroups['19-35']++
      else if (p.age <= 50) ageGroups['36-50']++
      else if (p.age <= 65) ageGroups['51-65']++
      else ageGroups['65+']++
    })

    // Doctor performance
    const doctorStats = doctors.map(doc => ({
      name: doc.profile?.name || doc.email || 'Unknown',
      patients: doc.patients?.length || 0,
      diagnosis: doc.diagnosis?.length || 0
    })).sort((a, b) => b.diagnosis - a.diagnosis)

    // Monthly trend
    const monthlyDiagnosis = new Map<string, number>()
    periodDiagnosis.forEach(d => {
      if (!d?.createdAt) return
      const date = new Date(d?.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyDiagnosis.set(key, (monthlyDiagnosis.get(key) || 0) + 1)
    })

    const monthlyTrend = Array.from(monthlyDiagnosis.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }))

    return {
      totalPatients: allPatients.length,
      totalDiagnosis: finalDiagnosis.length,
      filteredDiagnosisCount: periodDiagnosis.length,
      topDiseases,
      ageGroups,
      doctorStats,
      monthlyTrend
    }
  }, [doctors, timeFilter])

  if (!orgId) return <div className="text-sm text-muted-foreground">No organization selected.</div>

  const maxDiseaseCount = Math.max(...analytics.topDiseases.map(d => d.count), 1)
  const maxAge = Math.max(...Object.values(analytics.ageGroups), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground mt-1">Insights and trends across your organization</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-muted border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
              <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalPatients}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-muted border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Diagnosis</p>
              <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalDiagnosis}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Activity className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-muted border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Period Diagnosis</p>
              <p className="text-3xl font-bold text-foreground mt-2">{analytics.filteredDiagnosisCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-muted border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Signed Doctors</p>
              <p className="text-3xl font-bold text-foreground mt-2">{doctors.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disease Prevalence Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top 10 Most Prevalent Diseases</h3>
          </div>
          {analytics.topDiseases.length > 0 ? (
            <div className="space-y-3">
              {analytics.topDiseases.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground truncate flex-1">{item.disease}</span>
                    <span className="text-muted-foreground ml-2">{item.count}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(item.count / maxDiseaseCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No diagnosis data available</div>
          )}
        </Card>

        {/* Age Distribution */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Patient Age Distribution</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(analytics.ageGroups).map(([group, count]) => (
              <div key={group} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{group} years</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-foreground h-2 rounded-full transition-all"
                    style={{ width: `${(count / maxAge) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Doctor Performance */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Doctor Performance</h3>
          </div>
          {analytics.doctorStats.length > 0 ? (
            <div className="overflow-auto max-h-80">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Doctor</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Patients</th>
                    <th className="text-right py-2 px-2 text-xs font-semibold text-muted-foreground">Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.doctorStats.map((doc, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-3 px-2 text-sm font-medium text-foreground truncate">{doc.name}</td>
                      <td className="py-3 px-2 text-sm text-right text-muted-foreground">{doc.patients}</td>
                      <td className="py-3 px-2 text-sm text-right text-muted-foreground">{doc.diagnosis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No doctor data available</div>
          )}
        </Card>

        {/* Monthly Trend */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Monthly Diagnosis Trend</h3>
          </div>
          {analytics.monthlyTrend.length > 0 ? (
            <div className="space-y-3">
              {analytics.monthlyTrend.slice(-6).map((item, idx) => {
                const maxMonthly = Math.max(...analytics.monthlyTrend.map(m => m.count), 1)
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.month}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-foreground h-2 rounded-full transition-all"
                        style={{ width: `${(item.count / maxMonthly) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No trend data available</div>
          )}
        </Card>
      </div>
    </div>
  )
}
