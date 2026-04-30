import { useState } from 'react'
import { ListOrdered, Search } from 'lucide-react'
import { carbonApi } from '../../api/carbonApi'
import { useFetch } from '../../hooks/useFetch'
import { ErrorState, EmptyState, PageLoader } from '../../components/ui'
import { ACTIVITY_COLORS, getActivityLabel, getActivityUnit, formatCarbon, formatDate } from '../../utils/helpers'

export default function MyEntries() {
  const { data: entries, loading, error } = useFetch(carbonApi.getMyEntries)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} />

  const activityTypes = ['ALL', ...new Set(entries?.map((entry) => entry.activityType) || [])]

  const filtered = (entries || []).filter((entry) => {
    const matchType = filterType === 'ALL' || entry.activityType === filterType
    const matchSearch = !search ||
      getActivityLabel(entry.activityType).toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const total = filtered.reduce((sum, entry) => sum + (entry.carbonAmount || 0), 0)

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="page-header">
        <h1 className="page-title">My Entries</h1>
        <p className="page-subtitle">All your logged carbon activities</p>
      </div>

      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {activityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === type
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-700/50 text-slate-400 hover:text-white hover:bg-surface-600'
              }`}
            >
              {type === 'ALL' ? 'All' : getActivityLabel(type)}
            </button>
          ))}
        </div>

        <div className="ml-auto text-sm text-slate-400">
          Total: <span className="font-semibold text-white">{total.toFixed(2)} kg CO2</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No entries found"
          description={entries?.length ? 'No entries match your filters.' : 'Start by adding your first carbon entry.'}
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Activity</th>
                <th>Quantity</th>
                <th>CO2 Emission</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="text-slate-500 font-mono text-xs">{index + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ACTIVITY_COLORS[entry.activityType] || '#64748b' }}
                      />
                      <span className="font-medium text-white">{getActivityLabel(entry.activityType)}</span>
                    </div>
                  </td>
                  <td className="font-mono text-sm">
                    {entry.quantity} {getActivityUnit(entry.activityType)}
                  </td>
                  <td>
                    <span className={`font-semibold ${entry.carbonAmount > 50 ? 'text-red-400' : entry.carbonAmount > 20 ? 'text-amber-400' : 'text-brand-400'}`}>
                      {formatCarbon(entry.carbonAmount)}
                    </span>
                  </td>
                  <td className="text-slate-500 text-sm">{formatDate(entry.date || entry.entryDate || entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
