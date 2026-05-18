import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../ui'
import { getErrorMessage } from '../../utils/helpers'
import CinematicBackground from '../fx/CinematicBackground'
import TiltPanel from '../fx/TiltPanel'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const otpSchema = z.object({
  otp: z.string().min(4, 'Enter the OTP').max(10),
})

const isTimeoutError = (error) =>
  error?.code === 'ECONNABORTED' ||
  error?.message?.toLowerCase().includes('timeout')

const modeConfig = {
  user: {
    brand: 'User Portal',
    title: 'User sign in',
    subtitle: 'Log activities, track emissions, and follow your progress.',
    submitLabel: 'Sign in as user',
    backLabel: 'Back to website',
    backTo: '/',
    alternatePrompt: 'Need admin access?',
    alternateLabel: 'Admin sign in',
    alternateTo: '/admin/login',
    accentText: 'text-brand-500 hover:text-brand-400',
    accentBorder: 'border-brand-500/40 text-brand-300 hover:bg-brand-900/20',
    accentButton: '',
  },
  admin: {
    brand: 'Admin Portal',
    title: 'Admin sign in',
    subtitle: 'Access zone controls, alerts, analytics, and admin management tools.',
    submitLabel: 'Continue as admin',
    backLabel: 'Back to website',
    backTo: '/',
    alternatePrompt: 'Looking for the regular user portal?',
    alternateLabel: 'User sign in',
    alternateTo: '/login',
    accentText: 'text-emerald-300 hover:text-emerald-200',
    accentBorder: 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/20',
    accentButton: '!bg-emerald-600 hover:!bg-emerald-500 focus-visible:!ring-emerald-500/40',
  },
}

export default function LoginPortal({ mode = 'user' }) {
  const config = modeConfig[mode] || modeConfig.user
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const { register: regOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors } } = useForm({
    resolver: zodResolver(otpSchema),
  })

  const onLogin = async (data) => {
    setLoading(true)
    try {
      const res = mode === 'admin'
        ? await authApi.adminLogin(data)
        : await authApi.userLogin(data)

      if (typeof res.data === 'string' && res.data.toLowerCase().includes('otp')) {
        if (mode !== 'admin') {
          toast.error('This account requires the admin sign in page.')
          navigate('/admin/login')
          return
        }

        setAdminEmail(data.email)
        setOtpStep(true)
        toast.success('OTP sent to your email')
        return
      }

      if (mode === 'admin' && res.data.role !== 'ROLE_ADMIN') {
        toast.error('This account is not an admin account.')
        return
      }

      if (mode === 'user' && res.data.role !== 'ROLE_USER') {
        toast.error('Please use the admin sign in page for this account.')
        navigate('/admin/login')
        return
      }

      login(res.data)
      toast.success(`Welcome back, ${res.data.name}!`)
      navigate(res.data.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/dashboard')
    } catch (err) {
      if (mode === 'admin' && isTimeoutError(err)) {
        setAdminEmail(data.email)
        setOtpStep(true)
        toast.error('Login request timed out, but the OTP may still arrive. Enter it here if you received it.')
        return
      }
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const onVerifyOtp = async (data) => {
    setLoading(true)
    try {
      const res = await authApi.adminVerifyOtp({ email: adminEmail, otp: data.otp })
      login(res.data)
      toast.success('OTP verified. Welcome, Admin!')
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-8">
      <CinematicBackground withMouseGlow={false} />
      <div className="pointer-events-none absolute inset-0 z-[2]">
        <div className="absolute left-[-10%] top-[8%] h-[22rem] w-[22rem] rounded-full bg-brand-500/20 blur-[120px]" />
        <div className="absolute right-[-14%] top-[20%] h-[24rem] w-[24rem] rounded-full bg-emerald-400/18 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-[32px] border border-brand-200/25 bg-gradient-to-br from-slate-950/88 via-slate-900/82 to-[#04110d] p-8 shadow-[0_40px_90px_-36px_rgba(16,185,129,0.55)]"
          >
            <div className={`absolute -right-10 top-0 h-40 w-40 rounded-full blur-3xl ${mode === 'admin' ? 'bg-emerald-500/15' : 'bg-brand-500/15'}`} />
            <div className={`absolute -bottom-12 left-10 h-52 w-52 rounded-full blur-3xl ${mode === 'admin' ? 'bg-teal-500/12' : 'bg-emerald-500/10'}`} />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-10 flex items-center gap-3">
                  <motion.img
                    src="/carbontrack-nexus-logo.png"
                    alt="CarbonTrack Nexus logo"
                    animate={{ y: [0, -2, 0, 2, 0] }}
                    transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-20 w-auto rounded-2xl bg-white/92 p-1.5 shadow-[0_0_24px_rgba(56,189,248,0.55)]"
                  />
                  <div>
                    <p className="font-display text-xl font-semibold text-white">CarbonTrack Nexus</p>
                    <p className={`text-[10px] uppercase tracking-[0.28em] ${mode === 'admin' ? 'text-emerald-300' : 'text-brand-300'}`}>
                      {config.brand}
                    </p>
                  </div>
                </div>

                <div className="max-w-md space-y-5">
                  <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${mode === 'admin' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border-brand-500/20 bg-brand-500/10 text-brand-200'}`}>
                    {mode === 'admin' ? 'Zone Intelligence Access' : 'Personal Carbon Tracking'}
                  </div>

                  <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
                    {mode === 'admin'
                      ? 'Manage zones, alerts, and climate insights from one secure admin portal'
                      : 'Track your carbon footprint and turn daily actions into measurable improvement'}
                  </h1>

                  <p className="text-sm leading-7 text-slate-300">
                    {mode === 'admin'
                      ? 'Use the admin workspace to monitor high emitters, adjust zone limits, review user activity, and study AI-style forecasts for future emission pressure.'
                      : 'Use the user workspace to log transport, electricity, fuel, and waste activity, then follow reports, streaks, AI guidance, and alerts to stay inside safer emission limits.'}
                  </p>
                </div>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {(mode === 'admin'
                  ? [
                      ['Zone control', 'Set and manage emission ranges'],
                      ['User alerts', 'Trigger reminders before limits are crossed'],
                      ['AI analytics', 'Compare zones and future pressure'],
                    ]
                  : [
                      ['Daily logging', 'Record transport, power, and fuel use'],
                      ['Carbon copilot', 'Get profile-aware daily guidance and habit tips'],
                      ['Progress view', 'Watch streaks, reports, and rewards'],
                    ]).map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-surface-400/20 bg-surface-800/55 p-4">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="flex items-center justify-center">
            <TiltPanel className="w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                className="w-full rounded-[32px] border border-brand-200/25 bg-slate-950/78 p-8 shadow-[0_35px_90px_-30px_rgba(16,185,129,0.58)] backdrop-blur-2xl"
              >
              <div className="mb-6 flex justify-end">
                <Link
                  to={config.backTo}
                  className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${config.accentBorder}`}
                >
                  {config.backLabel}
                </Link>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white">
                  {otpStep ? 'Verify Admin OTP' : config.title}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {otpStep ? `Enter the OTP sent to ${adminEmail}.` : config.subtitle}
                </p>
              </div>

              {!otpStep ? (
                <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
                  <div>
                    <label className="label">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder={mode === 'admin' ? 'admin@company.com' : 'you@company.com'}
                        className="input-field pl-9"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="label mb-0">Password</label>
                      <Link to="/forgot-password" className={`text-xs transition-colors ${config.accentText}`}>
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="........"
                        className="input-field pl-9 pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="form-error">{errors.password.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                  className={`btn-primary mt-2 w-full ${config.accentButton}`}
                >
                  {loading ? <Spinner size="sm" /> : config.submitLabel}
                </button>
              </form>
              ) : (
                <form onSubmit={handleOtpSubmit(onVerifyOtp)} className="space-y-4">
                  <div>
                    <label className="label">One-time password</label>
                    <input
                      {...regOtp('otp')}
                      type="text"
                      placeholder="Enter OTP"
                      className="input-field text-center text-lg font-mono tracking-widest"
                      autoFocus
                    />
                    {otpErrors.otp && <p className="form-error">{otpErrors.otp.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full !bg-emerald-600 hover:!bg-emerald-500 focus-visible:!ring-emerald-500/40"
                  >
                    {loading ? <Spinner size="sm" /> : 'Verify admin OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="btn-secondary w-full"
                  >
                    Back to admin sign in
                  </button>
                </form>
              )}

              {!otpStep && (
                <div className="mt-6 space-y-3 text-center">
                  {mode === 'user' && (
                    <p className="text-sm text-slate-500">
                      Don&apos;t have an account?{' '}
                      <Link to="/register" className="font-medium text-brand-500 transition-colors hover:text-brand-400">
                        Create account
                      </Link>
                    </p>
                  )}

                  <p className="text-sm text-slate-500">
                    {config.alternatePrompt}{' '}
                    <Link to={config.alternateTo} className={`font-medium transition-colors ${config.accentText}`}>
                      {config.alternateLabel}
                    </Link>
                  </p>
                </div>
              )}
              </motion.div>
            </TiltPanel>
          </div>
        </div>
      </div>
    </div>
  )
}
