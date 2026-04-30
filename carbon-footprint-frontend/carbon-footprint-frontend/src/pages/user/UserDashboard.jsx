import { Activity, Flame, Leaf, TrendingUp, Award, Zap, Target, Shield, Gift, Sparkles, Map, Radar, CalendarDays, PlayCircle, Workflow } from 'lucide-react'
import { motion } from 'framer-motion'
import { userApi } from '../../api/userApi'
import { carbonApi } from '../../api/carbonApi'
import { useFetch } from '../../hooks/useFetch'
import {
  StatCard, PageLoader, ErrorState, SectionHeader, ProgressBar, Badge,
} from '../../components/ui'
import {
  EmissionAreaChart,
  CategoryPieChart,
  ScoreGauge,
  EmissionFlowSankey,
  EmissionHeatmapCalendar,
  EmissionRadarComparison,
  EmissionPlaybackChart,
  ZoneChoroplethTileMap,
} from '../../components/charts'
import {
  formatCarbonShort, formatPercent, getStatusBadgeClass, MONTHS,
} from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

function buildMonthlyChartData(entries) {
  if (!entries?.length) return []
  const grouped = {}
  entries.forEach((entry) => {
    const date = entry.entryDate || entry.date || entry.createdAt
    if (!date) return
    const parsed = new Date(date)
    const key = MONTHS[parsed.getMonth()]
    grouped[key] = (grouped[key] || 0) + (entry.carbonAmount || 0)
  })
  return MONTHS.slice(0, new Date().getMonth() + 1).map((month) => ({
    month,
    emission: Number((grouped[month] || 0).toFixed(2)),
  }))
}

function buildDailyHeatmapData(entries) {
  if (!entries?.length) return []
  const grouped = {}

  entries.forEach((entry) => {
    const date = entry.entryDate || entry.date || entry.createdAt
    if (!date) return
    const key = new Date(date).toISOString().slice(0, 10)
    grouped[key] = (grouped[key] || 0) + Number(entry.carbonAmount || 0)
  })

  return Object.keys(grouped)
    .sort()
    .map((date) => ({
      date,
      total: Number(grouped[date].toFixed(2)),
    }))
}

function buildPlaybackSeries(entries) {
  if (!entries?.length) return []

  const grouped = {}
  entries.forEach((entry) => {
    const date = entry.entryDate || entry.date || entry.createdAt
    if (!date) return
    const key = new Date(date).toISOString().slice(0, 10)
    grouped[key] = (grouped[key] || 0) + Number(entry.carbonAmount || 0)
  })

  let cumulative = 0
  return Object.keys(grouped)
    .sort()
    .map((date) => {
      cumulative += grouped[date]
      const parsed = new Date(date)
      const label = parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      return {
        date,
        label,
        emission: Number(grouped[date].toFixed(2)),
        cumulative: Number(cumulative.toFixed(2)),
      }
    })
}

export default function UserDashboard() {
  const { user, token } = useAuth()
  const isSessionReady = Boolean(token && user)
  const fetchOptions = { enabled: isSessionReady }
  const { data: dash, loading: loadingDashboard, error: dashboardError } = useFetch(userApi.getDashboard, [], fetchOptions)
  const { data: breakdown, loading: loadingBreakdown } = useFetch(carbonApi.getBreakdown, [], fetchOptions)
  const { data: entries, loading: loadingEntries } = useFetch(carbonApi.getMyEntries, [], fetchOptions)
  const { data: score, loading: loadingScore } = useFetch(carbonApi.getScore, [], fetchOptions)
  const { data: insight } = useFetch(userApi.getEmissionInsights, [], fetchOptions)
  const { data: challenge } = useFetch(userApi.getChallenge, [], fetchOptions)
  const { data: streak } = useFetch(userApi.getStreakOverview, [], fetchOptions)
  const { data: zoneEmissions } = useFetch(userApi.getZoneEmissions, [], fetchOptions)

  if (!isSessionReady) return <PageLoader />
  if (loadingDashboard) return <PageLoader />
  if (dashboardError) return <ErrorState message={dashboardError} />

  const monthlyChart = buildMonthlyChartData(entries)
  const heatmapData = buildDailyHeatmapData(entries)
  const playbackData = buildPlaybackSeries(entries)
  const targetBudget = insight?.targetRangeMaxKg || dash?.zoneAverage || 0
  const statusClass = getStatusBadgeClass(dash?.status)
  const recommendations = insight?.recommendations || []
  const riskMeta = {
    SAFE: { label: 'Within limit', variant: 'green', bar: 'bg-brand-500' },
    WATCH: { label: 'Watch trend', variant: 'amber', bar: 'bg-amber-500' },
    NEAR_LIMIT: { label: 'Near limit', variant: 'amber', bar: 'bg-orange-500' },
    EXCEEDED: { label: 'Limit exceeded', variant: 'red', bar: 'bg-red-500' },
  }[insight?.riskLevel || 'SAFE']

  return (
    <div className="space-y-6 animate-slide-up">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header flex items-start justify-between rounded-3xl border border-cyan-300/20 bg-slate-900/55 p-5 backdrop-blur-xl"
      >
        <div className="space-y-1">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <span className="text-cyan-300">{user?.name}</span> - here is your carbon intelligence overview
          </p>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Neural Sustainability Console</p>
        </div>
        <span className={statusClass}>{dash?.status || '-'}</span>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Flame}
          iconColor="text-amber-300"
          iconBg="bg-amber-500/15"
          label="This month"
          value={formatCarbonShort(dash?.monthlyEmission)}
          sub="Monthly total"
          trend={Math.abs(dash?.monthChangePct)}
          trendUp={dash?.monthChangePct > 0}
        />
        <StatCard
          icon={Activity}
          iconColor="text-blue-300"
          iconBg="bg-blue-500/15"
          label="Today"
          value={formatCarbonShort(dash?.todayEmission)}
          sub={`Budget: ${formatCarbonShort(dash?.dailyBudget)}`}
        />
        <StatCard
          icon={Leaf}
          iconColor="text-emerald-300"
          iconBg="bg-emerald-500/15"
          label="Zone avg"
          value={formatCarbonShort(dash?.zoneAverage)}
          sub={dash?.zoneName || 'Unassigned'}
        />
        <StatCard
          icon={Award}
          iconColor="text-indigo-300"
          iconBg="bg-indigo-500/15"
          label="Reward points"
          value={dash?.rewardPoints || 0}
          sub={`${dash?.streakDays || 0} day streak active`}
        />
      </div>

      {streak && (
        <div className="glass-card p-5">
          <SectionHeader
            title="Daily Streak"
            subtitle="A quick pulse on today's retention loop"
            action={<Badge variant={streak.checkedInToday ? 'green' : 'amber'}>{streak.checkedInToday ? 'Checked in' : 'Pending today'}</Badge>}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{streak.growthStage}</p>
                  <p className="mt-1 text-sm text-slate-400">{streak.reminderMessage}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-surface-800/70 px-4 py-3 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Streak</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{streak.currentStreak}</p>
                  </div>
                  <div className="rounded-xl bg-surface-800/70 px-4 py-3 text-center">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Green days</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{streak.perfectGreenDays}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Milestone progress</span>
                  <span>{streak.daysToNextMilestone} days to {streak.nextMilestone}</span>
                </div>
                <ProgressBar value={streak.growthProgressPct || 0} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-4 h-4 text-sky-300" />
                  <span className="text-xs">Freeze shields</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-white">{streak.freezeCredits}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Saves your streak if you miss one day. It is used automatically when needed.
                </p>
              </div>
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Gift className="w-4 h-4 text-amber-300" />
                  <span className="text-xs">Weekly boxes</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-white">{streak.weeklyBoxesAvailable}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Opens after every 7 streak days and gives bonus rewards like points or extras.
                </p>
              </div>
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="w-4 h-4 text-brand-300" />
                  <span className="text-xs">Zone squad active</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-white">{streak.zoneActiveUsersToday}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Shows how many users in your zone checked in today. Higher activity helps your team ranking.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {insight && (
        <div className="glass-card p-5">
          <SectionHeader
            title="AI Emission Coach"
            subtitle={`Prediction-based guidance for ${insight.zoneName || 'your zone'}`}
            action={<Badge variant={riskMeta.variant}>{riskMeta.label}</Badge>}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{insight.headline}</p>
                  <p className="mt-1 text-sm text-slate-400 max-w-2xl">{insight.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {insight.zoneLimitConfigured ? 'Admin-set zone range' : 'Default zone range'}:
                    {' '}{formatCarbonShort(insight.targetRangeMinKg)} to {formatCarbonShort(insight.targetRangeMaxKg)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-800/70 px-4 py-3 min-w-[180px]">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Days remaining</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{insight.daysRemaining}</p>
                  <p className="text-xs text-slate-500">of this month</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl bg-surface-800/70 p-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Target className="w-4 h-4 text-brand-400" />
                    <span className="text-xs">Zone range</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatCarbonShort(insight.targetRangeMinKg)} - {formatCarbonShort(insight.targetRangeMaxKg)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-800/70 p-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-xs">Current</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">{formatCarbonShort(insight.currentEmissionKg)}</p>
                </div>
                <div className="rounded-xl bg-surface-800/70 p-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-xs">Projected</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">{formatCarbonShort(insight.projectedEmissionKg)}</p>
                </div>
                <div className="rounded-xl bg-surface-800/70 p-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Leaf className="w-4 h-4 text-brand-400" />
                    <span className="text-xs">Remaining</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">{formatCarbonShort(insight.remainingBudgetKg)}</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Current limit usage</span>
                    <span>{formatPercent(insight.usagePct).replace('+', '')}</span>
                  </div>
                  <ProgressBar value={Math.min(100, insight.usagePct)} color={riskMeta.bar} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Projected zone-cap usage</span>
                    <span>{formatPercent(insight.projectedUsagePct).replace('+', '')}</span>
                  </div>
                  <ProgressBar value={Math.min(100, insight.projectedUsagePct)} color={riskMeta.bar} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">Best Ideas To Follow</p>
                  <p className="text-xs text-slate-500">Suggested from your biggest emission sources</p>
                </div>
                <Zap className="w-4 h-4 text-brand-400" />
              </div>

              <div className="mt-4 space-y-3">
                {recommendations.length > 0 ? recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="rounded-xl bg-surface-800/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{rec.title}</p>
                      <span className="text-[10px] uppercase tracking-wide text-brand-400">{rec.activityType}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{rec.description}</p>
                    <p className="mt-2 text-xs font-medium text-brand-400">
                      Potential saving: {formatCarbonShort(rec.estimatedMonthlySaving)}
                    </p>
                  </div>
                )) : (
                  <div className="rounded-xl bg-surface-800/70 p-3 text-sm text-slate-400">
                    Add a few more emission entries to unlock smarter suggestions.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <SectionHeader title="Monthly Emissions" subtitle="CO2 output across the year" />
          {loadingEntries ? (
            <div className="h-[220px] flex items-center justify-center">
              <span className="text-slate-500 text-sm">Loading chart...</span>
            </div>
          ) : (
            <EmissionAreaChart data={monthlyChart} />
          )}
        </div>

        <div className="glass-card p-5 flex flex-col items-center justify-center">
          <SectionHeader title="Green Score" subtitle="Your eco performance" />
          <ScoreGauge score={loadingScore ? 0 : (score || 0)} />
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500">
              {score >= 70 ? 'Excellent! Keep it up' :
               score >= 40 ? 'Good, room to improve' : 'High emission - take action'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <SectionHeader title="Emission by Category" subtitle="What contributes most" />
          {loadingBreakdown ? (
            <div className="h-[220px] flex items-center justify-center">
              <span className="text-slate-500 text-sm">Loading...</span>
            </div>
          ) : breakdown?.length ? (
            <CategoryPieChart data={breakdown} />
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-slate-500 text-sm">No data yet - add your first entry</p>
            </div>
          )}
        </div>

        {challenge && (
          <div className="glass-card p-5">
            <SectionHeader title="Monthly Challenge" subtitle={challenge.zoneName} />
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-white">{challenge.title}</p>
                <p className="text-xs text-slate-500 mt-1">{challenge.description}</p>
              </div>

              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>Progress</span>
                <span className="font-medium text-white">{challenge.progressPct}%</span>
              </div>
              <ProgressBar value={challenge.progressPct} />

              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-surface-700/40 rounded-lg p-2.5 text-center">
                  <p className="text-base font-semibold text-white">{formatCarbonShort(challenge.currentEmission)}</p>
                  <p className="text-[10px] text-slate-500">Current</p>
                </div>
                <div className="bg-brand-900/30 rounded-lg p-2.5 text-center">
                  <p className="text-base font-semibold text-brand-400">{formatCarbonShort(challenge.goalReductionKg)}</p>
                  <p className="text-[10px] text-slate-500">Target cut</p>
                </div>
                <div className="bg-surface-700/40 rounded-lg p-2.5 text-center">
                  <p className="text-base font-semibold text-white">#{challenge.zoneRank || '-'}</p>
                  <p className="text-[10px] text-slate-500">Zone rank</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-5">
        <SectionHeader
          title="Advanced Visualizations"
          subtitle="Deep-dive exploration across flow, seasonality, multi-dimension, timeline, and geography"
          action={<Badge variant="slate">Pro Analytics</Badge>}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">Sankey Flow</p>
                <p className="text-xs text-slate-500">Category to impact-path emission flow</p>
              </div>
              <Workflow className="w-4 h-4 text-brand-400" />
            </div>
            <EmissionFlowSankey data={breakdown || []} />
          </div>

          <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">Heatmap Calendar</p>
                <p className="text-xs text-slate-500">Daily emission intensity across the year</p>
              </div>
              <CalendarDays className="w-4 h-4 text-sky-400" />
            </div>
            <EmissionHeatmapCalendar dailyData={heatmapData} />
          </div>

          <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">Radar Comparison</p>
                <p className="text-xs text-slate-500">Multi-dimensional current vs target mix</p>
              </div>
              <Radar className="w-4 h-4 text-amber-400" />
            </div>
            <EmissionRadarComparison breakdown={breakdown || []} targetBudget={targetBudget} />
          </div>

          <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">Animated Timeline Playback</p>
                <p className="text-xs text-slate-500">Play progression of cumulative emissions</p>
              </div>
              <PlayCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <EmissionPlaybackChart data={playbackData} />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">Choropleth District/Zone Map</p>
              <p className="text-xs text-slate-500">State/district-level intensity view from zone emissions</p>
            </div>
            <Map className="w-4 h-4 text-indigo-400" />
          </div>
          <ZoneChoroplethTileMap
            data={zoneEmissions || []}
            highlightedZone={dash?.zoneName}
          />
        </div>
      </div>

      {recommendations?.length > 0 && (
        <div className="glass-card p-5">
          <SectionHeader title="Action Recommendations" subtitle="More personalized tips to lower your footprint" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-surface-700/40 rounded-xl p-4 border border-surface-500/20">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider">
                    {rec.activityType}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${rec.impact === 'High' ? 'bg-brand-900/40 text-brand-400' : 'bg-amber-900/30 text-amber-400'}`}>
                    {rec.impact} impact
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{rec.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.description}</p>
                <p className="text-xs text-brand-500 font-medium mt-2">
                  Save ~{formatCarbonShort(rec.estimatedMonthlySaving)}/mo
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
