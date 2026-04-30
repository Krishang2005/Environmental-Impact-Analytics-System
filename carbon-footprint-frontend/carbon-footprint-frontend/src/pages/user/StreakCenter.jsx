import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Flame, Shield, Gift, BellRing, Sparkles, Trophy,
  Users, CheckCircle2, CalendarDays, Leaf, ArrowRight,
} from 'lucide-react'
import { userApi } from '../../api/userApi'
import { useFetch } from '../../hooks/useFetch'
import { PageLoader, ErrorState, SectionHeader, ProgressBar, Badge } from '../../components/ui'
import { formatNumber, getErrorMessage } from '../../utils/helpers'

function getGrowthAccent(stage) {
  if (stage?.includes('Forest')) return 'from-emerald-500 via-lime-400 to-yellow-300'
  if (stage?.includes('Tree')) return 'from-emerald-500 via-teal-400 to-sky-300'
  if (stage?.includes('Sapling')) return 'from-brand-500 via-emerald-400 to-cyan-300'
  if (stage?.includes('Sprout')) return 'from-brand-500 via-teal-400 to-lime-300'
  return 'from-slate-500 via-brand-500 to-emerald-300'
}

function getReminderVariant(streak) {
  if (streak?.checkedInToday) return 'green'
  if ((streak?.freezeCredits || 0) > 0 && !streak?.checkedInToday) return 'amber'
  return 'red'
}

export default function StreakCenter() {
  const { data, loading, error, refetch } = useFetch(userApi.getStreakOverview)
  const [streak, setStreak] = useState(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [claimingBox, setClaimingBox] = useState(false)

  useEffect(() => {
    if (data) {
      setStreak(data)
    }
  }, [data])

  if (loading && !streak) return <PageLoader />
  if (error && !streak) return <ErrorState message={error} onRetry={refetch} />

  const handleCheckIn = async () => {
    setCheckingIn(true)
    try {
      const res = await userApi.checkInStreak()
      setStreak(res.data)
      toast.success(res.data?.actionMessage || 'Check-in complete')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCheckingIn(false)
    }
  }

  const handleClaimBox = async () => {
    setClaimingBox(true)
    try {
      const res = await userApi.claimWeeklyStreakBox()
      setStreak(res.data)
      toast.success(res.data?.actionMessage || 'Weekly reward claimed')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setClaimingBox(false)
    }
  }

  const reminderVariant = getReminderVariant(streak)
  const growthAccent = getGrowthAccent(streak?.growthStage)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">Streak Arena</h1>
        <p className="page-subtitle">Daily check-ins, reward boxes, freeze shields, zone squad energy, and AI tip unlocks that keep users coming back.</p>
      </div>

      {streak?.reminderMessage && (
        <div className={`rounded-2xl border p-4 ${
          reminderVariant === 'green'
            ? 'border-brand-500/20 bg-brand-500/10'
            : reminderVariant === 'amber'
              ? 'border-amber-500/20 bg-amber-500/10'
              : 'border-red-500/20 bg-red-500/10'
        }`}>
          <div className="flex items-start gap-3">
            <BellRing className={`w-5 h-5 mt-0.5 ${
              reminderVariant === 'green' ? 'text-brand-300' : reminderVariant === 'amber' ? 'text-amber-300' : 'text-red-300'
            }`} />
            <div>
              <p className="text-sm font-semibold text-white">Daily Reminder</p>
              <p className="text-sm text-slate-300 mt-1">{streak.reminderMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-4">
        <div className="glass-card p-5 overflow-hidden relative">
          <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${growthAccent} opacity-20 blur-2xl`} />
          <SectionHeader
            title="Daily Carbon Check-in"
            subtitle="Maintain the streak by showing up every day"
            action={<Badge variant={streak?.checkedInToday ? 'green' : 'amber'}>{streak?.checkedInToday ? 'Protected today' : 'Check-in pending'}</Badge>}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-5">
            <div className="rounded-3xl border border-surface-500/20 bg-surface-700/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Growth Stage</p>
                  <p className="text-2xl font-semibold text-white mt-2">{streak?.growthStage}</p>
                </div>
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${growthAccent} p-[2px] shadow-glow`}>
                  <div className="w-full h-full rounded-full bg-surface-900 flex items-center justify-center">
                    <Leaf className="w-9 h-9 text-white" />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-surface-800/70 p-3 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Current</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{streak?.currentStreak}</p>
                </div>
                <div className="rounded-2xl bg-surface-800/70 p-3 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Longest</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{streak?.longestStreak}</p>
                </div>
                <div className="rounded-2xl bg-surface-800/70 p-3 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Points</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(streak?.rewardPoints)}</p>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Progress to {streak?.nextMilestone}-day milestone</span>
                  <span>{streak?.daysToNextMilestone} days left</span>
                </div>
                <ProgressBar value={streak?.growthProgressPct || 0} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={checkingIn || streak?.checkedInToday}
                  className="btn-primary"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{streak?.checkedInToday ? 'Checked in today' : checkingIn ? 'Checking in...' : 'Check in now'}</span>
                </button>
                <div className="inline-flex items-center gap-2 rounded-full border border-surface-500/20 bg-surface-800/70 px-4 py-2 text-sm text-slate-300">
                  <Shield className="w-4 h-4 text-sky-300" />
                  {streak?.freezeCredits} freeze shields
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-surface-500/20 bg-surface-700/30 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Daily AI Tip Unlock</p>
                    <p className="text-xs text-slate-500 mt-1">Feature 4: unlocks after today’s check-in</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-brand-300" />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  {streak?.unlockedDailyTip || 'Check in today to unlock your personalized AI tip based on your emission pattern.'}
                </p>
              </div>

              <div className="rounded-3xl border border-surface-500/20 bg-surface-700/30 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Weekly Reward Box</p>
                    <p className="text-xs text-slate-500 mt-1">Feature 7: open every 7 streak days</p>
                  </div>
                  <Gift className="w-5 h-5 text-amber-300" />
                </div>
                <p className="mt-4 text-sm text-slate-300">
                  {streak?.weeklyRewardReady
                    ? `You have ${streak?.weeklyBoxesAvailable} reward box${streak?.weeklyBoxesAvailable > 1 ? 'es' : ''} ready to open.`
                    : 'Keep your streak alive until the next 7-day mark to open a reward box.'}
                </p>
                <button
                  type="button"
                  onClick={handleClaimBox}
                  disabled={claimingBox || !streak?.weeklyRewardReady}
                  className="btn-secondary mt-4"
                >
                  <Gift className="w-4 h-4" />
                  <span>{claimingBox ? 'Opening...' : 'Open reward box'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="Recent Streak Week" subtitle="Feature 9: perfect green days are highlighted" />
          <div className="grid grid-cols-7 gap-2">
            {(streak?.recentCalendar || []).map((day) => {
              const label = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })
              const dayOfMonth = new Date(day.date).getDate()

              return (
                <div
                  key={day.date}
                  className={`rounded-2xl border px-2 py-3 text-center ${
                    day.checkedIn
                      ? day.perfectGreenDay
                        ? 'border-brand-500/30 bg-brand-500/15'
                        : 'border-sky-500/20 bg-sky-500/10'
                      : 'border-surface-500/20 bg-surface-700/30'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-base font-semibold text-white">{dayOfMonth}</p>
                  <p className={`mt-1 text-[10px] ${
                    day.checkedIn ? (day.perfectGreenDay ? 'text-brand-300' : 'text-sky-300') : 'text-slate-500'
                  }`}>
                    {day.checkedIn ? (day.perfectGreenDay ? 'Green' : 'Check') : 'Miss'}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Perfect green days</p>
              <p className="mt-2 text-2xl font-semibold text-white">{streak?.perfectGreenDays}</p>
              <p className="text-xs text-slate-500 mt-1">Low-emission days inside the zone target</p>
            </div>
            <div className="rounded-2xl bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Total check-ins</p>
              <p className="mt-2 text-2xl font-semibold text-white">{streak?.totalCheckIns}</p>
              <p className="text-xs text-slate-500 mt-1">Daily return visits captured</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-4">
        <div className="glass-card p-5">
          <SectionHeader title="Zone Squad" subtitle="Features 5 and 10: your zone acts like your team" action={<Users className="w-4 h-4 text-brand-300" />} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Zone squad</p>
              <p className="mt-2 text-lg font-semibold text-white">{streak?.zoneName || 'Unassigned'}</p>
              <p className="text-xs text-slate-500 mt-1">Shared team identity for streak energy</p>
            </div>
            <div className="rounded-2xl bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Active today</p>
              <p className="mt-2 text-2xl font-semibold text-white">{streak?.zoneActiveUsersToday}</p>
              <p className="text-xs text-slate-500 mt-1">of {streak?.zoneTotalUsers} users in your zone</p>
            </div>
            <div className="rounded-2xl bg-surface-700/30 p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Team active streak</p>
              <p className="mt-2 text-2xl font-semibold text-white">{streak?.zoneActiveDayStreak}</p>
              <p className="text-xs text-slate-500 mt-1">consecutive days your zone stayed active</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-surface-500/20 bg-surface-700/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Zone team momentum</p>
                <p className="text-xs text-slate-500 mt-1">The more users check in daily, the stronger your team retention story looks in the demo.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-300" />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Zone participation today</span>
                <span>{streak?.zoneTotalUsers ? Math.round((streak.zoneActiveUsersToday / streak.zoneTotalUsers) * 100) : 0}%</span>
              </div>
              <ProgressBar
                value={streak?.zoneTotalUsers ? (streak.zoneActiveUsersToday / streak.zoneTotalUsers) * 100 : 0}
                color="bg-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="Zone Competition" subtitle="Feature 5: live zone battle based on daily active users" action={<Trophy className="w-4 h-4 text-amber-300" />} />

          <div className="space-y-3">
            {(streak?.zoneCompetition || []).length > 0 ? (
              streak.zoneCompetition.map((entry) => (
                <div
                  key={entry.zoneId}
                  className={`rounded-2xl border p-4 ${
                    entry.currentZone ? 'border-brand-500/20 bg-brand-500/10' : 'border-surface-500/20 bg-surface-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-semibold ${
                        entry.rank === 1 ? 'bg-amber-500/20 text-amber-300' : 'bg-surface-800 text-white'
                      }`}>
                        #{entry.rank}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{entry.zoneName}</p>
                        <p className="text-xs text-slate-500">{entry.activeUsersToday} active users today</p>
                      </div>
                    </div>
                    {entry.currentZone && <Badge variant="green">Your zone</Badge>}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 text-sm text-slate-400">
                No zone competition data yet. Once users start daily check-ins, the leaderboard will light up.
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-surface-500/20 bg-surface-700/20 p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="w-5 h-5 text-sky-300 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">Why this boosts daily logins</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Users now have daily reasons to return: protect their streak, unlock the AI tip, keep the zone squad active,
                  collect weekly boxes, and avoid losing momentum even when a freeze shield is needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
