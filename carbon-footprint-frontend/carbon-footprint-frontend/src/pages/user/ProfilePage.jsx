import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Shield, Building2, MapPin } from 'lucide-react'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { Spinner, SectionHeader } from '../../components/ui'
import { getErrorMessage } from '../../utils/helpers'

const pwdSchema = z.object({
  oldPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function ProfilePage() {
  const { user, isAdmin, refreshProfile } = useAuth()
  const [pwdLoading, setPwdLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(pwdSchema),
  })

  useEffect(() => {
    void refreshProfile()
  }, [refreshProfile])

  const onChangePwd = async (data) => {
    setPwdLoading(true)
    try {
      await authApi.changePassword(
        { oldPassword: data.oldPassword, newPassword: data.newPassword },
        isAdmin ? 'admin' : 'user'
      )
      toast.success('Password updated successfully')
      reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">{isAdmin ? 'Admin Profile' : 'My Profile'}</h1>
        <p className="page-subtitle">Manage your account details and security</p>
      </div>

      <div className="glass-card p-6">
        <SectionHeader title="Account Information" />
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-2xl font-bold shadow-glow">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.name || 'User'}</h2>
            <p className="text-sm text-slate-400">{user?.email || 'No email available'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
              isAdmin ? 'bg-purple-900/40 text-purple-400 border border-purple-700/30' : 'bg-brand-900/40 text-brand-400 border border-brand-700/30'
            }`}>
              {isAdmin ? 'Administrator' : 'Standard User'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-700/40 rounded-xl p-4 flex items-center gap-3">
            <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">Name</p>
              <p className="text-sm text-white font-medium">{user?.name || 'Not set'}</p>
            </div>
          </div>

          <div className="bg-surface-700/40 rounded-xl p-4 flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">Email</p>
              <p className="text-sm text-white font-medium">{user?.email || 'Not set'}</p>
            </div>
          </div>

          {!isAdmin && user?.sectorCategory && (
            <div className="bg-surface-700/40 rounded-xl p-4 flex items-center gap-3">
              <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">Sector</p>
                <p className="text-sm text-white font-medium">
                  {user.sectorCategory} / {user.sectorType}
                </p>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-surface-700/40 rounded-xl p-4 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">Zone</p>
                <p className="text-sm text-white font-medium">{user?.zoneName || 'Not assigned'}</p>
              </div>
            </div>
          )}

          <div className="bg-surface-700/40 rounded-xl p-4 flex items-center gap-3">
            <Shield className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">Role</p>
              <p className="text-sm text-white font-medium">
                {user?.role || (isAdmin ? 'ROLE_ADMIN' : 'ROLE_USER')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <SectionHeader
          title="Change Password"
          subtitle="Make sure your password is strong and unique"
          action={<Lock className="w-4 h-4 text-slate-500" />}
        />

        <form onSubmit={handleSubmit(onChangePwd)} className="space-y-4 max-w-md">
          <div>
            <label className="label">Current password</label>
            <input {...register('oldPassword')} type="password" className="input-field" placeholder="********" />
            {errors.oldPassword && <p className="form-error">{errors.oldPassword.message}</p>}
          </div>

          <div>
            <label className="label">New password</label>
            <input {...register('newPassword')} type="password" className="input-field" placeholder="********" />
            {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="label">Confirm new password</label>
            <input {...register('confirmPassword')} type="password" className="input-field" placeholder="********" />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={pwdLoading} className="btn-primary">
            {pwdLoading ? <Spinner size="sm" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
