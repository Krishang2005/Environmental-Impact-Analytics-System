import { Users, AlertTriangle, Map, Activity, TrendingDown, Globe, Radio, Zap, TrendingUp, Siren, ShieldAlert } from 'lucide-react'
import { motion } from 'framer-motion'
import { adminApi } from '../../api/adminApi'
import { carbonApi } from '../../api/carbonApi'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { StatCard, PageLoader, ErrorState, SectionHeader } from '../../components/ui'
import { ZoneBarChart, EmissionBarChart } from '../../components/charts'
import { formatCarbonShort, formatNumber } from '../../utils/helpers'

function formatTimeAgo(dateValue) {
  if (!dateValue) return 'just now'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'just now'
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.max(0, Math.floor(diffMs / (1000 * 60)))
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
}

export default function AdminDashboard() {
  const { token, isAdmin } = useAuth()
  const isSessionReady = Boolean(token && isAdmin)
  const fetchOptions = { enabled: isSessionReady }
  const { data: dash, loading, error } = useFetch(adminApi.getDashboard, [], fetchOptions)
  const { data: highEmitters } = useFetch(adminApi.getHighEmitters, [], fetchOptions)
  const { data: zoneSummary } = useFetch(adminApi.getZoneSummary, [], fetchOptions)
  const { data: zoneSector } = useFetch(adminApi.getZoneSectorSummary, [], fetchOptions)
  const { data: liveMonitor, error: liveError } = useFetch(
    adminApi.getLiveMonitor,
    [],
    { enabled: isSessionReady, refreshIntervalMs: 30000 }
  )

  if (!isSessionReady) return <PageLoader />
  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} />

  const zoneChartData = (zoneSummary || []).slice(0, 8).map((z) => ({
    name: z.zoneName || z.name,
    totalEmission: Number((z.totalEmission || z.emission || 0).toFixed(1)),
  }))

  const topEmitters = (highEmitters || []).slice(0, 5)
  const feed = liveMonitor?.activityFeed || []
  const emissionDelta = Number(liveMonitor?.emissionChangeVsYesterdayPct || 0)
  const emissionDeltaSign = emissionDelta > 0 ? '+' : ''

  return (
    <div className="space-y-6 animate-slide-up">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header rounded-3xl border border-cyan-300/20 bg-slate-900/55 p-5 backdrop-blur-xl"
      >
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System-wide carbon monitoring overview</p>
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Live Operations Command Center</p>
      </motion.div>

      <div className="glass-card p-5 border border-red-500/20 bg-gradient-to-r from-red-950/40 via-surface-800/70 to-surface-800/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-200">
            <Radio className="w-3.5 h-3.5" />
            Live
          </div>
          <p className="text-[11px] text-slate-400">
            Refreshes every 30s
            {liveMonitor?.updatedAt ? ` • Updated ${formatTimeAgo(liveMonitor.updatedAt)}` : ''}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-surface-500/25 bg-surface-800/70 p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Users active now</p>
            <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(liveMonitor?.activeUsersNow || 0)}</p>
          </div>
          <div className="rounded-2xl border border-surface-500/25 bg-surface-800/70 p-4">
            <div className="flex items-center gap-2 text-amber-300">
              <Zap className="w-4 h-4" />
              <p className="text-[11px] uppercase tracking-wide">Entries in last hour</p>
            </div>
            <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(liveMonitor?.entriesLastHour || 0)}</p>
          </div>
          <div className="rounded-2xl border border-surface-500/25 bg-surface-800/70 p-4">
            <div className={`flex items-center gap-2 ${emissionDelta >= 0 ? 'text-red-300' : 'text-brand-300'}`}>
              <TrendingUp className="w-4 h-4" />
              <p className="text-[11px] uppercase tracking-wide">Vs yesterday</p>
            </div>
            <p className={`mt-1 text-2xl font-semibold ${emissionDelta >= 0 ? 'text-red-300' : 'text-brand-300'}`}>
              {emissionDeltaSign}{emissionDelta.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-2xl border border-surface-500/25 bg-surface-800/70 p-4">
            <div className="flex items-center gap-2 text-red-300">
              <Siren className="w-4 h-4" />
              <p className="text-[11px] uppercase tracking-wide">Zones over threshold</p>
            </div>
            <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(liveMonitor?.zonesExceededThresholdToday || 0)}</p>
          </div>
        </div>

        {liveError && (
          <p className="mt-3 text-xs text-red-300">{String(liveError)}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-900/30"
          label="Total users"
          value={formatNumber(dash?.totalUsers)}
          sub="Active accounts"
        />
        <StatCard
          icon={AlertTriangle}
          iconColor="text-red-400"
          iconBg="bg-red-900/30"
          label="High emitters"
          value={formatNumber(dash?.highEmitters)}
          sub="Pending alerts"
        />
        <StatCard
          icon={Activity}
          iconColor="text-amber-400"
          iconBg="bg-amber-900/30"
          label="Monthly CO₂"
          value={formatCarbonShort(dash?.monthlyCarbon)}
          sub="This month total"
        />
        <StatCard
          icon={Map}
          iconColor="text-brand-400"
          iconBg="bg-brand-900/30"
          label="Active zones"
          value={formatNumber(dash?.totalZones)}
          sub="Geographic zones"
        />
        <StatCard
          icon={ShieldAlert}
          iconColor="text-amber-300"
          iconBg="bg-amber-500/15"
          label="Open complaints"
          value={formatNumber(dash?.openComplaints)}
          sub={`${formatNumber(dash?.criticalComplaints)} critical`}
        />
      </div>

      <div className="glass-card p-5">
        <SectionHeader title="Real-time Activity Feed" subtitle="Latest system events across users, admins, and alerts" />
        {feed.length === 0 ? (
          <div className="rounded-2xl border border-surface-500/20 bg-surface-800/50 p-4 text-sm text-slate-500">
            No live activity yet. New events will appear automatically.
          </div>
        ) : (
          <div className="space-y-2">
            {feed.slice(0, 12).map((item, index) => (
              <div
                key={item.id || index}
                className={`rounded-2xl border p-3 ${
                  item.severity === 'HIGH'
                    ? 'border-red-500/25 bg-red-500/10'
                    : item.type === 'ADMIN_ACTION'
                      ? 'border-sky-500/20 bg-sky-500/10'
                      : 'border-surface-500/20 bg-surface-700/35'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-white">{item.message}</p>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatTimeAgo(item.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <SectionHeader title="Emission by Zone" subtitle="Top zones by total CO₂ output" />
          {zoneChartData.length > 0 ? (
            <ZoneBarChart data={zoneChartData} />
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-slate-500 text-sm">No zone data available</p>
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="Zone Sector Summary" subtitle="Emissions grouped by sector" />
          {zoneSector?.length > 0 ? (
            <EmissionBarChart
              data={(zoneSector || []).slice(0, 6).map((z) => ({
                name: z.zoneName?.slice(0, 10) || '?',
                emission: Number((z.totalCarbon || 0).toFixed(1)),
              }))}
              dataKey="emission"
              xKey="name"
              color="#06b6d4"
            />
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-slate-500 text-sm">No sector data available</p>
            </div>
          )}
        </div>
      </div>

      {/* High emitters preview */}
      <div className="glass-card p-5">
        <SectionHeader
          title="Recent High Emitters"
          subtitle="Users with above-threshold carbon output"
          action={
            <a href="/admin/high-emitters" className="text-xs text-brand-500 hover:text-brand-400 transition-colors">
              View all →
            </a>
          }
        />
        {topEmitters.length === 0 ? (
          <div className="py-8 text-center">
            <TrendingDown className="w-8 h-8 text-brand-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No high emitter alerts pending</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topEmitters.map((e, i) => (
              <div key={e.userId || i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-700/30 border border-surface-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center text-red-400 text-xs font-bold">
                    {e.userName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{e.userName}</p>
                    <p className="text-xs text-slate-500">{e.userEmail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-400">{formatCarbonShort(e.totalCarbon)}</p>
                  <p className="text-xs text-slate-500">{e.zoneName || 'No zone'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
