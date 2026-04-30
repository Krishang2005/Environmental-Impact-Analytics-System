import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Building2, MapPin, LocateFixed, Search } from 'lucide-react'
import { authApi } from '../../api/authApi'
import api from '../../api/axiosInstance'
import { Spinner } from '../../components/ui'
import { getErrorMessage } from '../../utils/helpers'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  sectorCategory: z.string().min(1, 'Select a sector category'),
  sectorType: z.string().min(1, 'Select a sector type'),
  address: z.string().min(5, 'Enter the registration address'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const SECTOR_CATEGORIES = ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'TRANSPORT']
const SECTOR_TYPES = {
  RESIDENTIAL: ['APARTMENT', 'HOUSE', 'VILLA', 'HOSTEL'],
  COMMERCIAL: ['OFFICE', 'RETAIL', 'RESTAURANT', 'HOTEL', 'HOSPITAL', 'SCHOOL'],
  INDUSTRIAL: ['MANUFACTURING', 'WAREHOUSE', 'FACTORY', 'WORKSHOP'],
  AGRICULTURAL: ['FARM', 'GREENHOUSE', 'PLANTATION'],
  TRANSPORT: ['LOGISTICS', 'FLEET', 'DELIVERY'],
}

export default function RegisterPage() {
  const GEOLOCATION_ADDRESS_ACCURACY_THRESHOLD = 250
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [addressLookupLoading, setAddressLookupLoading] = useState(false)
  const [locationHint, setLocationHint] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const watchCategory = watch('sectorCategory')
  const watchAddress = watch('address')

  const handleCategoryChange = (e) => {
    const val = e.target.value
    setSelectedCategory(val)
    setValue('sectorCategory', val)
    setValue('sectorType', '')
  }

  const fillCoordinates = (latitude, longitude) => {
    setValue('latitude', String(latitude), { shouldValidate: true })
    setValue('longitude', String(longitude), { shouldValidate: true })
  }

  const reverseGeocode = async (latitude, longitude) => {
    const res = await api.get('/api/location/reverse-geocode', {
      params: { lat: latitude, lon: longitude },
    })
    return res.data
  }

  const geocodeAddress = async (address) => {
    const res = await api.get('/api/location/geocode', {
      params: { address },
    })
    return res.data
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device.')
      return
    }

    setLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        const accuracy = position.coords.accuracy ?? 0

        fillCoordinates(latitude, longitude)

        if (accuracy > GEOLOCATION_ADDRESS_ACCURACY_THRESHOLD) {
          setLocationHint(
            `Your device reported an approximate location (${Math.round(accuracy)} m). On laptops this can be inaccurate, so use the address lookup for the best result.`,
          )
          toast.success('Coordinates added. For better accuracy on laptop, use address lookup.')
          setLocationLoading(false)
          return
        }

        if (!watchAddress?.trim()) {
          try {
            const resolvedAddress = await reverseGeocode(latitude, longitude)
            if (resolvedAddress) {
              setValue('address', resolvedAddress, { shouldValidate: true })
            }
          } catch {
            // Keep coordinates even if address lookup fails.
          }
        }

        setLocationHint(
          accuracy
            ? `Location added with about ${Math.round(accuracy)} m accuracy.`
            : 'Location added to registration.',
        )
        toast.success('Location added to registration.')
        setLocationLoading(false)
      },
      (error) => {
        const messageByCode = {
          1: 'Location permission was denied. Allow location or use address lookup.',
          2: 'Location is unavailable on this device right now. Try address lookup.',
          3: 'Location request timed out. Try again or use address lookup.',
        }
        toast.error(messageByCode[error.code] || 'Unable to fetch your current location.')
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      },
    )
  }

  const handleGetCoordinatesFromAddress = async () => {
    if (!watchAddress?.trim()) {
      toast.error('Enter the registration address first.')
      return
    }

    setAddressLookupLoading(true)
    try {
      const [latitude, longitude] = await geocodeAddress(watchAddress.trim())
      fillCoordinates(latitude, longitude)
      setLocationHint('Coordinates matched from the typed address. This is the most reliable option on laptops.')
      toast.success('Coordinates added from the address.')
    } catch {
      toast.error('Could not find coordinates for that address.')
    } finally {
      setAddressLookupLoading(false)
    }
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { confirmPassword, ...payload } = data
      let latitude = data.latitude?.trim()
      let longitude = data.longitude?.trim()

      if ((!latitude || !longitude) && data.address?.trim()) {
        const [resolvedLatitude, resolvedLongitude] = await geocodeAddress(data.address.trim())
        latitude = String(resolvedLatitude)
        longitude = String(resolvedLongitude)
        fillCoordinates(resolvedLatitude, resolvedLongitude)
      }

      if (!latitude || !longitude) {
        throw new Error('Add your location using current location or address lookup.')
      }

      await authApi.register({
        ...payload,
        latitude: Number(latitude),
        longitude: Number(longitude),
      })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <img
            src="/carbontrack-nexus-logo.png"
            alt="CarbonTrack Nexus logo"
            className="h-12 w-auto rounded-xl bg-white/90 p-1 shadow-[0_0_20px_rgba(74,222,128,0.32)]"
          />
          <span className="text-base font-semibold text-white">CarbonTrack Nexus</span>
        </div>

        <div className="glass-card p-7">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Create an account</h1>
            <p className="text-slate-400 text-sm mt-1">Start monitoring your carbon footprint today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input {...register('name')} type="text" placeholder="John Doe" className="input-field pl-9" />
              </div>
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input {...register('email')} type="email" placeholder="you@company.com" className="input-field pl-9" />
              </div>
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="label">Registration address</label>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleGetCoordinatesFromAddress}
                    disabled={addressLookupLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addressLookupLoading ? <Spinner size="sm" /> : <Search className="w-3.5 h-3.5" />}
                    Use address
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationLoading}
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-500/40 px-3 py-1.5 text-xs font-medium text-brand-400 transition hover:border-brand-400 hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {locationLoading ? <Spinner size="sm" /> : <LocateFixed className="w-3.5 h-3.5" />}
                    Use current location
                  </button>
                </div>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <textarea
                  {...register('address')}
                  rows={3}
                  placeholder="Enter your registration address"
                  className="input-field pl-9 resize-none"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                This is used during registration for zone mapping and nearby analytics. If GPS fails on mobile, enter the address and press `Use address`.
              </p>
              {locationHint && (
                <p className="mt-1 text-xs text-amber-300">
                  {locationHint}
                </p>
              )}
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Latitude</label>
                <input
                  {...register('latitude')}
                  type="text"
                  placeholder="Auto-filled from location"
                  className="input-field"
                />
                {errors.latitude && <p className="form-error">{errors.latitude.message}</p>}
              </div>

              <div>
                <label className="label">Longitude</label>
                <input
                  {...register('longitude')}
                  type="text"
                  placeholder="Auto-filled from location"
                  className="input-field"
                />
                {errors.longitude && <p className="form-error">{errors.longitude.message}</p>}
              </div>
            </div>

            {/* Sector Category + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Sector category</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select
                    {...register('sectorCategory')}
                    onChange={handleCategoryChange}
                    className="input-field pl-9 appearance-none cursor-pointer"
                  >
                    <option value="">Select...</option>
                    {SECTOR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {errors.sectorCategory && <p className="form-error">{errors.sectorCategory.message}</p>}
              </div>

              <div>
                <label className="label">Sector type</label>
                <select
                  {...register('sectorType')}
                  disabled={!selectedCategory}
                  className="input-field appearance-none cursor-pointer disabled:opacity-40"
                >
                  <option value="">Select...</option>
                  {(SECTOR_TYPES[selectedCategory] || []).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.sectorType && <p className="form-error">{errors.sectorType.message}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input {...register('password')} type="password" placeholder="••••••••" className="input-field pl-9" />
                </div>
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>

              <div>
                <label className="label">Confirm password</label>
                <input {...register('confirmPassword')} type="password" placeholder="••••••••" className="input-field" />
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <Spinner size="sm" /> : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-400 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
