import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, Bell, Flame, Megaphone, Search, Send, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { adminApi } from '../../api/adminApi'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import { PageLoader, ErrorState, EmptyState, StatCard } from '../../components/ui'
import { EmissionBarChart } from '../../components/charts'
import { formatCarbonShort, formatCarbon } from '../../utils/helpers'

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

export default function HighEmitters() {
  const { token, isAdmin } = useAuth()
  const isSessionReady = Boolean(token && isAdmin)
  const { data: emitters, loading, error, refetch } = useFetch(adminApi.getHighEmitters, [], { enabled: isSessionReady })
  const { data: history, refetch: refetchHistory } = useFetch(adminApi.getNotificationHistory, [], { enabled: isSessionReady })
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('carbon')
  const [broadcastTitle, setBroadcastTitle] = useState('Admin Notice')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastSeverity, setBroadcastSeverity] = useState('MEDIUM')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const [sendingInbuilt, setSendingInbuilt] = useState(false)
  const [sendingSelected, setSendingSelected] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [lastDispatch, setLastDispatch] = useState(null)

  const applyBroadcastTemplate = (templateType) => {
    if (templateType === 'EMISSION_ALERT') {
      setBroadcastTitle('Urgent Emission Advisory from CarbonTrack Admin')
      setBroadcastSeverity('HIGH')
      setBroadcastMessage(
        'Attention all users.\n' +
        'Recent emission trends are increasing across multiple zones.\n' +
        'Please reduce fuel-heavy travel and unnecessary electricity usage this week.\n' +
        'Track your daily entries carefully and stay within safer limits.\n' +
        'Small reductions now can prevent danger-level alerts later.\n' +
        'Thank you for supporting a cleaner and safer environment.'
      )
      return
    }

    if (templateType === 'WISHES') {
      setBroadcastTitle('Best Wishes from CarbonTrack Admin')
      setBroadcastSeverity('LOW')
      setBroadcastMessage(
        'Warm wishes from the CarbonTrack admin team.\n' +
        'Keep building healthy, low-emission habits every day.\n' +
        'Your small actions are creating measurable environmental impact.\n' +
        'Continue logging activities to maintain your green streak.\n' +
        'Thank you for being part of this sustainability mission.'
      )
      return
    }

    setBroadcastTitle('Weekly Carbon Reduction Reminder')
    setBroadcastSeverity('MEDIUM')
    setBroadcastMessage(
      'Weekly reminder from CarbonTrack Admin.\n' +
      'Review your top emission source and reduce it by at least 10% this week.\n' +
      'Prefer shared transport, efficient power use, and waste segregation.\n' +
      'Monitor your dashboard trend before adding new high-impact entries.\n' +
      'Stay consistent to avoid high-emitter warnings.'
    )
  }

  const list = emitters || []
  const normalizedList = useMemo(
    () =>
      list.map((entry) => ({
        userId: entry.userId ?? entry.id ?? null,
        userName: entry.userName || entry.name || 'User',
        userEmail: entry.userEmail || entry.email || '',
        zoneName: entry.zoneName || 'No zone',
        totalCarbon: Number(entry.totalCarbon ?? entry.totalEmission ?? 0),
        alertStatus: entry.alertStatus || 'PENDING',
        thresholdKg: entry.thresholdKg ?? entry.thresholdValue ?? null,
      })),
    [list]
  )

  if (!isSessionReady) return <PageLoader />
  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} />

  const filtered = normalizedList
    .filter((e) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (e.userName || '').toLowerCase().includes(q) ||
        (e.userEmail || '').toLowerCase().includes(q) ||
        (e.zoneName || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) =>
      sortBy === 'carbon'
        ? (b.totalCarbon || 0) - (a.totalCarbon || 0)
        : (a.userName || '').localeCompare(b.userName || '')
    )

  const filteredUserIds = filtered
    .map((entry) => entry.userId)
    .filter((id) => id !== null && id !== undefined)
  const selectedInViewCount = filteredUserIds.filter((id) => selectedUserIds.includes(id)).length
  const allFilteredSelected = filteredUserIds.length > 0 && selectedInViewCount === filteredUserIds.length

  const totalCarbon = normalizedList.reduce((s, e) => s + (e.totalCarbon || 0), 0)
  const avgCarbon = normalizedList.length ? totalCarbon / normalizedList.length : 0
  const chartData = filtered.slice(0, 10).map((e) => ({
    name: (e.userName || '?').split(' ')[0],
    emission: Number((e.totalCarbon || 0).toFixed(1)),
  }))
  const historyList = Array.isArray(history) ? history : []

  const sendBroadcast = async () => {
    const title = broadcastTitle.trim()
    const message = broadcastMessage.trim()

    if (!title) {
      toast.error('Please add a title')
      return
    }
    if (!message) {
      toast.error('Please add a message')
      return
    }

    setSendingBroadcast(true)
    try {
      const response = await adminApi.broadcastToAllUsers({
        title,
        message,
        severity: broadcastSeverity,
      })
      setLastDispatch(response.data)
      setBroadcastMessage('')
      toast.success(`Broadcast sent to ${response.data?.recipients || 0} users`)
      await Promise.all([refetch(), refetchHistory()])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send broadcast')
    } finally {
      setSendingBroadcast(false)
    }
  }

  const sendInbuiltHighEmitterMessage = async () => {
    setSendingInbuilt(true)
    try {
      const response = await adminApi.sendInbuiltHighEmitterMessage()
      setLastDispatch(response.data)
      toast.success(`Inbuilt high-emitter alert sent to ${response.data?.recipients || 0} users`)
      await Promise.all([refetch(), refetchHistory()])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send inbuilt warning')
    } finally {
      setSendingInbuilt(false)
    }
  }

  const toggleUserSelection = (userId) => {
    if (userId === null || userId === undefined) return
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const toggleSelectAllFiltered = () => {
    if (filteredUserIds.length === 0) return
    setSelectedUserIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((id) => !filteredUserIds.includes(id))
      }
      const merged = new Set([...prev, ...filteredUserIds])
      return Array.from(merged)
    })
  }

  const sendInbuiltWarningToSelected = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('Select at least one high emitter user')
      return
    }

    setSendingSelected(true)
    try {
      const response = await adminApi.sendInbuiltHighEmitterMessageToSelected(selectedUserIds)
      setLastDispatch(response.data)
      toast.success(`Warning sent to ${response.data?.recipients || 0} selected users`)
      await Promise.all([refetch(), refetchHistory()])
      setSelectedUserIds([])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send warning to selected users')
    } finally {
      setSendingSelected(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header rounded-3xl border border-red-300/25 bg-red-500/10 p-5"
      >
        <h1 className="page-title">High Emitters</h1>
        <p className="page-subtitle">Users flagged for above-threshold carbon output</p>
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-red-200/80">Critical Risk Interface</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={AlertTriangle}
          iconColor="text-red-400"
          iconBg="bg-red-900/30"
          label="Total flagged"
          value={normalizedList.length}
          sub="Pending review"
        />
        <StatCard
          icon={Flame}
          iconColor="text-orange-400"
          iconBg="bg-orange-900/30"
          label="Combined CO2"
          value={formatCarbonShort(totalCarbon)}
          sub="All flagged users"
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-amber-400"
          iconBg="bg-amber-900/30"
          label="Average emission"
          value={formatCarbonShort(avgCarbon)}
          sub="Per flagged user"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Admin Broadcast Message</h2>
              <p className="text-xs text-slate-400">Send wishes, updates, or urgent emission notices to all users</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-brand-200">
              <Megaphone className="h-3 w-3" />
              All users
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="input-field"
              maxLength={120}
              placeholder="Example: Festival wishes from CarbonTrack Admin"
            />
            <select
              value={broadcastSeverity}
              onChange={(e) => setBroadcastSeverity(e.target.value)}
              className="input-field w-full md:w-40"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyBroadcastTemplate('EMISSION_ALERT')}
              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-200 transition hover:bg-red-500/20"
            >
              Use Emission Alert Template
            </button>
            <button
              type="button"
              onClick={() => applyBroadcastTemplate('WEEKLY_REMINDER')}
              className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/20"
            >
              Use Weekly Reminder
            </button>
            <button
              type="button"
              onClick={() => applyBroadcastTemplate('WISHES')}
              className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-3 py-1.5 text-[11px] font-medium text-brand-200 transition hover:bg-brand-500/20"
            >
              Use Wishes Template
            </button>
          </div>

          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            rows={6}
            className="input-field mt-3 resize-none"
            placeholder="Type your message for all users..."
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">This sends website notifications to every active user account.</p>
            <button
              onClick={sendBroadcast}
              disabled={sendingBroadcast}
              className="btn-primary"
            >
              <Send className="h-4 w-4" />
              <span>{sendingBroadcast ? 'Sending...' : 'Broadcast to All'}</span>
            </button>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Inbuilt High-Emitter Warning</h2>
              <p className="text-xs text-slate-400">One click sends a predefined warning to all current high emitters by email and website notification</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-red-200">
              <Bell className="h-3 w-3" />
              High emitters
            </span>
          </div>

          <button
            onClick={sendInbuiltHighEmitterMessage}
            disabled={sendingInbuilt}
            className="btn-danger w-full"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{sendingInbuilt ? 'Sending...' : 'Send Inbuilt Warning'}</span>
          </button>

          <button
            onClick={sendInbuiltWarningToSelected}
            disabled={sendingSelected || selectedUserIds.length === 0}
            className="btn-secondary mt-3 w-full border-red-400/35 bg-red-500/10 text-red-100 hover:bg-red-500/18 disabled:opacity-50"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{sendingSelected ? 'Sending...' : `Send Warning to Selected (${selectedUserIds.length})`}</span>
          </button>

          <p className="mt-2 text-[11px] text-slate-500">
            Select users from the table below and send targeted warning only to them.
          </p>

          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-950/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-200/80">Inbuilt Warning Preview</p>
            <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-300">
              {`Danger level alert from CarbonTrack Admin.
Current monthly emission is above your safe threshold.
Main pressure area has been identified from recent entries.
Reduce high-impact activity immediately over the next 7 days.
Avoid unnecessary fuel and electricity use to return to safe range.
If this trend continues, stronger zone controls may apply.`}
            </p>
          </div>

          {lastDispatch && (
            <div className="mt-4 rounded-2xl border border-surface-500/20 bg-surface-800/60 p-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Latest Dispatch</p>
              <p className="mt-1 text-sm font-medium text-white">{lastDispatch.title}</p>
              <p className="mt-1 text-xs text-slate-400">{lastDispatch.message}</p>
              <p className="mt-2 text-xs text-brand-300">
                Sent to {lastDispatch.recipients || 0} users • {formatTimeAgo(lastDispatch.createdAt)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Admin Sent Message History</h2>
          <span className="text-xs text-slate-500">{historyList.length} records</span>
        </div>
        {historyList.length === 0 ? (
          <p className="text-sm text-slate-500">No broadcast history yet.</p>
        ) : (
          <div className="space-y-2">
            {historyList.map((item, index) => (
              <div key={item.id || index} className="rounded-xl border border-surface-500/20 bg-surface-800/55 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-white">{item.description}</p>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">{formatTimeAgo(item.createdAt)}</span>
                </div>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">
                  {item.actionType} • {item.actorEmail || 'admin'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Emitters by CO2</h2>
          <EmissionBarChart data={chartData} dataKey="emission" xKey="name" color="#ef4444" />
        </div>
      )}

      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email or zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {[['carbon', 'By Emission'], ['name', 'By Name']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSortBy(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === val ? 'bg-brand-600 text-white' : 'bg-surface-700/50 text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-500">{filtered.length} results • {selectedInViewCount} selected in view</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No high emitters found"
          description={normalizedList.length ? 'No results match your search.' : 'All users are within acceptable emission thresholds.'}
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAllFiltered}
                    className="h-4 w-4 accent-brand-500"
                    aria-label="Select all filtered high emitters"
                  />
                </th>
                <th>User</th>
                <th>Zone</th>
                <th>Total CO2</th>
                <th>Alert status</th>
                <th>Threshold exceeded</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.userId || i}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(e.userId)}
                      onChange={() => toggleUserSelection(e.userId)}
                      disabled={e.userId === null || e.userId === undefined}
                      className="h-4 w-4 accent-brand-500"
                      aria-label={`Select ${e.userName}`}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-red-900/40 flex items-center justify-center text-red-400 text-xs font-bold flex-shrink-0">
                        {(e.userName || '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{e.userName}</p>
                        <p className="text-[11px] text-slate-500">{e.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-amber">{e.zoneName || 'No zone'}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-red-400 text-sm">
                      {formatCarbon(e.totalCarbon)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      e.alertStatus === 'PENDING' ? 'badge-red'
                        : e.alertStatus === 'RESOLVED' ? 'badge-green' : 'badge-amber'
                    }`}
                    >
                      {e.alertStatus || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    {e.thresholdKg != null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-600 rounded-full h-1.5 max-w-[80px]">
                          <div
                            className="h-1.5 rounded-full bg-red-500 transition-all"
                            style={{ width: `${Math.min(100, ((e.totalCarbon - e.thresholdKg) / e.thresholdKg) * 100 + 50)}%` }}
                          />
                        </div>
                        <span className="text-xs text-red-400 font-medium">
                          +{formatCarbonShort((e.totalCarbon || 0) - (e.thresholdKg || 0))}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
