import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Lock } from 'lucide-react'
import { authApi } from '../../api/authApi'
import { Spinner } from '../../components/ui'
import { getErrorMessage } from '../../utils/helpers'

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
      toast.success('Reset link sent if account exists')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <img
            src="/carbontrack-nexus-logo.png"
            alt="CarbonTrack Nexus logo"
            className="h-12 w-auto rounded-xl bg-white/90 p-1 shadow-[0_0_20px_rgba(74,222,128,0.32)]"
          />
          <span className="text-base font-semibold text-white">CarbonTrack Nexus</span>
        </div>

        <div className="glass-card p-7">
          <h1 className="text-xl font-bold text-white mb-1">Reset password</h1>
          <p className="text-slate-400 text-sm mb-6">
            {sent
              ? "Check your inbox for a reset link."
              : "Enter your email and we'll send a reset link."}
          </p>

          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...register('email', { required: 'Email required' })}
                    type="email"
                    placeholder="you@company.com"
                    className="input-field pl-9"
                  />
                </div>
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner size="sm" /> : 'Send reset link'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-brand-900/40 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-brand-400" />
              </div>
              <p className="text-sm text-slate-400">Reset email sent successfully</p>
            </div>
          )}

          <Link to="/login" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mt-5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const onSubmit = async ({ password, confirmPassword }) => {
    if (!token) {
      toast.error('Reset token is missing from the link.')
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({
        token,
        newPassword: password,
      })
      toast.success('Password reset successfully')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <img
            src="/carbontrack-nexus-logo.png"
            alt="CarbonTrack Nexus logo"
            className="h-12 w-auto rounded-xl bg-white/90 p-1 shadow-[0_0_20px_rgba(74,222,128,0.32)]"
          />
          <span className="text-base font-semibold text-white">CarbonTrack Nexus</span>
        </div>

        <div className="glass-card p-7">
          <h1 className="text-xl font-bold text-white mb-1">Choose a new password</h1>
          <p className="text-slate-400 text-sm mb-6">
            Set a new password for your account using the secure reset link.
          </p>

          {!token ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              This reset link is incomplete or invalid. Request a new password reset email.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
                    type="password"
                    placeholder="Enter new password"
                    className="input-field pl-9"
                  />
                </div>
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>

              <div>
                <label className="label">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm the password',
                      validate: (value) => value === watch('password') || "Passwords don't match",
                    })}
                    type="password"
                    placeholder="Re-enter new password"
                    className="input-field pl-9"
                  />
                </div>
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner size="sm" /> : 'Reset password'}
              </button>
            </form>
          )}

          <Link to="/login" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors mt-5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-8xl font-bold text-brand-600/30 font-mono mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-slate-400 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary">
          Return home
        </Link>
      </div>
    </div>
  )
}
