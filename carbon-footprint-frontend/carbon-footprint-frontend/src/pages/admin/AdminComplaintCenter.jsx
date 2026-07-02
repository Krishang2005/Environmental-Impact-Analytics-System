import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, Car, CheckCircle2, MapPin, Radar, Send, Trash2 } from 'lucide-react'
import { Badge, PageLoader, SectionHeader, StatCard } from '../../components/ui'
import { communityApi } from '../../api/communityApi'
import { adminApi } from '../../api/adminApi'
import { formatDateTime, getErrorMessage } from '../../utils/helpers'

function formatScore(value) {
  return `${Math.round(Number(value || 0))}/100`
}

export default function AdminComplaintCenter() {
  const [issues, setIssues] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    issueType: 'ALL',
    priority: 'ALL',
    zone: 'ALL',
    confidenceBand: 'ALL',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [issuesResponse, analyticsResponse] = await Promise.all([
        communityApi.getIssues(),
        adminApi.getComplaintAnalytics(),
      ])
      setIssues(issuesResponse.data || [])
      setAnalytics(analyticsResponse.data || null)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusUpdate = async (issue, status) => {
    setUpdatingId(issue.id)
    try {
      await communityApi.updateIssueStatus(issue.id, status, {
        note: status === 'ACTION_TAKEN'
          ? 'Action taken from admin complaint command center'
          : status === 'UNDER_REVIEW'
            ? 'Complaint picked up by admin team'
            : status === 'REJECTED'
              ? 'Complaint rejected after admin review'
              : 'Complaint status refreshed',
      })
      toast.success(`Complaint marked ${status.replace('_', ' ').toLowerCase()}.`)
      await loadData()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleBbmpEscalation = async (issue) => {
    setUpdatingId(issue.id)
    try {
      await communityApi.escalateToBbmp(issue.id, 24)
      toast.success('Complaint escalated to BBMP with a 24-hour response deadline.')
      await loadData()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <PageLoader />

  const summary = analytics?.summary || {}
  const repeatedOffenders = analytics?.repeatedOffenders || []
  const zoneAnalytics = analytics?.zoneAnalytics || []
  const availableZones = [...new Set(issues.map((issue) => issue.mappedZoneName || issue.zoneName).filter(Boolean))]
  const filteredIssues = issues.filter((issue) => {
    const zoneName = issue.mappedZoneName || issue.zoneName || ''
    const searchable = [
      issue.title,
      issue.description,
      issue.reporterName,
      issue.vehiclePlateNumber,
      zoneName,
      issue.address,
    ].join(' ').toLowerCase()
    const searchMatch = !filters.search || searchable.includes(filters.search.toLowerCase())
    const statusMatch = filters.status === 'ALL' || issue.status === filters.status
    const typeMatch = filters.issueType === 'ALL' || issue.issueType === filters.issueType
    const priorityMatch = filters.priority === 'ALL' || (issue.aiPriority || 'LOW') === filters.priority
    const zoneMatch = filters.zone === 'ALL' || zoneName === filters.zone
    const confidence = Number(issue.aiConfidenceScore || 0)
    const confidenceMatch = filters.confidenceBand === 'ALL'
      || (filters.confidenceBand === 'HIGH' && confidence >= 75)
      || (filters.confidenceBand === 'MEDIUM' && confidence >= 45 && confidence < 75)
      || (filters.confidenceBand === 'LOW' && confidence < 45)

    return searchMatch && statusMatch && typeMatch && priorityMatch && zoneMatch && confidenceMatch
  })

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header rounded-3xl border border-cyan-300/20 bg-slate-900/55 p-5 backdrop-blur-xl">
        <h1 className="page-title">Complaint Command Center</h1>
        <p className="page-subtitle">
          Review AI-generated civic complaints, update statuses, and watch the highest-risk pollution zones.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          iconColor="text-red-300"
          iconBg="bg-red-500/15"
          label="Open complaints"
          value={summary.openComplaints || 0}
          sub="Reported + in review"
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="text-emerald-300"
          iconBg="bg-emerald-500/15"
          label="Critical"
          value={summary.criticalComplaints || 0}
          sub="High-priority AI flags"
        />
        <StatCard
          icon={Car}
          iconColor="text-cyan-300"
          iconBg="bg-cyan-500/15"
          label="Vehicle reports"
          value={summary.vehicleEmissionReports || 0}
          sub="Emission complaints"
        />
        <StatCard
          icon={Trash2}
          iconColor="text-amber-300"
          iconBg="bg-amber-500/15"
          label="Garbage reports"
          value={summary.garbageReports || 0}
          sub="Waste + cleanliness"
        />
      </div>

      <div className="glass-card p-5">
        <SectionHeader title="Queue Filters" subtitle="Search and narrow the live complaint queue" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <input
            type="text"
            value={filters.search}
            onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))}
            placeholder="Search title, plate, zone..."
            className="input-field"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))}
            className="input-field"
          >
            <option value="ALL">All statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="ACTION_TAKEN">Action taken</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={filters.issueType}
            onChange={(event) => setFilters((previous) => ({ ...previous, issueType: event.target.value }))}
            className="input-field"
          >
            <option value="ALL">All types</option>
            <option value="AIR_POLLUTION">Vehicle emission</option>
            <option value="WASTE_DUMPING">Garbage issue</option>
          </select>
          <select
            value={filters.priority}
            onChange={(event) => setFilters((previous) => ({ ...previous, priority: event.target.value }))}
            className="input-field"
          >
            <option value="ALL">All priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            value={filters.zone}
            onChange={(event) => setFilters((previous) => ({ ...previous, zone: event.target.value }))}
            className="input-field"
          >
            <option value="ALL">All zones</option>
            {availableZones.map((zoneName) => (
              <option key={zoneName} value={zoneName}>{zoneName}</option>
            ))}
          </select>
          <select
            value={filters.confidenceBand}
            onChange={(event) => setFilters((previous) => ({ ...previous, confidenceBand: event.target.value }))}
            className="input-field"
          >
            <option value="ALL">All confidence</option>
            <option value="HIGH">High confidence</option>
            <option value="MEDIUM">Medium confidence</option>
            <option value="LOW">Low confidence</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="glass-card p-5">
          <SectionHeader title="Zone Hotspots" subtitle="Most impacted civic complaint clusters" />
          <div className="space-y-3">
            {zoneAnalytics.slice(0, 6).map((zone) => (
              <div key={zone.zoneName} className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{zone.zoneName}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {zone.complaintCount} complaints • {zone.openCount} open • avg score {formatScore(zone.averageScore)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Avg confidence {formatScore(zone.averageConfidenceScore)}
                    </p>
                  </div>
                  <Badge variant={zone.criticalCount > 0 ? 'red' : zone.openCount > 0 ? 'amber' : 'green'}>
                    hotspot {Math.round(zone.hotspotIndex || 0)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="Repeated Offenders" subtitle="Vehicles reported multiple times" />
          {repeatedOffenders.length === 0 ? (
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-5 text-sm text-slate-400">
              No repeat vehicle plates detected yet.
            </div>
          ) : (
            <div className="space-y-3">
              {repeatedOffenders.map((offender) => (
                <div key={offender.vehiclePlateNumber} className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{offender.vehiclePlateNumber}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {offender.count} reports • avg score {formatScore(offender.averageScore)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Avg confidence {formatScore(offender.averageConfidenceScore)}
                      </p>
                    </div>
                    <Badge variant="red">{offender.latestZone}</Badge>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500">{formatDateTime(offender.lastReportedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-5">
        <SectionHeader
          title="Live Complaint Queue"
          subtitle={`Update complaint status as field teams respond • ${filteredIssues.length} visible`}
        />
        <div className="space-y-3">
          {filteredIssues.map((issue) => (
            <div key={issue.id} className="rounded-3xl border border-surface-500/20 bg-surface-700/30 p-4">
              <div className="grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-4">
                <div>
                  {issue.evidenceImageUrl ? (
                    <img
                      src={issue.evidenceImageUrl}
                      alt={issue.title}
                      className="h-52 w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-surface-500/30 bg-slate-950/40 text-sm text-slate-500">
                      No evidence frame stored
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{issue.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{issue.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={
                          issue.status === 'ACTION_TAKEN'
                            ? 'green'
                            : issue.aiPriority === 'HIGH' || issue.aiPriority === 'CRITICAL'
                              ? 'red'
                              : 'amber'
                        }
                      >
                        {issue.status}
                      </Badge>
                      <Badge variant="slate">{issue.issueType}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-2xl bg-surface-800/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Score</p>
                      <p className="mt-1 font-semibold text-white">{formatScore(issue.aiScore)}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-800/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Confidence</p>
                      <p className="mt-1 font-semibold text-white">{formatScore(issue.aiConfidenceScore)}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-800/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Zone</p>
                      <p className="mt-1 font-semibold text-white">{issue.mappedZoneName || issue.zoneName}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-800/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Reported</p>
                      <p className="mt-1 font-semibold text-white">{formatDateTime(issue.reportedAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-800/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Reporter</p>
                      <p className="mt-1 font-semibold text-white">{issue.reporterName}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="badge-slate">Priority: {issue.aiPriority || 'LOW'}</span>
                    <span className="badge-slate">Confidence: {formatScore(issue.aiConfidenceScore)}</span>
                    {issue.estimatedCarbonGrams > 0 && (
                      <span className="badge-slate">Visual carbon: {Math.round(issue.estimatedCarbonGrams)} g</span>
                    )}
                    {issue.smokeColor && <span className="badge-slate">Smoke: {issue.smokeColor}</span>}
                    {issue.wasteType && <span className="badge-slate">Waste: {issue.wasteType}</span>}
                    {issue.vehiclePlateNumber && <span className="badge-slate">Plate: {issue.vehiclePlateNumber}</span>}
                    {issue.address && (
                      <span className="badge-slate">
                        <MapPin className="mr-1 inline h-3 w-3" />
                        {issue.address}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleBbmpEscalation(issue)}
                      disabled={updatingId === issue.id || issue.status === 'ACTION_TAKEN' || issue.status === 'REJECTED'}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {updatingId === issue.id ? 'Sending...' : 'Escalate to BBMP (24h)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(issue, 'UNDER_REVIEW')}
                      disabled={updatingId === issue.id || issue.status !== 'SUBMITTED'}
                      className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-60"
                    >
                      {updatingId === issue.id ? 'Updating...' : 'Mark in review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(issue, 'ACTION_TAKEN')}
                      disabled={updatingId === issue.id || issue.status !== 'UNDER_REVIEW'}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-60"
                    >
                      {updatingId === issue.id ? 'Updating...' : 'Mark action taken'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(issue, 'REJECTED')}
                      disabled={updatingId === issue.id || issue.status !== 'UNDER_REVIEW'}
                      className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>

                  {issue.timeline?.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-surface-500/20 bg-slate-950/35 p-4">
                      <div className="mb-3 flex items-center gap-2 text-white">
                        <Radar className="h-4 w-4 text-cyan-300" />
                        <p className="text-sm font-semibold">Timeline</p>
                      </div>
                      <div className="space-y-2">
                        {issue.timeline.slice(-3).reverse().map((item, index) => (
                          <div key={`${issue.id}-timeline-${index}`} className="text-sm text-slate-300">
                            <p>{item.newStatus} • {item.changedBy}</p>
                            <p className="text-[11px] text-slate-500">{formatDateTime(item.changedAt)}</p>
                            {item.note && <p className="mt-1 text-xs text-slate-400">{item.note}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredIssues.length === 0 && (
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-6 text-center text-sm text-slate-400">
              No complaints match the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
