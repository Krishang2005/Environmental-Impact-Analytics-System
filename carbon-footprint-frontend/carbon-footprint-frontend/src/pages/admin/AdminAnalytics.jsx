import { useFetch } from '../../hooks/useFetch'
import { adminApi } from '../../api/adminApi'
import { useAuth } from '../../context/AuthContext'
import { Badge, ErrorState, PageLoader, ProgressBar, SectionHeader, StatCard } from '../../components/ui'
import { EmissionAreaChart, EmissionBarChart, MultiBarChart, ZoneBarChart } from '../../components/charts'
import { Activity, BrainCircuit, Globe, ShieldAlert, Siren, Trash2 } from 'lucide-react'
import { formatCarbonShort, formatNumber, formatPercent } from '../../utils/helpers'

export default function AdminAnalytics() {
  const { token, isAdmin } = useAuth()
  const isSessionReady = Boolean(token && isAdmin)
  const fetchOptions = { enabled: isSessionReady }
  const { data: dash, loading: l1, error: e1 } = useFetch(adminApi.getDashboard, [], fetchOptions)
  const { data: intelligence, loading: l2, error: e2 } = useFetch(adminApi.getZoneIntelligence, [], fetchOptions)
  const { data: zoneSector } = useFetch(adminApi.getZoneSectorSummary, [], fetchOptions)
  const { data: complaintAnalytics } = useFetch(adminApi.getComplaintAnalytics, [], fetchOptions)

  if (!isSessionReady) return <PageLoader />
  if (l1 || l2) return <PageLoader />
  if (e1 || e2) return <ErrorState message={e1 || e2} />

  const zones = Array.isArray(intelligence?.zones) ? intelligence.zones : []
  const summary = intelligence?.summary || {}
  const headlines = Array.isArray(intelligence?.headlines) ? intelligence.headlines : []
  const history = Array.isArray(intelligence?.historicalTrend) ? intelligence.historicalTrend : []
  const sectors = Array.isArray(zoneSector) ? zoneSector : []
  const complaintSummary = complaintAnalytics?.summary || {}
  const topPollutedZones = Array.isArray(complaintAnalytics?.topPollutedZones) ? complaintAnalytics.topPollutedZones : []
  const dirtyRoads = Array.isArray(complaintAnalytics?.frequentlyUncleanRoads) ? complaintAnalytics.frequentlyUncleanRoads : []
  const repeatOffenders = Array.isArray(complaintAnalytics?.repeatedOffenders) ? complaintAnalytics.repeatedOffenders : []

  const zonePressureData = zones.map((zone) => ({
    name: (zone.zoneName || 'Zone').slice(0, 12),
    totalEmission: Number(zone.projectedMonthEnd || 0),
  }))

  const forecastData = zones.map((zone) => ({
    name: (zone.zoneName || 'Zone').slice(0, 12),
    forecast: Number(zone.nextMonthForecast || 0),
  }))

  const sectorByZone = Object.values(sectors.reduce((acc, item) => {
    const zoneName = item.zoneName || 'Zone'
    const category = (item.sectorCategory || '').toUpperCase()

    if (!acc[zoneName]) {
      acc[zoneName] = {
        name: zoneName.slice(0, 10),
        residential: 0,
        commercial: 0,
        industrial: 0,
      }
    }

    if (category === 'RESIDENTIAL') acc[zoneName].residential += item.count || 0
    if (category === 'COMMERCIAL') acc[zoneName].commercial += item.count || 0
    if (category === 'INDUSTRIAL') acc[zoneName].industrial += item.count || 0

    return acc
  }, {})).slice(0, 8)

  const riskVariant = (riskLevel) => {
    switch (riskLevel) {
      case 'EXCEEDED': return 'red'
      case 'NEAR_LIMIT': return 'amber'
      case 'WATCH': return 'slate'
      default: return 'green'
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">AI-style zone comparison, forecast pressure, and intervention guidance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          iconColor="text-brand-400"
          iconBg="bg-brand-900/30"
          label="Monthly CO2"
          value={formatCarbonShort(dash?.monthlyCarbon)}
          sub="All users this month"
        />
        <StatCard
          icon={ShieldAlert}
          iconColor="text-red-400"
          iconBg="bg-red-900/30"
          label="Overloaded zones"
          value={summary.overloadedZones || 0}
          sub="Near or above safe capacity"
        />
        <StatCard
          icon={Globe}
          iconColor="text-purple-400"
          iconBg="bg-purple-900/30"
          label="Zones tracked"
          value={dash?.totalZones || 0}
          sub="Geographic zones"
        />
        <StatCard
          icon={BrainCircuit}
          iconColor="text-blue-400"
          iconBg="bg-blue-900/30"
          label="Avg utilization"
          value={`${summary.averageUtilizationPct || 0}%`}
          sub="Projected zone pressure"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Siren}
          iconColor="text-red-300"
          iconBg="bg-red-500/15"
          label="Open complaints"
          value={complaintSummary.openComplaints || 0}
          sub={`${complaintSummary.criticalComplaints || 0} critical`}
        />
        <StatCard
          icon={ShieldAlert}
          iconColor="text-amber-300"
          iconBg="bg-amber-500/15"
          label="Vehicle reports"
          value={complaintSummary.vehicleEmissionReports || 0}
          sub="AI emission detections"
        />
        <StatCard
          icon={Trash2}
          iconColor="text-emerald-300"
          iconBg="bg-emerald-500/15"
          label="Waste reports"
          value={complaintSummary.garbageReports || 0}
          sub="Garbage + road cleanliness"
        />
        <StatCard
          icon={Globe}
          iconColor="text-cyan-300"
          iconBg="bg-cyan-500/15"
          label="Impacted zone"
          value={complaintSummary.mostImpactedZone || '—'}
          sub="Top complaint hotspot"
        />
      </div>

      <div className="glass-card p-5">
        <SectionHeader title="AI Headlines" subtitle="Auto-generated guidance from live zone behavior" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {headlines.map((line) => (
            <div key={line} className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 text-sm text-slate-300">
              {line}
            </div>
          ))}
          {headlines.length === 0 && (
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 text-sm text-slate-500">
              Intelligence headlines will appear once zone data is available.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <SectionHeader title="Zone Pressure Heat Grid" subtitle="Projected month-end load against each zone capacity" />
          {zones.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {zones.map((zone) => (
                <div
                  key={zone.zoneId}
                  className={`rounded-2xl border p-4 ${
                    zone.riskLevel === 'EXCEEDED'
                      ? 'border-red-500/30 bg-red-500/10'
                      : zone.riskLevel === 'NEAR_LIMIT'
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : zone.riskLevel === 'WATCH'
                          ? 'border-slate-500/30 bg-slate-500/10'
                          : 'border-brand-500/30 bg-brand-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{zone.zoneName}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatNumber(zone.totalUsers)} users • cap {formatCarbonShort(zone.zoneCapacityKg)}
                      </p>
                    </div>
                    <Badge variant={riskVariant(zone.riskLevel)}>{zone.riskLevel.replace('_', ' ')}</Badge>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span>Projected utilization</span>
                      <span>{zone.utilizationPct}%</span>
                    </div>
                    <ProgressBar
                      value={Math.min(zone.utilizationPct, 100)}
                      color={
                        zone.riskLevel === 'EXCEEDED'
                          ? 'bg-red-500'
                          : zone.riskLevel === 'NEAR_LIMIT'
                            ? 'bg-amber-500'
                            : zone.riskLevel === 'WATCH'
                              ? 'bg-slate-400'
                              : 'bg-brand-500'
                      }
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-surface-800/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Projected this month</p>
                      <p className="mt-1 font-semibold text-white">{formatCarbonShort(zone.projectedMonthEnd)}</p>
                    </div>
                    <div className="rounded-xl bg-surface-800/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Next month forecast</p>
                      <p className="mt-1 font-semibold text-white">{formatCarbonShort(zone.nextMonthForecast)}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-slate-300">{zone.recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">No zone intelligence yet</div>
          )}
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="System Trend" subtitle="Total zone emissions across the last six months" />
          {history.length > 0 ? (
            <EmissionAreaChart data={history} dataKey="emission" xKey="month" />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No trend data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <SectionHeader title="Top Polluted Zones" subtitle="Vehicle emission complaint leaders" />
          <div className="space-y-3">
            {topPollutedZones.slice(0, 5).map((zone) => (
              <div key={zone.zoneName} className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <p className="text-sm font-semibold text-white">{zone.zoneName}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {zone.complaintCount} reports • avg score {zone.averageScore}/100
                </p>
              </div>
            ))}
            {topPollutedZones.length === 0 && (
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 text-sm text-slate-500">
                No pollution complaints yet.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="Unclean Road Alerts" subtitle="Waste hotspots by zone" />
          <div className="space-y-3">
            {dirtyRoads.slice(0, 5).map((zone) => (
              <div key={zone.zoneName} className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <p className="text-sm font-semibold text-white">{zone.zoneName}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {zone.complaintCount} reports • {zone.openCount} open
                </p>
              </div>
            ))}
            {dirtyRoads.length === 0 && (
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 text-sm text-slate-500">
                No garbage hotspots detected yet.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="Repeat Offenders" subtitle="Vehicles with multiple complaints" />
          <div className="space-y-3">
            {repeatOffenders.slice(0, 5).map((offender) => (
              <div key={offender.vehiclePlateNumber} className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <p className="text-sm font-semibold text-white">{offender.vehiclePlateNumber}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {offender.count} reports • avg score {offender.averageScore}/100
                </p>
              </div>
            ))}
            {repeatOffenders.length === 0 && (
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 text-sm text-slate-500">
                No repeated offenders recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <SectionHeader title="Projected Zone Load" subtitle="Current month-end pressure by zone" />
          {zonePressureData.length > 0 ? (
            <ZoneBarChart data={zonePressureData} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No zone data</div>
          )}
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="Next Month Forecast" subtitle="Future zone totals estimated from recent movement" />
          {forecastData.length > 0 ? (
            <EmissionBarChart data={forecastData} dataKey="forecast" xKey="name" color="#06b6d4" />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No forecast data</div>
          )}
        </div>
      </div>

      <div className="glass-card p-5">
        <SectionHeader title="Sector Footprint by Zone" subtitle="How each zone is distributed across user sectors" />
        {sectorByZone.length > 0 ? (
          <MultiBarChart
            data={sectorByZone}
            keys={['residential', 'commercial', 'industrial']}
            xKey="name"
          />
        ) : (
          <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">No sector data</div>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-surface-500/20">
          <SectionHeader title="AI Zone Comparison Table" subtitle="Which zones need intervention first" />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Risk</th>
                <th>Projected</th>
                <th>Capacity</th>
                <th>Utilization</th>
                <th>Trend</th>
                <th>Avg / user</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.zoneId}>
                  <td>
                    <p className="font-semibold text-white">{zone.zoneName}</p>
                    <p className="text-[11px] text-slate-500">{formatNumber(zone.totalUsers)} users</p>
                  </td>
                  <td><Badge variant={riskVariant(zone.riskLevel)}>{zone.riskLevel.replace('_', ' ')}</Badge></td>
                  <td className="text-slate-300">{formatCarbonShort(zone.projectedMonthEnd)}</td>
                  <td className="text-slate-400">{formatCarbonShort(zone.zoneCapacityKg)}</td>
                  <td className="text-slate-300">{zone.utilizationPct}%</td>
                  <td className={zone.trendPct > 0 ? 'text-red-300' : 'text-brand-300'}>{formatPercent(zone.trendPct)}</td>
                  <td className="text-slate-400">{formatCarbonShort(zone.averageEmissionPerUser)}</td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">No intelligence data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
