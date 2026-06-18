import { useState } from 'react'
import { Trophy, Medal, Crown } from 'lucide-react'
import { userApi } from '../../api/userApi'
import { useFetch } from '../../hooks/useFetch'
import { PageLoader, ErrorState } from '../../components/ui'
import { IdentityAvatar } from '../../components/ui/UserAvatar'
import { formatCarbonShort, MONTHS } from '../../utils/helpers'

const rankIcon = (rank) => {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />
  return <span className="text-slate-500 text-sm font-mono">#{rank}</span>
}

export default function Leaderboard() {
  const [month] = useState(new Date().getMonth() + 1)
  const [year] = useState(new Date().getFullYear())
  const { data, loading, error } = useFetch(() => userApi.getLeaderboard(month, year), [month, year])

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} />

  const entries = data?.entries || []
  const currentUserEntry = entries.find((e) => e.currentUser)

  return (
    <div className="space-y-5 animate-slide-up max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Zone Leaderboard</h1>
        <p className="page-subtitle">
          {data?.zoneName} · {MONTHS[month - 1]} {year}
        </p>
      </div>

      {/* Current user rank highlight */}
      {currentUserEntry && (
        <div className="glass-card p-4 border-brand-700/40 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Your rank this month</p>
            <p className="text-xl font-bold text-white">
              #{currentUserEntry.rank}
              <span className="text-sm text-slate-400 font-normal ml-2">
                of {entries.length} in {data?.zoneName}
              </span>
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-slate-400">Your emission</p>
            <p className="text-lg font-semibold text-brand-400">
              {formatCarbonShort(currentUserEntry.monthlyEmission)}
            </p>
          </div>
        </div>
      )}

      {/* Winner banner */}
      {data?.winner && (
        <div className="glass-card p-4 bg-gradient-to-r from-yellow-900/20 to-transparent border-yellow-700/20">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-xs text-yellow-600 uppercase tracking-wider font-semibold">This month's leader</p>
              <p className="text-sm font-semibold text-white">{data.winner}</p>
            </div>
            <span className="ml-auto text-sm font-semibold text-yellow-400">
              {formatCarbonShort(data.winnerEmission)}
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      {entries.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No leaderboard data for this zone yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Monthly Emission</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.userId}
                  className={entry.currentUser ? '!bg-brand-900/20 !border-brand-800/30' : ''}
                >
                  <td>
                    <div className="flex items-center gap-2">
                      {rankIcon(entry.rank)}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <IdentityAvatar identity={entry.userId || entry.name} size="sm" className="flex-shrink-0" />
                      <span className={entry.currentUser ? 'text-brand-300 font-semibold' : 'text-white'}>
                        {entry.name}
                        {entry.currentUser && <span className="ml-1.5 text-[10px] text-brand-500">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`font-medium ${
                      entry.rank === 1 ? 'text-yellow-400' :
                      entry.rank <= 3 ? 'text-brand-400' : 'text-slate-300'
                    }`}>
                      {formatCarbonShort(entry.monthlyEmission)}
                    </span>
                  </td>
                  <td className="font-mono text-sm text-slate-300">{entry.rewardPoints || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
