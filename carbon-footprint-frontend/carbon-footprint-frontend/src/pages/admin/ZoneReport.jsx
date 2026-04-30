import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import 'leaflet/dist/leaflet.css'
import {
  Activity, AlertTriangle, ChevronDown, ChevronRight, ExternalLink, Eye, Leaf, Map, MapPin, Users,
} from 'lucide-react'
import { divIcon } from 'leaflet'
import {
  MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap,
} from 'react-leaflet'
import { adminApi } from '../../api/adminApi'
import { useFetch } from '../../hooks/useFetch'
import { useAuth } from '../../context/AuthContext'
import {
  Badge, EmptyState, ErrorState, Modal, PageLoader, SectionHeader, Spinner,
} from '../../components/ui'
import { MultiBarChart, ZoneBarChart } from '../../components/charts'
import { formatCarbonShort, formatNumber } from '../../utils/helpers'

const DEFAULT_ZONE_LIMIT_MAX_KG = 400
const MID_RANGE_RATIO = 0.7

const ZONE_THEMES = [
  {
    card: 'border-emerald-400/20 bg-emerald-500/10',
    map: 'border-emerald-400/30 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.18),transparent_58%),linear-gradient(135deg,rgba(16,185,129,0.18),rgba(6,95,70,0.1))]',
    accent: 'bg-emerald-300',
    text: 'text-emerald-200',
    stroke: '#34d399',
    fill: '#34d399',
  },
  {
    card: 'border-sky-400/20 bg-sky-500/10',
    map: 'border-sky-400/30 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_58%),linear-gradient(135deg,rgba(14,165,233,0.18),rgba(12,74,110,0.1))]',
    accent: 'bg-sky-300',
    text: 'text-sky-200',
    stroke: '#38bdf8',
    fill: '#38bdf8',
  },
  {
    card: 'border-amber-400/20 bg-amber-500/10',
    map: 'border-amber-400/30 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_58%),linear-gradient(135deg,rgba(245,158,11,0.18),rgba(120,53,15,0.1))]',
    accent: 'bg-amber-300',
    text: 'text-amber-100',
    stroke: '#f59e0b',
    fill: '#f59e0b',
  },
  {
    card: 'border-fuchsia-400/20 bg-fuchsia-500/10',
    map: 'border-fuchsia-400/30 bg-[radial-gradient(circle_at_top_left,rgba(232,121,249,0.18),transparent_58%),linear-gradient(135deg,rgba(217,70,239,0.18),rgba(112,26,117,0.1))]',
    accent: 'bg-fuchsia-300',
    text: 'text-fuchsia-100',
    stroke: '#e879f9',
    fill: '#e879f9',
  },
  {
    card: 'border-orange-400/20 bg-orange-500/10',
    map: 'border-orange-400/30 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_58%),linear-gradient(135deg,rgba(249,115,22,0.18),rgba(124,45,18,0.1))]',
    accent: 'bg-orange-300',
    text: 'text-orange-100',
    stroke: '#f97316',
    fill: '#f97316',
  },
  {
    card: 'border-cyan-400/20 bg-cyan-500/10',
    map: 'border-cyan-400/30 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_58%),linear-gradient(135deg,rgba(6,182,212,0.18),rgba(22,78,99,0.1))]',
    accent: 'bg-cyan-300',
    text: 'text-cyan-100',
    stroke: '#06b6d4',
    fill: '#06b6d4',
  },
]

const STATUS_META = {
  HIGH: {
    label: 'High emitter',
    badge: 'red',
    marker: 'border-red-300/70 bg-red-500 text-white shadow-[0_0_0_6px_rgba(239,68,68,0.16)]',
    Icon: AlertTriangle,
  },
  MID: {
    label: 'Mid range',
    badge: 'amber',
    marker: 'border-amber-200/70 bg-amber-400 text-slate-950 shadow-[0_0_0_6px_rgba(245,158,11,0.16)]',
    Icon: Activity,
  },
  NORMAL: {
    label: 'Normal',
    badge: 'green',
    marker: 'border-emerald-200/70 bg-emerald-500 text-white shadow-[0_0_0_6px_rgba(16,185,129,0.16)]',
    Icon: Leaf,
  },
}

const ZONE_POLYGON_PRESETS = {
  bangaloreoutskirts: [
    [13.24, 77.33],
    [13.27, 77.52],
    [13.24, 77.74],
    [13.13, 77.89],
    [12.98, 77.88],
    [12.83, 77.82],
    [12.74, 77.64],
    [12.72, 77.46],
    [12.8, 77.34],
    [12.94, 77.3],
    [13.08, 77.28],
    [13.2, 77.3],
  ],
  bangalorenorth: [
    [13.12, 77.43],
    [13.17, 77.55],
    [13.14, 77.68],
    [13.06, 77.74],
    [12.99, 77.67],
    [12.99, 77.54],
    [13.04, 77.45],
  ],
  bangaloresouth: [
    [12.97, 77.46],
    [12.99, 77.57],
    [12.96, 77.7],
    [12.86, 77.72],
    [12.79, 77.64],
    [12.81, 77.5],
    [12.88, 77.44],
  ],
  bangaloreeast: [
    [13.07, 77.67],
    [13.05, 77.78],
    [12.95, 77.84],
    [12.86, 77.79],
    [12.89, 77.67],
    [12.98, 77.63],
  ],
  bangalorewest: [
    [13.06, 77.39],
    [13.02, 77.52],
    [12.92, 77.52],
    [12.84, 77.46],
    [12.83, 77.36],
    [12.9, 77.31],
    [12.99, 77.33],
  ],
  bangalorecentral: [
    [13.01, 77.52],
    [13.01, 77.63],
    [12.95, 77.67],
    [12.9, 77.61],
    [12.9, 77.53],
    [12.95, 77.49],
  ],
}

const DEFAULT_ZONE_OVERLAY_SPECS = {
  bangalorenorth: {
    fill: '#34d399',
    glow: '#a7f3d0',
    path: 'M84 30 L224 18 L322 62 L334 122 L274 154 L182 146 L112 156 L54 108 Z',
  },
  bangaloresouth: {
    fill: '#38bdf8',
    glow: '#bae6fd',
    path: 'M62 62 L132 26 L232 34 L298 76 L284 146 L212 174 L118 164 L72 118 Z',
  },
  bangaloreeast: {
    fill: '#f59e0b',
    glow: '#fde68a',
    path: 'M118 18 L242 34 L304 92 L288 164 L218 190 L152 168 L124 124 L136 78 Z',
  },
  bangalorewest: {
    fill: '#f97316',
    glow: '#fdba74',
    path: 'M72 38 L152 18 L246 42 L266 96 L224 158 L138 176 L84 132 L58 80 Z',
  },
  bangalorecentral: {
    fill: '#22c55e',
    glow: '#bbf7d0',
    path: 'M126 48 L214 44 L252 98 L218 152 L138 156 L102 104 Z',
  },
  bangaloreoutskirts: {
    fill: '#06b6d4',
    glow: '#a5f3fc',
    path: 'M34 76 L114 28 L242 18 L338 64 L352 146 L286 212 L154 226 L62 180 L22 126 Z',
  },
}

function buildGoogleMapsEmbedUrl(latitude, longitude) {
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`
}

function buildGoogleMapsOpenUrl(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getZoneTheme(index) {
  return ZONE_THEMES[index % ZONE_THEMES.length]
}

function getZoneName(zone) {
  return zone.zoneName || zone.name || `Zone ${zone.zoneId || zone.id}`
}

function getZoneKey(zone) {
  return String(zone.zoneName || zone.name || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function isOutskirtsZone(zone) {
  return getZoneKey(zone).includes('outskirts')
}

function getZonePolygon(zone) {
  const preset = ZONE_POLYGON_PRESETS[getZoneKey(zone)]
  if (preset?.length) return preset

  return [
    [Number(zone.maxLatitude), Number(zone.minLongitude)],
    [Number(zone.maxLatitude), Number(zone.maxLongitude)],
    [Number(zone.minLatitude), Number(zone.maxLongitude)],
    [Number(zone.minLatitude), Number(zone.minLongitude)],
  ]
}

function getBoundsFromPolygon(points) {
  return points.reduce((accumulator, [latitude, longitude]) => ([
    [Math.min(accumulator[0][0], latitude), Math.min(accumulator[0][1], longitude)],
    [Math.max(accumulator[1][0], latitude), Math.max(accumulator[1][1], longitude)],
  ]), [
    [points[0][0], points[0][1]],
    [points[0][0], points[0][1]],
  ])
}

function getZoneBounds(zone) {
  return [
    [Number(zone.minLatitude), Number(zone.minLongitude)],
    [Number(zone.maxLatitude), Number(zone.maxLongitude)],
  ]
}

function getZoneCenter(zone) {
  return [
    (Number(zone.minLatitude) + Number(zone.maxLatitude)) / 2,
    (Number(zone.minLongitude) + Number(zone.maxLongitude)) / 2,
  ]
}

function getMapCenter(zones) {
  if (!zones.length) {
    return [12.9716, 77.5946]
  }

  const bounds = getMapBounds(zones)
  return [
    (bounds.minLatitude + bounds.maxLatitude) / 2,
    (bounds.minLongitude + bounds.maxLongitude) / 2,
  ]
}

function getMapBounds(zones) {
  if (!zones.length) return null

  return zones.reduce((accumulator, zone) => ({
    minLatitude: Math.min(accumulator.minLatitude, Number(zone.minLatitude)),
    maxLatitude: Math.max(accumulator.maxLatitude, Number(zone.maxLatitude)),
    minLongitude: Math.min(accumulator.minLongitude, Number(zone.minLongitude)),
    maxLongitude: Math.max(accumulator.maxLongitude, Number(zone.maxLongitude)),
  }), {
    minLatitude: Number(zones[0].minLatitude),
    maxLatitude: Number(zones[0].maxLatitude),
    minLongitude: Number(zones[0].minLongitude),
    maxLongitude: Number(zones[0].maxLongitude),
  })
}

function projectCoordinate(latitude, longitude, bounds, padding = 5) {
  if (!bounds) return { left: 50, top: 50 }

  const longitudeSpan = Math.max(bounds.maxLongitude - bounds.minLongitude, 0.0001)
  const latitudeSpan = Math.max(bounds.maxLatitude - bounds.minLatitude, 0.0001)

  const left = ((longitude - bounds.minLongitude) / longitudeSpan) * 100
  const top = ((bounds.maxLatitude - latitude) / latitudeSpan) * 100

  return {
    left: clamp(left, padding, 100 - padding),
    top: clamp(top, padding, 100 - padding),
  }
}

function projectZoneBox(zone, bounds) {
  if (!bounds) {
    return { left: 0, top: 0, width: 100, height: 100 }
  }

  const leftTop = projectCoordinate(Number(zone.maxLatitude), Number(zone.minLongitude), bounds, 0)
  const rightBottom = projectCoordinate(Number(zone.minLatitude), Number(zone.maxLongitude), bounds, 0)

  return {
    left: clamp(leftTop.left, 0, 100),
    top: clamp(leftTop.top, 0, 100),
    width: clamp(rightBottom.left - leftTop.left, 10, 100),
    height: clamp(rightBottom.top - leftTop.top, 10, 100),
  }
}

function projectInsideZone(user, zone) {
  const latitudeSpan = Math.max(Number(zone.maxLatitude) - Number(zone.minLatitude), 0.0001)
  const longitudeSpan = Math.max(Number(zone.maxLongitude) - Number(zone.minLongitude), 0.0001)

  return {
    left: clamp(((Number(user.longitude) - Number(zone.minLongitude)) / longitudeSpan) * 100, 8, 92),
    top: clamp(((Number(zone.maxLatitude) - Number(user.latitude)) / latitudeSpan) * 100, 8, 92),
  }
}

function getUserStatus(user, zone) {
  const monthlyEmission = Number(user.monthlyEmission || 0)
  const maxLimit = Number(zone?.emissionLimitMaxKg || DEFAULT_ZONE_LIMIT_MAX_KG)

  if (monthlyEmission >= maxLimit) return 'HIGH'
  if (monthlyEmission >= maxLimit * MID_RANGE_RATIO) return 'MID'
  return 'NORMAL'
}

function getOverlayObjectClass(fit) {
  return fit === 'cover' ? 'object-cover' : 'object-contain'
}

function createUserMarkerIcon(status, isDimmed) {
  const configs = {
    HIGH: {
      background: '#ef4444',
      border: '#fecaca',
      glyph: '!',
      size: 30,
      radius: '10px 10px 10px 2px',
    },
    MID: {
      background: '#f59e0b',
      border: '#fde68a',
      glyph: '~',
      size: 28,
      radius: '8px',
      transform: 'rotate(45deg)',
      innerTransform: 'rotate(-45deg)',
    },
    NORMAL: {
      background: '#10b981',
      border: '#bbf7d0',
      glyph: 'o',
      size: 28,
      radius: '999px',
    },
  }

  const config = configs[status] || configs.NORMAL
  const opacity = isDimmed ? 0.55 : 1

  return divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;">
        <div style="
          width:${config.size}px;
          height:${config.size}px;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#ffffff;
          font-weight:700;
          font-size:14px;
          background:${config.background};
          border:2px solid ${config.border};
          border-radius:${config.radius};
          box-shadow:0 8px 18px rgba(15,23,42,0.35);
          opacity:${opacity};
          transform:${config.transform || 'none'};
        ">
          <span style="transform:${config.innerTransform || 'none'};line-height:1">${config.glyph}</span>
        </div>
      </div>
    `,
  })
}

function MapViewportController({ zones, activeZone }) {
  const map = useMap()

  useEffect(() => {
    if (!zones.length) return

    const bounds = activeZone
      ? getBoundsFromPolygon(getZonePolygon(activeZone))
      : getBoundsFromPolygon(zones.flatMap((zone) => getZonePolygon(zone)))

    map.fitBounds(bounds, { padding: [28, 28] })
  }, [map, zones, activeZone])

  return null
}

function getZoneOverlayKey(zoneName) {
  return String(zoneName || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function buildDefaultOverlayDataUri(zoneName, spec) {
  const safeZoneName = String(zoneName || 'Zone').replace(/[<&>"]/g, '')

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240">
      <defs>
        <linearGradient id="zone-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${spec.glow}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${spec.fill}" stop-opacity="0.55" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="${spec.fill}" flood-opacity="0.35" />
        </filter>
      </defs>
      <rect width="360" height="240" fill="transparent" />
      <path d="${spec.path}" fill="url(#zone-fill)" stroke="${spec.glow}" stroke-width="10" stroke-linejoin="round" filter="url(#shadow)" />
      <path d="${spec.path}" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="3" stroke-dasharray="10 10" stroke-linejoin="round" />
      <circle cx="180" cy="120" r="14" fill="${spec.glow}" fill-opacity="0.95" />
      <circle cx="180" cy="120" r="28" fill="${spec.glow}" fill-opacity="0.16" />
      <text x="180" y="214" text-anchor="middle" font-size="22" font-family="Segoe UI, Arial, sans-serif" fill="rgba(255,255,255,0.9)" letter-spacing="1.6">${safeZoneName}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function getZoneOverlaySrc(zone, failedSrc = '') {
  const customOverlay = String(zone.overlayImageUrl || '').trim()

  if (customOverlay && customOverlay !== failedSrc) {
    return customOverlay
  }

  const fallbackSpec = DEFAULT_ZONE_OVERLAY_SPECS[getZoneOverlayKey(zone.zoneName || zone.name)]

  if (!fallbackSpec) {
    return ''
  }

  const fallbackSrc = buildDefaultOverlayDataUri(zone.zoneName || zone.name, fallbackSpec)
  return fallbackSrc === failedSrc ? '' : fallbackSrc
}

function ZoneOverlayImage({ zone, className, style }) {
  const [failedSrc, setFailedSrc] = useState('')
  const src = useMemo(() => getZoneOverlaySrc(zone, failedSrc), [zone, failedSrc])

  useEffect(() => {
    setFailedSrc('')
  }, [zone.overlayImageUrl, zone.zoneName, zone.name])

  if (!src) return null

  return (
    <img
      src={src}
      alt={`${zone.zoneName || zone.name} overlay`}
      className={className}
      style={style}
      onError={() => setFailedSrc(src)}
    />
  )
}

function ZonePreviewCard({ zone, users, active, onClick }) {
  const previewUsers = users
    .filter((user) => user.latitude != null && user.longitude != null)
    .slice(0, 18)

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition-all ${
        active
          ? `${zone.theme.card} shadow-[0_0_0_1px_rgba(16,185,129,0.25)]`
          : 'border-surface-500/20 bg-surface-800/70 hover:border-surface-400/40 hover:bg-surface-800/90'
      }`}
    >
      <div className={`relative h-36 overflow-hidden rounded-2xl border ${zone.theme.map}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:22px_22px]" />
        <ZoneOverlayImage
          zone={zone}
          className={`absolute inset-0 h-full w-full ${getOverlayObjectClass(zone.overlayFit)}`}
          style={{ opacity: clamp(Number(zone.overlayOpacity || 0.9), 0.1, 1) }}
        />
        <div className="absolute inset-4 rounded-[20px] border border-white/10" />
        {previewUsers.map((user) => {
          const point = projectInsideZone(user, zone)
          const status = STATUS_META[user.status] || STATUS_META.NORMAL

          return (
            <span
              key={`preview-${zone.zoneId}-${user.id}`}
              className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border ${status.marker}`}
              style={{ left: `${point.left}%`, top: `${point.top}%` }}
            />
          )
        })}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface-950/80 to-transparent p-3">
          <p className="text-sm font-semibold text-white">{zone.zoneName}</p>
          <p className="text-[11px] text-slate-300">{formatNumber(zone.userCount)} users mapped</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Monthly zone load</p>
          <p className="mt-1 text-sm font-semibold text-white">{formatCarbonShort(zone.totalEmission)}</p>
        </div>
        <Badge variant={active ? 'green' : 'slate'}>{active ? 'Focused' : 'View zone'}</Badge>
      </div>
    </button>
  )
}

export default function ZoneReport() {
  const { token, isAdmin } = useAuth()
  const isSessionReady = Boolean(token && isAdmin)
  const fetchOptions = { enabled: isSessionReady }
  const { data: zoneSummary, loading: l1, error: e1 } = useFetch(adminApi.getZoneSummary, [], fetchOptions)
  const { data: zoneSector, loading: l2 } = useFetch(adminApi.getZoneSectorSummary, [], fetchOptions)
  const { data: zoneEmissions } = useFetch(adminApi.getZoneEmissions, [], fetchOptions)
  const { data: zoneConfigData } = useFetch(adminApi.getZones, [], fetchOptions)
  const [expandedZone, setExpandedZone] = useState(null)
  const [activeZoneId, setActiveZoneId] = useState(null)
  const [zoneUsers, setZoneUsers] = useState({})
  const [loadingZone, setLoadingZone] = useState(null)
  const [mapUsersLoading, setMapUsersLoading] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userDetailsLoading, setUserDetailsLoading] = useState(false)
  const [userDetailsError, setUserDetailsError] = useState('')
  const [selectedUserDetails, setSelectedUserDetails] = useState(null)
  const [zoneConfigs, setZoneConfigs] = useState([])
  const [savingZoneId, setSavingZoneId] = useState(null)
  const [zoneLimitNotice, setZoneLimitNotice] = useState(null)

  useEffect(() => {
    if (Array.isArray(zoneConfigData)) {
      setZoneConfigs(zoneConfigData)
    }
  }, [zoneConfigData])

  const zones = Array.isArray(zoneSummary) ? zoneSummary : []
  const sectors = Array.isArray(zoneSector) ? zoneSector : []
  const zoneTotals = Array.isArray(zoneEmissions) ? zoneEmissions : []

  const zoneSummaryById = useMemo(
    () => Object.fromEntries(zones.map((zone) => [Number(zone.zoneId || zone.id), zone])),
    [zones],
  )

  const zoneTotalsById = useMemo(
    () => Object.fromEntries(zoneTotals.map((zone) => [Number(zone.zoneId || zone.id), zone])),
    [zoneTotals],
  )

  const mapZones = useMemo(
    () => zoneConfigs.map((zone, index) => {
      const zoneId = Number(zone.id || zone.zoneId)
      const summary = zoneSummaryById[zoneId]
      const totals = zoneTotalsById[zoneId]

      return {
        ...zone,
        zoneId,
        zoneName: getZoneName(zone),
        userCount: Number(summary?.totalUsers ?? totals?.totalUsers ?? zoneUsers[zoneId]?.length ?? 0),
        totalEmission: Number(totals?.totalEmission ?? totals?.emission ?? 0),
        theme: getZoneTheme(index),
      }
    }),
    [zoneConfigs, zoneSummaryById, zoneTotalsById, zoneUsers],
  )

  const orderedMapZones = useMemo(() => {
    const outskirts = []
    const core = []

    mapZones.forEach((zone) => {
      if (isOutskirtsZone(zone)) {
        outskirts.push(zone)
      } else {
        core.push(zone)
      }
    })

    return [...outskirts, ...core]
  }, [mapZones])

  const zoneIdsKey = useMemo(
    () => mapZones.map((zone) => zone.zoneId).join(','),
    [mapZones],
  )

  useEffect(() => {
    if (!activeZoneId && mapZones.length > 0) {
      setActiveZoneId(mapZones[0].zoneId)
    }
  }, [activeZoneId, mapZones])

  useEffect(() => {
    if (mapZones.length === 0) return undefined

    const zonesToFetch = mapZones.filter((zone) => !(zone.zoneId in zoneUsers))
    if (zonesToFetch.length === 0) {
      setMapUsersLoading(false)
      return undefined
    }

    let cancelled = false

    async function preloadZoneUsers() {
      setMapUsersLoading(true)

      try {
        const responses = await Promise.all(
          zonesToFetch.map(async (zone) => {
            try {
              const response = await adminApi.getUsersByZone(zone.zoneId)
              return [zone.zoneId, response.data || []]
            } catch {
              return [zone.zoneId, []]
            }
          }),
        )

        if (!cancelled) {
          setZoneUsers((previous) => ({
            ...previous,
            ...Object.fromEntries(responses),
          }))
        }
      } finally {
        if (!cancelled) {
          setMapUsersLoading(false)
        }
      }
    }

    preloadZoneUsers()

    return () => {
      cancelled = true
    }
  }, [mapZones, zoneIdsKey, zoneUsers])

  if (!isSessionReady) return <PageLoader />
  if (l1) return <PageLoader />
  if (e1) return <ErrorState message={e1} />

  const mapBounds = getMapBounds(mapZones)
  const activeZone = mapZones.find((zone) => zone.zoneId === activeZoneId) || null

  const zoneChartData = mapZones.slice(0, 8).map((zone) => ({
    name: zone.zoneName,
    totalEmission: Number((zone.totalEmission || 0).toFixed(1)),
  }))

  const sectorChartData = sectors.slice(0, 8).map((sector) => ({
    name: (sector.zoneName || 'Zone').slice(0, 12),
    residential: Number((sector.residentialEmission || 0).toFixed(1)),
    commercial: Number((sector.commercialEmission || 0).toFixed(1)),
    industrial: Number((sector.industrialEmission || 0).toFixed(1)),
  }))

  const mapUsers = Object.entries(zoneUsers).flatMap(([zoneId, users]) => {
    const zone = mapZones.find((item) => item.zoneId === Number(zoneId))

    return (users || []).map((user) => {
      const status = getUserStatus(user, zone)

      return {
        ...user,
        zoneId: Number(zoneId),
        zoneName: zone?.zoneName || 'Unassigned',
        thresholdKg: Number(zone?.emissionLimitMaxKg || DEFAULT_ZONE_LIMIT_MAX_KG),
        status,
      }
    })
  })

  const mapUsersByZone = Object.fromEntries(mapZones.map((zone) => ([
    zone.zoneId,
    mapUsers.filter((user) => user.zoneId === zone.zoneId),
  ])))

  const focusZone = (zoneId) => {
    setActiveZoneId(zoneId)
    setExpandedZone(zoneId)
  }

  const fetchZoneUsers = async (zoneId) => {
    if (zoneUsers[zoneId]) return

    setLoadingZone(zoneId)
    try {
      const response = await adminApi.getUsersByZone(zoneId)
      setZoneUsers((previous) => ({ ...previous, [zoneId]: response.data || [] }))
    } catch {
      setZoneUsers((previous) => ({ ...previous, [zoneId]: [] }))
    } finally {
      setLoadingZone(null)
    }
  }

  const toggleZone = async (zoneId) => {
    if (expandedZone === zoneId) {
      setExpandedZone(null)
      return
    }

    setExpandedZone(zoneId)
    setActiveZoneId(zoneId)
    await fetchZoneUsers(zoneId)
  }

  const updateZoneLimitField = (zoneId, field, value) => {
    setZoneConfigs((previous) => previous.map((zone) => (
      zone.id === zoneId ? { ...zone, [field]: value } : zone
    )))
  }

  const saveZoneLimits = async (zoneId) => {
    const zone = zoneConfigs.find((item) => item.id === zoneId)
    if (!zone) return

    const minLimit = Number(zone.emissionLimitMinKg)
    const maxLimit = Number(zone.emissionLimitMaxKg)

    if (Number.isNaN(minLimit) || Number.isNaN(maxLimit)) {
      setZoneLimitNotice({ type: 'error', text: 'Enter valid minimum and maximum values.', zoneId })
      return
    }

    if (minLimit < 0 || maxLimit < 0) {
      setZoneLimitNotice({ type: 'error', text: 'Emission limits cannot be negative.', zoneId })
      return
    }

    if (minLimit > maxLimit) {
      setZoneLimitNotice({ type: 'error', text: 'Minimum limit cannot be greater than maximum limit.', zoneId })
      return
    }

    setSavingZoneId(zoneId)
    setZoneLimitNotice(null)

    try {
      await adminApi.updateZone(zoneId, {
        ...zone,
        emissionLimitMinKg: minLimit,
        emissionLimitMaxKg: maxLimit,
      })

      setZoneConfigs((previous) => previous.map((item) => (
        item.id === zoneId
          ? { ...item, emissionLimitMinKg: minLimit, emissionLimitMaxKg: maxLimit }
          : item
      )))

      setZoneLimitNotice({ type: 'success', text: 'Zone emission range saved.', zoneId })
    } catch {
      setZoneLimitNotice({ type: 'error', text: 'Could not save this zone range right now.', zoneId })
    } finally {
      setSavingZoneId(null)
    }
  }

  const openUserDetails = async (user) => {
    setUserModalOpen(true)
    setUserDetailsLoading(true)
    setUserDetailsError('')
    setSelectedUserDetails(null)

    try {
      const response = await adminApi.getUserLocation(user.id)
      const selectedZone = mapZones.find((zone) => zone.zoneId === user.zoneId)

      setSelectedUserDetails({
        ...user,
        ...response.data,
        zoneName: user.zoneName,
        thresholdKg: user.thresholdKg,
        status: user.status,
        zoneRangeMinKg: selectedZone?.emissionLimitMinKg ?? null,
        zoneRangeMaxKg: selectedZone?.emissionLimitMaxKg ?? DEFAULT_ZONE_LIMIT_MAX_KG,
      })
    } catch {
      setUserDetailsError('Could not load this user detail card right now.')
    } finally {
      setUserDetailsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header rounded-3xl border border-cyan-300/20 bg-slate-900/55 p-5 backdrop-blur-xl"
      >
        <h1 className="page-title">Zone Emission Report</h1>
        <p className="page-subtitle">Zone visuals, live user markers, emission bands, and detailed user drill-down.</p>
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Geo Intelligence Map Deck</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {mapZones.slice(0, 4).map((zone) => (
          <div key={zone.zoneId} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-lg ${zone.theme.card} flex items-center justify-center`}>
                <Map className={`w-4 h-4 ${zone.theme.text}`} />
              </div>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Zone</span>
            </div>
            <div>
              <p className="text-slate-400 text-xs">{zone.zoneName}</p>
              <p className="text-xl font-semibold text-white">{formatCarbonShort(zone.totalEmission)}</p>
              <p className="text-xs text-slate-500">{formatNumber(zone.userCount)} users</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <SectionHeader title="Total Emission by Zone" subtitle="CO2 output per geographic area" />
          {zoneChartData.length > 0 ? (
            <ZoneBarChart data={zoneChartData} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">No data</div>
          )}
        </div>

        <div className="glass-card p-5">
          <SectionHeader title="Sector Breakdown by Zone" subtitle="Emission split by sector type" />
          {l2 ? (
            <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">Loading sector data...</div>
          ) : sectorChartData.length > 0 ? (
            <MultiBarChart
              data={sectorChartData}
              keys={['residential', 'commercial', 'industrial']}
              xKey="name"
            />
          ) : (
            <div className="h-[240px] flex items-center justify-center text-slate-500 text-sm">No sector data</div>
          )}
        </div>
      </div>

      <div className="glass-card p-5">
        <SectionHeader
          title="Live Zone Map"
          subtitle="City map with color-coded zones and clickable user markers."
          action={<Badge variant="slate">{mapUsers.length} mapped users</Badge>}
        />

        {mapZones.length === 0 ? (
          <EmptyState icon={Map} title="No zone visuals available" description="Create zones first to generate the admin map." />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {mapZones.map((zone) => (
                <button
                  key={zone.zoneId}
                  type="button"
                  onClick={() => focusZone(zone.zoneId)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    activeZoneId === zone.zoneId
                      ? 'border-brand-400/40 bg-brand-500/15 text-brand-200'
                      : 'border-surface-500/20 bg-surface-800/70 text-slate-300 hover:border-surface-400/40'
                  }`}
                >
                  {zone.zoneName} | {formatNumber(zone.userCount)} users
                </button>
              ))}
            </div>

            <div className="rounded-[32px] border border-surface-500/20 bg-surface-900/85 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Admin User Marker Map</p>
                  <p className="text-xs text-slate-500">
                    Click a user marker to open the full detail popup. Click a zone boundary to focus that zone.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <span key={key} className="inline-flex items-center gap-2 rounded-full border border-surface-500/20 bg-surface-800/70 px-3 py-1 text-slate-300">
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${meta.marker}`} />
                      {meta.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-surface-500/20">
                <div className="h-[620px] [&_.leaflet-container]:bg-slate-100 [&_.leaflet-control-zoom_a]:!bg-white [&_.leaflet-control-zoom_a]:!text-slate-900 [&_.leaflet-control-zoom_a]:!border-slate-300 [&_.leaflet-popup-content-wrapper]:!rounded-2xl [&_.leaflet-popup-content-wrapper]:!bg-surface-900 [&_.leaflet-popup-content-wrapper]:!text-white [&_.leaflet-popup-tip]:!bg-surface-900">
                  <MapContainer
                    center={getMapCenter(mapZones)}
                    zoom={11}
                    scrollWheelZoom
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapViewportController zones={mapZones} activeZone={activeZone} />

                    {orderedMapZones.map((zone) => {
                      const isActive = activeZoneId === zone.zoneId
                      const outskirtsZone = isOutskirtsZone(zone)
                      const polygon = getZonePolygon(zone)

                      return [
                        <Polygon
                          key={`zone-fill-${zone.zoneId}`}
                          positions={polygon}
                          pathOptions={{
                            color: zone.theme.stroke,
                            weight: isActive ? 3.2 : 2.2,
                            fillColor: zone.theme.fill,
                            fillOpacity: outskirtsZone ? (isActive ? 0.08 : 0.04) : (isActive ? 0.24 : 0.13),
                            dashArray: outskirtsZone ? '10 8' : (isActive ? undefined : '8 5'),
                            interactive: !outskirtsZone,
                          }}
                          eventHandlers={!outskirtsZone ? {
                            click: () => focusZone(zone.zoneId),
                          } : undefined}
                        >
                          {(!outskirtsZone || isActive) && (
                            <Tooltip direction="center" permanent={isActive} sticky>
                              <div className="min-w-[140px]">
                                <p className="text-xs font-semibold">{zone.zoneName}</p>
                                <p className="mt-1 text-[11px] text-slate-300">
                                  {formatNumber(zone.userCount)} users | {formatCarbonShort(zone.totalEmission)}
                                </p>
                              </div>
                            </Tooltip>
                          )}
                        </Polygon>,
                        outskirtsZone && (
                          <Polygon
                            key={`zone-edge-hit-${zone.zoneId}`}
                            positions={polygon}
                            pathOptions={{
                              color: zone.theme.stroke,
                              weight: isActive ? 16 : 14,
                              opacity: 0,
                              fill: false,
                              interactive: true,
                            }}
                            eventHandlers={{
                              click: () => focusZone(zone.zoneId),
                            }}
                          >
                            <Tooltip direction="top" sticky>
                              <div className="min-w-[150px]">
                                <p className="text-xs font-semibold">{zone.zoneName}</p>
                                <p className="mt-1 text-[11px] text-slate-300">
                                  {formatNumber(zone.userCount)} users | {formatCarbonShort(zone.totalEmission)}
                                </p>
                              </div>
                            </Tooltip>
                          </Polygon>
                        ),
                      ]
                    })}

                    {mapUsers
                      .filter((user) => user.latitude != null && user.longitude != null)
                      .map((user) => {
                        const isDimmed = Boolean(activeZoneId && activeZoneId !== user.zoneId)

                        return (
                          <Marker
                            key={`map-user-${user.id}`}
                            position={[Number(user.latitude), Number(user.longitude)]}
                            icon={createUserMarkerIcon(user.status, isDimmed)}
                            eventHandlers={{
                              click: () => openUserDetails(user),
                            }}
                          >
                            <Tooltip direction="top" offset={[0, -18]}>
                              <div className="min-w-[140px]">
                                <p className="text-xs font-semibold">{user.name}</p>
                                <p className="mt-1 text-[11px] text-slate-300">{user.zoneName}</p>
                                <p className="mt-1 text-[11px] text-slate-300">
                                  {formatCarbonShort(user.monthlyEmission || 0)} this month
                                </p>
                              </div>
                            </Tooltip>
                          </Marker>
                        )
                      })}
                  </MapContainer>
                </div>

                {mapUsersLoading && (
                  <div className="absolute inset-0 z-[500] flex items-center justify-center bg-surface-950/35 backdrop-blur-[2px]">
                    <div className="rounded-2xl border border-surface-500/20 bg-surface-900/90 px-5 py-4 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10">
                        <Spinner size="sm" />
                      </div>
                      <p className="text-sm font-medium text-white">Mapping zone users...</p>
                      <p className="mt-1 text-xs text-slate-400">Loading live admin marker positions</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-white">Separate Zone Maps</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {mapZones.map((zone) => (
                  <div key={`zone-map-${zone.zoneId}`} className="rounded-2xl border border-surface-500/20 bg-surface-800/60 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-500/20">
                      <div>
                        <p className="text-sm font-semibold text-white">{zone.zoneName}</p>
                        <p className="text-[11px] text-slate-400">{formatNumber(zone.userCount)} users | {formatCarbonShort(zone.totalEmission)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => focusZone(zone.zoneId)}
                        className="rounded-full border border-surface-400/30 px-3 py-1 text-[11px] text-slate-200 hover:border-brand-400/40 hover:text-brand-200 transition-colors"
                      >
                        Focus
                      </button>
                    </div>

                    <div className="h-[260px] [&_.leaflet-container]:bg-slate-100">
                      <MapContainer
                        center={getZoneCenter(zone)}
                        zoom={11}
                        className="h-full w-full"
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap contributors"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapViewportController zones={[zone]} activeZone={zone} />
                        <Polygon
                          positions={getZonePolygon(zone)}
                          pathOptions={{
                            color: zone.theme.stroke,
                            weight: 2.6,
                            fillColor: zone.theme.fill,
                            fillOpacity: 0.2,
                          }}
                        />

                        {(mapUsersByZone[zone.zoneId] || [])
                          .filter((user) => user.latitude != null && user.longitude != null)
                          .map((user) => (
                            <Marker
                              key={`mini-${zone.zoneId}-${user.id}`}
                              position={[Number(user.latitude), Number(user.longitude)]}
                              icon={createUserMarkerIcon(user.status, false)}
                              eventHandlers={{
                                click: () => openUserDetails(user),
                              }}
                            />
                          ))}
                      </MapContainer>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-5">
        <SectionHeader
          title="Zone Boundaries And Limits"
          subtitle="Adjust emission ranges for each geographic zone. These limits still drive the high, mid, and normal marker bands."
        />

        {zoneConfigs.length === 0 ? (
          <div className="rounded-xl border border-surface-500/20 bg-surface-700/30 p-4 text-sm text-slate-400">
            No editable zones found.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {mapZones.map((zone) => (
              <div key={zone.zoneId} className="rounded-2xl border border-surface-500/20 bg-surface-700/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{zone.zoneName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Current total: {formatCarbonShort(zone.totalEmission)}
                    </p>
                  </div>
                  <span className="badge-slate">Zone #{zone.zoneId}</span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Minimum range (kg / month)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={zone.emissionLimitMinKg ?? ''}
                      onChange={(event) => updateZoneLimitField(zone.zoneId, 'emissionLimitMinKg', event.target.value)}
                      className="input-field"
                      placeholder="250"
                    />
                  </div>
                  <div>
                    <label className="label">Maximum range (kg / month)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={zone.emissionLimitMaxKg ?? ''}
                      onChange={(event) => updateZoneLimitField(zone.zoneId, 'emissionLimitMaxKg', event.target.value)}
                      className="input-field"
                      placeholder="400"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <p className="rounded-xl border border-surface-500/20 bg-surface-800/50 px-3 py-2 text-xs text-slate-400">
                    Map boundaries are drawn from the saved latitude and longitude range for this zone.
                  </p>
                </div>

                {zoneLimitNotice?.zoneId === zone.zoneId && (
                  <div className={`mt-3 rounded-xl px-3 py-2 text-xs ${
                    zoneLimitNotice.type === 'success'
                      ? 'bg-brand-500/10 text-brand-300'
                      : 'bg-red-500/10 text-red-300'
                  }`}>
                    {zoneLimitNotice.text}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Save the zone after changing the range so marker classification uses the new zone limits.
                  </p>
                  <button
                    type="button"
                    onClick={() => saveZoneLimits(zone.zoneId)}
                    disabled={savingZoneId === zone.zoneId}
                    className="btn-primary min-w-[120px] justify-center"
                  >
                    {savingZoneId === zone.zoneId ? 'Saving...' : 'Save range'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-surface-500/20">
          <SectionHeader title="Zone Details" subtitle="Expand a zone to review users and open the full location popup." />
        </div>

        {mapZones.length === 0 ? (
          <EmptyState icon={Map} title="No zones found" description="Zones will appear here once configured." />
        ) : (
          <div className="divide-y divide-surface-500/20">
            {mapZones.map((zone) => {
              const isOpen = expandedZone === zone.zoneId
              const users = (zoneUsers[zone.zoneId] || []).map((user) => ({
                ...user,
                zoneId: zone.zoneId,
                zoneName: zone.zoneName,
                thresholdKg: Number(zone.emissionLimitMaxKg || DEFAULT_ZONE_LIMIT_MAX_KG),
                status: getUserStatus(user, zone),
              }))

              return (
                <div key={zone.zoneId}>
                  <button
                    type="button"
                    onClick={() => toggleZone(zone.zoneId)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-700/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{zone.zoneName}</p>
                        <p className="text-xs text-slate-500">
                          Range {formatNumber(zone.emissionLimitMinKg || 0)} - {formatNumber(zone.emissionLimitMaxKg || DEFAULT_ZONE_LIMIT_MAX_KG)} kg
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right hidden sm:block">
                        <p className="text-slate-400 text-xs">Users</p>
                        <p className="font-semibold text-white">{formatNumber(zone.userCount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs">Total CO2</p>
                        <p className="font-semibold text-amber-400">{formatCarbonShort(zone.totalEmission)}</p>
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="bg-surface-700/20 border-t border-surface-500/10 px-5 py-4">
                      {loadingZone === zone.zoneId ? (
                        <div className="py-4 flex items-center gap-2 text-slate-500 text-sm">
                          <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                          Loading users...
                        </div>
                      ) : users.length === 0 ? (
                        <p className="text-slate-500 text-sm py-2">No users in this zone.</p>
                      ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                          {users.map((user) => {
                            const meta = STATUS_META[user.status] || STATUS_META.NORMAL
                            const MetaIcon = meta.Icon

                            return (
                              <div key={user.id} className="rounded-2xl border border-surface-500/20 bg-surface-800/70 p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                      {(user.name || '?')[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-white">{user.name}</p>
                                      <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                  </div>
                                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${meta.marker}`}>
                                    <MetaIcon className="h-4 w-4" />
                                  </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  <div className="rounded-xl bg-surface-700/60 p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Today</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{formatCarbonShort(user.todayEmission || 0)}</p>
                                  </div>
                                  <div className="rounded-xl bg-surface-700/60 p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Monthly</p>
                                    <p className="mt-1 text-sm font-semibold text-white">{formatCarbonShort(user.monthlyEmission || 0)}</p>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <Badge variant={meta.badge}>{meta.label}</Badge>
                                  <Badge variant="slate">{zone.zoneName}</Badge>
                                  {user.latitude != null && user.longitude != null && (
                                    <span className="text-[11px] text-slate-500">
                                      {Number(user.latitude).toFixed(4)}, {Number(user.longitude).toFixed(4)}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <p className="text-xs text-slate-500 line-clamp-2">
                                    {user.address || 'Address not available'}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => openUserDetails(user)}
                                    className="btn-secondary inline-flex items-center gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View details
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="User Map Detail"
        size="xl"
      >
        {userDetailsLoading ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <Spinner />
            <p className="text-sm text-slate-500">Loading user detail popup...</p>
          </div>
        ) : userDetailsError ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-200">{userDetailsError}</p>
          </div>
        ) : selectedUserDetails ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-surface-500/20 bg-surface-800/60 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-white">{selectedUserDetails.name}</p>
                    <Badge variant={(STATUS_META[selectedUserDetails.status] || STATUS_META.NORMAL).badge}>
                      {(STATUS_META[selectedUserDetails.status] || STATUS_META.NORMAL).label}
                    </Badge>
                    <Badge variant="slate">{selectedUserDetails.zoneName}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{selectedUserDetails.email}</p>
                  <div className="mt-4 flex items-start gap-2 text-sm text-slate-300">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-300" />
                    <span>{selectedUserDetails.address || 'Address not available'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xl:min-w-[460px]">
                  <div className="rounded-xl bg-surface-700/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Today emission</p>
                    <p className="mt-1 text-sm font-semibold text-white">{formatCarbonShort(selectedUserDetails.todayEmission || 0)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-700/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Monthly emission</p>
                    <p className="mt-1 text-sm font-semibold text-white">{formatCarbonShort(selectedUserDetails.monthlyEmission || 0)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-700/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Latitude</p>
                    <p className="mt-1 text-sm font-semibold text-white">{Number(selectedUserDetails.latitude || 0).toFixed(5)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-700/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Longitude</p>
                    <p className="mt-1 text-sm font-semibold text-white">{Number(selectedUserDetails.longitude || 0).toFixed(5)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-5">
              <div className="rounded-2xl border border-surface-500/20 bg-surface-800/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Emission profile</p>
                    <p className="text-xs text-slate-500">Live values from the registered user profile and current month entries.</p>
                  </div>
                  <Users className="h-4 w-4 text-brand-300" />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-surface-700/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Zone range</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCarbonShort(selectedUserDetails.zoneRangeMinKg || 0)} - {formatCarbonShort(selectedUserDetails.zoneRangeMaxKg || DEFAULT_ZONE_LIMIT_MAX_KG)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-700/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">High-emitter threshold</p>
                    <p className="mt-1 text-sm font-semibold text-white">{formatCarbonShort(selectedUserDetails.thresholdKg || DEFAULT_ZONE_LIMIT_MAX_KG)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-700/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Exact registered location</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {Number(selectedUserDetails.latitude || 0).toFixed(5)}, {Number(selectedUserDetails.longitude || 0).toFixed(5)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-surface-500/20 bg-surface-800/60 p-4">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Registered Location Map</h3>
                    <p className="text-xs text-slate-400">Popup map centered on the exact saved registration coordinates.</p>
                  </div>
                  <a
                    href={buildGoogleMapsOpenUrl(selectedUserDetails.latitude, selectedUserDetails.longitude)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300 hover:bg-brand-500/20"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in Google Maps
                  </a>
                </div>

                <div className="overflow-hidden rounded-2xl border border-surface-500/20 bg-surface-900">
                  <iframe
                    title={`${selectedUserDetails.name} location map`}
                    src={buildGoogleMapsEmbedUrl(selectedUserDetails.latitude, selectedUserDetails.longitude)}
                    className="h-[380px] w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
