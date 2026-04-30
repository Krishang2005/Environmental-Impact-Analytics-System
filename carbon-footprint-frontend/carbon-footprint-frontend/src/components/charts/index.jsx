import { useEffect, useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar,
  Sankey,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'
import { CHART_COLORS, ACTIVITY_COLORS, getActivityLabel } from '../../utils/helpers'

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#18201d',
    border: '1px solid rgba(45,63,59,0.5)',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#e2e8f0',
  },
  labelStyle: { color: '#94a3b8', marginBottom: 4 },
}

export function EmissionAreaChart({ data, dataKey = 'emission', xKey = 'month' }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00a872" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00a872" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,63,59,0.4)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v} kg CO₂`, 'Emission']} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#00a872"
          strokeWidth={2}
          fill="url(#areaGrad)"
          dot={{ fill: '#00a872', r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#05d08e' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function EmissionBarChart({ data, dataKey = 'emission', xKey = 'name', color = '#00a872' }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,63,59,0.4)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${Number(v).toFixed(1)} kg CO₂`, 'Emission']} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryPieChart({ data }) {
  const formatted = data?.map((d) => ({
    name: getActivityLabel(d.activityType),
    value: d.carbonAmount,
    color: ACTIVITY_COLORS[d.activityType] || '#64748b',
  })) || []

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {formatted.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          {...TOOLTIP_STYLE}
          formatter={(v, name) => [`${Number(v).toFixed(2)} kg CO₂`, name]}
        />
        <Legend
          formatter={(value) => (
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
          )}
          wrapperStyle={{ paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ZoneBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 60, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,63,59,0.4)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={55} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${Number(v).toFixed(1)} kg CO₂`, 'Total']} />
        <Bar dataKey="totalEmission" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data?.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function MultiBarChart({ data, keys, xKey = 'month' }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,63,59,0.4)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
        {keys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[3, 3, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ScoreGauge({ score = 0 }) {
  const pct = Math.min(100, Math.max(0, score))
  const data = [{ value: pct }, { value: 100 - pct }]
  const color = pct >= 70 ? '#00a872' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={220}
            endAngle={-40}
            innerRadius={55}
            outerRadius={75}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} stroke="transparent" />
            <Cell fill="#1e2926" stroke="transparent" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-white">{Math.round(pct)}</span>
        <span className="text-xs text-slate-500">Green Score</span>
      </div>
    </div>
  )
}

const FLOW_SCOPE_MAP = {
  CAR: 'Mobility',
  BIKE: 'Mobility',
  BUS: 'Mobility',
  TRAIN: 'Mobility',
  FLIGHT: 'Mobility',
  ELECTRICITY: 'Home Energy',
  AC: 'Home Energy',
  DIESEL: 'Fuel',
  PETROL: 'Fuel',
  LPG: 'Fuel',
  CNG: 'Fuel',
  PNG: 'Fuel',
  KEROSENE: 'Fuel',
  NATURAL_GAS: 'Fuel',
  GENERATOR: 'Fuel',
  WASTE: 'Waste & Other',
  INDUSTRIAL_WASTE: 'Waste & Other',
}

const DIMENSION_TARGET_WEIGHTS = {
  Mobility: 0.25,
  Home: 0.25,
  Fuel: 0.15,
  Materials: 0.1,
  Waste: 0.1,
  Lifestyle: 0.15,
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function formatShortDate(value) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export function EmissionFlowSankey({ data = [] }) {
  const sankeyData = useMemo(() => {
    if (!data.length) {
      return {
        nodes: [{ name: 'No Data' }],
        links: [],
      }
    }

    const top = [...data]
      .sort((a, b) => (b.carbonAmount || 0) - (a.carbonAmount || 0))
      .slice(0, 6)

    const scopeTotals = {}
    top.forEach((item) => {
      const scope = FLOW_SCOPE_MAP[item.activityType] || 'Waste & Other'
      scopeTotals[scope] = (scopeTotals[scope] || 0) + (item.carbonAmount || 0)
    })

    const categoryNodes = top.map((item) => getActivityLabel(item.activityType))
    const scopeNodes = Object.keys(scopeTotals)
    const nodes = [
      ...categoryNodes.map((name) => ({ name })),
      ...scopeNodes.map((name) => ({ name })),
      { name: 'Total Footprint' },
    ]

    const totalNodeIndex = nodes.length - 1
    const links = []

    top.forEach((item, index) => {
      const scope = FLOW_SCOPE_MAP[item.activityType] || 'Waste & Other'
      const scopeIndex = categoryNodes.length + scopeNodes.indexOf(scope)
      const value = Number(item.carbonAmount || 0)
      if (value <= 0) return
      links.push({
        source: index,
        target: scopeIndex,
        value,
      })
    })

    scopeNodes.forEach((scope, scopeIndexOffset) => {
      const value = Number(scopeTotals[scope] || 0)
      if (value <= 0) return
      links.push({
        source: categoryNodes.length + scopeIndexOffset,
        target: totalNodeIndex,
        value,
      })
    })

    return { nodes, links }
  }, [data])

  if (!sankeyData.links.length) {
    return (
      <div className="h-[260px] rounded-xl border border-surface-500/20 bg-surface-800/40 p-4 text-sm text-slate-400">
        Add more category entries to generate flow links.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <Sankey
        data={sankeyData}
        nodePadding={20}
        nodeWidth={14}
        margin={{ top: 10, right: 24, left: 18, bottom: 10 }}
      >
        <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} kg CO₂`, 'Flow']} />
      </Sankey>
    </ResponsiveContainer>
  )
}

export function EmissionHeatmapCalendar({ dailyData = [] }) {
  const { matrix, maxValue, year } = useMemo(() => {
    const now = new Date()
    const targetYear = now.getFullYear()
    const dayMap = new Map()

    dailyData.forEach((item) => {
      const parsed = new Date(item.date)
      if (Number.isNaN(parsed.getTime())) return
      if (parsed.getFullYear() !== targetYear) return
      const key = parsed.toISOString().slice(0, 10)
      dayMap.set(key, Number(item.total || 0))
    })

    const rows = []
    let highest = 0
    for (let month = 0; month < 12; month += 1) {
      const daysInMonth = new Date(targetYear, month + 1, 0).getDate()
      const days = []
      for (let day = 1; day <= 31; day += 1) {
        if (day > daysInMonth) {
          days.push(null)
          continue
        }
        const iso = new Date(targetYear, month, day).toISOString().slice(0, 10)
        const total = Number(dayMap.get(iso) || 0)
        highest = Math.max(highest, total)
        days.push({ iso, total })
      }
      rows.push({
        monthLabel: new Date(targetYear, month, 1).toLocaleDateString('en-IN', { month: 'short' }),
        days,
      })
    }

    return {
      matrix: rows,
      maxValue: highest,
      year: targetYear,
    }
  }, [dailyData])

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[780px] space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Daily emission intensity ({year})</span>
          <span>{maxValue.toFixed(1)} kg max/day</span>
        </div>

        {matrix.map((row) => (
          <div key={row.monthLabel} className="grid grid-cols-[42px_repeat(31,minmax(0,1fr))] gap-1 items-center">
            <span className="text-[10px] text-slate-500">{row.monthLabel}</span>
            {row.days.map((cell, index) => {
              if (!cell) {
                return <span key={`${row.monthLabel}-${index}`} className="h-3.5 rounded bg-transparent" />
              }

              const intensity = maxValue > 0 ? clamp(cell.total / maxValue, 0, 1) : 0
              const bg = `rgba(0, 168, 114, ${0.12 + intensity * 0.88})`
              return (
                <span
                  key={cell.iso}
                  className="h-3.5 rounded"
                  style={{ backgroundColor: bg }}
                  title={`${cell.iso}: ${cell.total.toFixed(2)} kg CO₂`}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function EmissionRadarComparison({ breakdown = [], targetBudget = 0 }) {
  const radarData = useMemo(() => {
    const totals = {
      Mobility: 0,
      Home: 0,
      Fuel: 0,
      Materials: 0,
      Waste: 0,
      Lifestyle: 0,
    }

    breakdown.forEach((item) => {
      const activity = item.activityType
      const value = Number(item.carbonAmount || 0)
      if (['CAR', 'BIKE', 'BUS', 'TRAIN', 'FLIGHT'].includes(activity)) totals.Mobility += value
      else if (['ELECTRICITY', 'AC'].includes(activity)) totals.Home += value
      else if (['DIESEL', 'PETROL', 'LPG', 'CNG', 'PNG', 'KEROSENE', 'NATURAL_GAS', 'GENERATOR'].includes(activity)) totals.Fuel += value
      else if (['STEEL', 'CEMENT', 'COAL'].includes(activity)) totals.Materials += value
      else if (['WASTE', 'INDUSTRIAL_WASTE'].includes(activity)) totals.Waste += value
      else totals.Lifestyle += value
    })

    return Object.keys(totals).map((dimension) => ({
      dimension,
      current: Number(totals[dimension].toFixed(2)),
      target: Number((targetBudget * DIMENSION_TARGET_WEIGHTS[dimension]).toFixed(2)),
    }))
  }, [breakdown, targetBudget])

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={radarData} outerRadius="72%">
        <PolarGrid stroke="rgba(100,116,139,0.35)" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
        <Radar name="Current" dataKey="current" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.28} />
        <Radar name="Target mix" dataKey="target" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
        <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
        <Tooltip formatter={(value) => `${Number(value).toFixed(1)} kg CO₂`} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function EmissionPlaybackChart({ data = [] }) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [data]
  )
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setCursor(sorted.length ? sorted.length - 1 : 0)
  }, [sorted.length])

  useEffect(() => {
    if (!playing || !sorted.length) return undefined
    const interval = setInterval(() => {
      setCursor((previous) => {
        if (previous >= sorted.length - 1) {
          setPlaying(false)
          return previous
        }
        return previous + 1
      })
    }, 650)

    return () => clearInterval(interval)
  }, [playing, sorted.length])

  if (!sorted.length) {
    return (
      <div className="h-[280px] rounded-xl border border-surface-500/20 bg-surface-800/40 p-4 text-sm text-slate-400">
        Not enough timeline data yet for playback.
      </div>
    )
  }

  const clipped = sorted.slice(0, cursor + 1)
  const currentPoint = clipped[clipped.length - 1]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (cursor >= sorted.length - 1) {
              setCursor(0)
            }
            setPlaying((prev) => !prev)
          }}
          className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-300 transition hover:bg-brand-500/20"
        >
          {playing ? 'Pause' : cursor >= sorted.length - 1 ? 'Replay' : 'Play'}
        </button>
        <p className="text-xs text-slate-400">
          Frame {cursor + 1}/{sorted.length} • {formatShortDate(currentPoint?.date)}
        </p>
      </div>

      <input
        type="range"
        min={0}
        max={sorted.length - 1}
        value={cursor}
        onChange={(event) => {
          setPlaying(false)
          setCursor(Number(event.target.value))
        }}
        className="w-full accent-brand-500"
      />

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={clipped} margin={{ top: 6, right: 10, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="playbackGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,63,59,0.4)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} kg CO₂`, 'Cumulative']} />
          <Area type="monotone" dataKey="cumulative" stroke="#06b6d4" strokeWidth={2} fill="url(#playbackGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ZoneChoroplethTileMap({ data = [], highlightedZone }) {
  const zones = useMemo(
    () => [...data].sort((a, b) => (b.totalEmission || 0) - (a.totalEmission || 0)).slice(0, 15),
    [data]
  )
  const maxEmission = Math.max(...zones.map((zone) => Number(zone.totalEmission || 0)), 0)

  if (!zones.length) {
    return (
      <div className="h-[240px] rounded-xl border border-surface-500/20 bg-surface-800/40 p-4 text-sm text-slate-400">
        Zone-level map data is not available yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <svg viewBox="0 0 380 220" className="w-full rounded-xl border border-surface-500/20 bg-surface-900/50 p-3">
        {zones.map((zone, index) => {
          const col = index % 5
          const row = Math.floor(index / 5)
          const x = 12 + col * 72 + (row % 2 === 0 ? 0 : 10)
          const y = 12 + row * 62
          const ratio = maxEmission > 0 ? clamp(zone.totalEmission / maxEmission, 0, 1) : 0
          const color = `rgba(14, 165, 233, ${0.18 + ratio * 0.78})`
          const isCurrentZone = highlightedZone && zone.zoneName === highlightedZone

          return (
            <g key={`${zone.zoneId || zone.zoneName}-${index}`}>
              <rect
                x={x}
                y={y}
                width="64"
                height="52"
                rx="9"
                fill={color}
                stroke={isCurrentZone ? '#22c55e' : 'rgba(148,163,184,0.25)'}
                strokeWidth={isCurrentZone ? 2 : 1}
              />
              <text x={x + 32} y={y + 22} textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="600">
                {(zone.zoneName || 'Zone').slice(0, 10)}
              </text>
              <text x={x + 32} y={y + 38} textAnchor="middle" fill="#cbd5e1" fontSize="8">
                {Number(zone.totalEmission || 0).toFixed(0)} kg
              </text>
            </g>
          )
        })}
      </svg>

      <p className="text-[11px] text-slate-400">
        Choropleth tile map by district/zone intensity. Darker tiles indicate higher emissions.
      </p>
    </div>
  )
}
