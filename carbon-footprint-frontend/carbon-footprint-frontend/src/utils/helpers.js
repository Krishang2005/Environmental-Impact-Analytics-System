import { format, parseISO } from 'date-fns'

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy HH:mm')
  } catch {
    return dateStr
  }
}

export const formatCarbon = (value) => {
  if (value == null) return '-'
  return `${Number(value).toFixed(2)} kg CO2`
}

export const formatCarbonShort = (value) => {
  if (value == null) return '-'
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}t CO2`
  return `${Number(value).toFixed(1)} kg`
}

export const formatNumber = (n) => {
  if (n == null) return '-'
  return new Intl.NumberFormat('en-IN').format(n)
}

export const formatPercent = (n) => {
  if (n == null) return '-'
  const sign = n > 0 ? '+' : ''
  return `${sign}${Number(n).toFixed(1)}%`
}

export const getActivityLabel = (type) => {
  const map = {
    ELECTRICITY: 'Electricity',
    CAR: 'Car Travel',
    BIKE: 'Bike / Scooter',
    AC: 'Air Conditioning',
    WASTE: 'Waste',
    DIESEL: 'Diesel',
    PETROL: 'Petrol',
    NATURAL_GAS: 'Natural Gas',
    FLIGHT: 'Flight',
    PUBLIC_TRANSPORT: 'Public Transport',
    FOOD: 'Food',
    WATER: 'Water',
    OTHER: 'Other',
  }
  return map[type] || type
}

export const getActivityUnit = (type) => {
  const map = {
    ELECTRICITY: 'kWh',
    CAR: 'km',
    BIKE: 'km',
    AC: 'hours',
    WASTE: 'kg',
    DIESEL: 'litres',
    PETROL: 'litres',
    NATURAL_GAS: 'm3',
    FLIGHT: 'km',
    PUBLIC_TRANSPORT: 'km',
    FOOD: 'kg',
    WATER: 'litres',
    OTHER: 'units',
  }
  return map[type] || 'units'
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'HIGH': return 'text-red-400'
    case 'LOW': return 'text-brand-400'
    default: return 'text-amber-400'
  }
}

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'HIGH': return 'badge-red'
    case 'LOW': return 'badge-green'
    default: return 'badge-amber'
  }
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const ACTIVITY_TYPES = [
  'ELECTRICITY', 'CAR', 'BIKE', 'AC', 'WASTE',
  'DIESEL', 'PETROL', 'NATURAL_GAS', 'FLIGHT',
  'PUBLIC_TRANSPORT', 'OTHER',
]

export const ACTIVITY_COLORS = {
  ELECTRICITY: '#f59e0b',
  CAR: '#ef4444',
  BIKE: '#8b5cf6',
  AC: '#06b6d4',
  WASTE: '#84cc16',
  DIESEL: '#f97316',
  PETROL: '#ec4899',
  NATURAL_GAS: '#14b8a6',
  FLIGHT: '#6366f1',
  PUBLIC_TRANSPORT: '#22c55e',
  FOOD: '#a855f7',
  WATER: '#0ea5e9',
  OTHER: '#64748b',
}

export const CHART_COLORS = [
  '#05d08e', '#06b6d4', '#8b5cf6', '#f59e0b',
  '#ef4444', '#84cc16', '#f97316', '#ec4899',
]

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error
  if (error?.response?.data) {
    const data = error.response.data
    if (typeof data === 'string') return data
    if (data.message) return data.message
  }
  return error?.message || 'Something went wrong'
}
