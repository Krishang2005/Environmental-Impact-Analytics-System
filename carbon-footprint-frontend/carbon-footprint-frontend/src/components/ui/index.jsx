import { motion, AnimatePresence } from 'framer-motion'
import TiltPanel from '../fx/TiltPanel'
import { cn } from '../../lib/utils'

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }
  return (
    <div className={cn(sizes[size], className)}>
      <svg className="animate-spin text-cyan-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z" />
      </svg>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
      >
        <div className="mx-auto h-16 w-16 rounded-2xl border border-cyan-300/30 bg-slate-900/70 p-4 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
          <Spinner size="lg" />
        </div>
        <p className="text-sm tracking-wide text-slate-300">Booting interface...</p>
      </motion.div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-400/20 bg-slate-900/70">
          <Icon className="h-7 w-7 text-slate-400" />
        </div>
      )}
      <h3 className="mb-1 text-base font-medium text-slate-100">{title}</h3>
      {description && <p className="mb-4 max-w-xs text-sm text-slate-400">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10">
        <svg className="h-7 w-7 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="mb-1 text-base font-medium text-slate-100">Failed to load</h3>
      <p className="mb-4 max-w-xs text-sm text-slate-400">{message || 'An error occurred.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Try again
        </button>
      )}
    </div>
  )
}

export function StatCard({
  icon: Icon,
  iconColor = 'text-cyan-200',
  iconBg = 'bg-cyan-500/15',
  label,
  value,
  sub,
  trend,
  trendUp,
}) {
  return (
    <TiltPanel className="h-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="stat-card holographic-panel h-full"
      >
        <div className="flex items-start justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          {trend != null && (
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              trendUp ? 'bg-red-500/15 text-red-200' : 'bg-emerald-500/15 text-emerald-200'
            )}
            >
              {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-white tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
      </motion.div>
    </TiltPanel>
  )
}

export function Badge({ variant = 'slate', children }) {
  const variants = {
    green: 'badge-green',
    red: 'badge-red',
    amber: 'badge-amber',
    slate: 'badge-slate',
  }
  return <span className={variants[variant] || 'badge-slate'}>{children}</span>
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden ${sizes[size]} glass-card border border-cyan-300/20 shadow-[0_30px_90px_-30px_rgba(34,211,238,0.45)]`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-500/30 bg-slate-950/85 p-5 backdrop-blur-xl">
              <h2 className="text-base font-semibold text-slate-100">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-lg border border-slate-400/30 bg-slate-900/90 p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Divider({ className = '' }) {
  return <hr className={`border-slate-500/30 ${className}`} />
}

export function ProgressBar({ value, max = 100, color = 'bg-cyan-400', className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-700/80 ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={`h-2 rounded-full ${color}`}
      />
    </div>
  )
}

export function SelectField({ label, error, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select {...props} className="input-field appearance-none cursor-pointer">
        {props.children}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

export function InputField({ label, error, icon: Icon, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input {...props} className={`input-field ${Icon ? 'pl-9' : ''} ${props.className || ''}`} />
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
