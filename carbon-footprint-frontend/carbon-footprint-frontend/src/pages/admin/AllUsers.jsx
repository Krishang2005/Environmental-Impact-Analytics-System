import { useState } from 'react'
import toast from 'react-hot-toast'
import { Search, Users, MapPin, Activity, Settings2, Shield, Gift, Flame } from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { PageLoader, ErrorState, EmptyState, Modal, Spinner } from '../../components/ui'
import { formatCarbonShort, formatDate, getActivityLabel, getErrorMessage } from '../../utils/helpers'

const defaultForm = {
  currentStreak: '',
  longestStreak: '',
  totalCheckIns: '',
  freezeCredits: '',
  perfectGreenDays: '',
  customMilestoneTargetDays: '',
  weeklyBoxesAvailable: '',
  bonusRewardPoints: '',
  bonusRewardDescription: '',
}

export default function AllUsers() {
  const { token, isAdmin } = useAuth()
  const isSessionReady = Boolean(token && isAdmin)
  const { data: users, loading, error, refetch } = useFetch(adminApi.getAllUsers, [], { enabled: isSessionReady })
  const { data: zones } = useFetch(adminApi.getZones, [], { enabled: isSessionReady })
  const [search, setSearch] = useState('')
  const [streakModalOpen, setStreakModalOpen] = useState(false)
  const [streakLoading, setStreakLoading] = useState(false)
  const [streakSaving, setStreakSaving] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [zoneSavingUserId, setZoneSavingUserId] = useState(null)
  const [streakProfile, setStreakProfile] = useState(null)
  const [streakForm, setStreakForm] = useState(defaultForm)

  if (!isSessionReady) return <PageLoader />
  if (loading) return <PageLoader />
  if (error) return <ErrorState message={typeof error === 'string' ? error : 'Could not load users'} />

  const list = Array.isArray(users) ? users : []
  const zoneList = Array.isArray(zones) ? zones : []

  const filtered = list.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  })

  const openStreakModal = async (user) => {
    setSelectedUser(user)
    setStreakModalOpen(true)
    setStreakLoading(true)

    try {
      const res = await adminApi.getUserStreakProfile(user.id)
      const profile = res.data
      setStreakProfile(profile)
      setStreakForm({
        currentStreak: profile.currentStreak ?? '',
        longestStreak: profile.longestStreak ?? '',
        totalCheckIns: profile.totalCheckIns ?? '',
        freezeCredits: profile.freezeCredits ?? '',
        perfectGreenDays: profile.perfectGreenDays ?? '',
        customMilestoneTargetDays: profile.customMilestoneTargetDays ?? '',
        weeklyBoxesAvailable: profile.weeklyBoxesAvailable ?? '',
        bonusRewardPoints: '',
        bonusRewardDescription: '',
      })
    } catch (err) {
      toast.error(getErrorMessage(err))
      setStreakModalOpen(false)
    } finally {
      setStreakLoading(false)
    }
  }

  const updateField = (field, value) => {
    setStreakForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveStreak = async (e) => {
    e.preventDefault()
    if (!selectedUser) return

    setStreakSaving(true)
    try {
      const payload = {
        currentStreak: Number(streakForm.currentStreak || 0),
        longestStreak: Number(streakForm.longestStreak || 0),
        totalCheckIns: Number(streakForm.totalCheckIns || 0),
        freezeCredits: Number(streakForm.freezeCredits || 0),
        perfectGreenDays: Number(streakForm.perfectGreenDays || 0),
        customMilestoneTargetDays: streakForm.customMilestoneTargetDays
          ? Number(streakForm.customMilestoneTargetDays)
          : 0,
        weeklyBoxesAvailable: Number(streakForm.weeklyBoxesAvailable || 0),
        bonusRewardPoints: streakForm.bonusRewardPoints ? Number(streakForm.bonusRewardPoints) : 0,
        bonusRewardDescription: streakForm.bonusRewardDescription,
      }

      const res = await adminApi.updateUserStreakProfile(selectedUser.id, payload)
      setStreakProfile(res.data)
      setStreakForm((prev) => ({
        ...prev,
        currentStreak: res.data.currentStreak ?? '',
        longestStreak: res.data.longestStreak ?? '',
        totalCheckIns: res.data.totalCheckIns ?? '',
        freezeCredits: res.data.freezeCredits ?? '',
        perfectGreenDays: res.data.perfectGreenDays ?? '',
        customMilestoneTargetDays: res.data.customMilestoneTargetDays ?? '',
        weeklyBoxesAvailable: res.data.weeklyBoxesAvailable ?? '',
        bonusRewardPoints: '',
        bonusRewardDescription: '',
      }))
      toast.success('User streak settings updated')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setStreakSaving(false)
    }
  }

  const handleZoneAssign = async (user, zoneId) => {
    if (!zoneId) return
    setZoneSavingUserId(user.id)
    try {
      await adminApi.assignUserZone(user.id, zoneId)
      toast.success('User zone assigned')
      await refetch()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setZoneSavingUserId(null)
    }
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">All Users</h1>
          <p className="page-subtitle">Registered users across all zones, with admin streak management</p>
        </div>
        <span className="badge-slate">{list.length} total</span>
      </div>

      <div className="glass-card p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <span className="text-sm text-slate-400">{filtered.length} results</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="No users match your search." />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Address</th>
                <th>Zone</th>
                <th>Last Entry</th>
                <th>Monthly</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const name = u.name || '-'
                const email = u.email || '-'
                const address = u.address || '-'
                const zone = u.zoneName || '-'
                const latestEntry = u.latestActivityType
                  ? `${getActivityLabel(u.latestActivityType)} | ${formatCarbonShort(u.latestEmissionAmount)}`
                  : 'No entries yet'

                return (
                  <tr key={u.id || i}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{name}</span>
                      </div>
                    </td>
                    <td className="min-w-[180px] text-slate-400 text-sm">{email}</td>
                    <td className="min-w-[220px]">
                      {address !== '-' ? (
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="min-w-[130px]">
                      {zone !== '-' ? (
                        <span className={u.zoneStatus === 'ASSIGNED' ? 'badge-green' : 'badge-amber'}>
                          {zone}
                        </span>
                      ) : (
                        <span className="badge-slate">Unassigned</span>
                      )}
                      <select
                        className="input-field mt-2 text-xs"
                        defaultValue=""
                        disabled={zoneSavingUserId === u.id}
                        onChange={(event) => handleZoneAssign(u, event.target.value)}
                      >
                        <option value="">Assign zone</option>
                        {zoneList.map((zoneItem) => (
                          <option key={zoneItem.id} value={zoneItem.id}>{zoneItem.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="min-w-[190px]">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                          <Activity className="w-3.5 h-3.5 text-brand-400" />
                          <span>{latestEntry}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {u.latestEmissionDate ? formatDate(u.latestEmissionDate) : 'No emission history'}
                        </p>
                      </div>
                    </td>
                    <td className="min-w-[110px]">
                      <span className={`font-medium text-sm ${
                        u.monthlyEmission > 500 ? 'text-red-400'
                          : u.monthlyEmission > 200 ? 'text-amber-400' : 'text-brand-400'
                      }`}>
                        {formatCarbonShort(u.monthlyEmission)}
                      </span>
                    </td>
                    <td className="min-w-[150px]">
                      <button
                        type="button"
                        onClick={() => openStreakModal(u)}
                        className="btn-secondary w-full justify-center text-xs whitespace-nowrap"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Manage Streak</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        title={selectedUser ? `Manage Streak: ${selectedUser.name}` : 'Manage Streak'}
        size="lg"
      >
        {streakLoading ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <Spinner />
            <p className="text-sm text-slate-500">Loading streak controls...</p>
          </div>
        ) : streakProfile ? (
          <form onSubmit={handleSaveStreak} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-surface-700/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Zone</p>
                <p className="mt-1 text-sm font-semibold text-white">{streakProfile.zoneName}</p>
              </div>
              <div className="rounded-xl bg-surface-700/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Reward points</p>
                <p className="mt-1 text-sm font-semibold text-white">{streakProfile.rewardPoints}</p>
              </div>
              <div className="rounded-xl bg-surface-700/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Next milestone</p>
                <p className="mt-1 text-sm font-semibold text-white">{streakProfile.nextMilestone}</p>
              </div>
              <div className="rounded-xl bg-surface-700/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Days remaining</p>
                <p className="mt-1 text-sm font-semibold text-white">{streakProfile.daysToNextMilestone}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Flame className="w-4 h-4 text-amber-300" />
                  Core Streak Controls
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Current streak</label>
                    <input type="number" min="0" value={streakForm.currentStreak} onChange={(e) => updateField('currentStreak', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Longest streak</label>
                    <input type="number" min="0" value={streakForm.longestStreak} onChange={(e) => updateField('longestStreak', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Total check-ins</label>
                    <input type="number" min="0" value={streakForm.totalCheckIns} onChange={(e) => updateField('totalCheckIns', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Perfect green days</label>
                    <input type="number" min="0" value={streakForm.perfectGreenDays} onChange={(e) => updateField('perfectGreenDays', e.target.value)} className="input-field" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4 space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Shield className="w-4 h-4 text-sky-300" />
                  Admin Controls
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Freeze shields</label>
                    <input type="number" min="0" value={streakForm.freezeCredits} onChange={(e) => updateField('freezeCredits', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Weekly boxes</label>
                    <input type="number" min="0" value={streakForm.weeklyBoxesAvailable} onChange={(e) => updateField('weeklyBoxesAvailable', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="label">Custom milestone target</label>
                    <input type="number" min="0" value={streakForm.customMilestoneTargetDays} onChange={(e) => updateField('customMilestoneTargetDays', e.target.value)} className="input-field" placeholder="Optional" />
                  </div>
                  <div>
                    <label className="label">Bonus reward points</label>
                    <input type="number" min="0" value={streakForm.bonusRewardPoints} onChange={(e) => updateField('bonusRewardPoints', e.target.value)} className="input-field" placeholder="Optional" />
                  </div>
                </div>

                <div>
                  <label className="label">Bonus reason</label>
                  <input
                    type="text"
                    value={streakForm.bonusRewardDescription}
                    onChange={(e) => updateField('bonusRewardDescription', e.target.value)}
                    className="input-field"
                    placeholder="Example: Admin bonus for demo recovery"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-surface-700/20 border border-surface-500/20 p-4 text-sm text-slate-400">
              Admin can now tune streak momentum for each user by adjusting milestone targets, freeze shields,
              weekly reward availability, green-day counts, and one-time bonus points.
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={streakSaving} className="btn-primary">
                {streakSaving ? <Spinner size="sm" /> : 'Save streak settings'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}
