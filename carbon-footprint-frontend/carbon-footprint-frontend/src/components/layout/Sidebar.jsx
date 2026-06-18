import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { UserAvatar } from '../ui/UserAvatar'
import {
  LayoutDashboard, Leaf, ListOrdered, FileBarChart2,
  User, LogOut, Users, AlertTriangle, Map, Download,
  ChevronRight, Settings, Activity, Target, Flame, Siren, Camera,
} from 'lucide-react'

const userNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/add-entry', label: 'Add Entry', icon: Leaf },
  { to: '/my-entries', label: 'My Entries', icon: ListOrdered },
  { to: '/monthly-report', label: 'Reports', icon: FileBarChart2 },
  { to: '/leaderboard', label: 'Leaderboard', icon: Target },
  { to: '/streaks', label: 'Streak Arena', icon: Flame },
  { to: '/smart-complaints', label: 'Smart Complaints', icon: Camera },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'All Users', icon: Users },
  { to: '/admin/high-emitters', label: 'High Emitters', icon: AlertTriangle },
  { to: '/admin/complaints', label: 'Complaints', icon: Siren },
  { to: '/admin/zone-report', label: 'Map Control', icon: Map },
  { to: '/admin/csv-export', label: 'Reports', icon: Download },
  { to: '/admin/analytics', label: 'Analytics', icon: Activity },
  { to: '/admin/profile', label: 'Admin Profile', icon: User },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ onClose }) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const nav = isAdmin ? adminNav : userNav

  const handleLogout = () => {
    logout()
    navigate(isAdmin ? '/admin/login' : '/login')
  }

  return (
    <aside className="relative h-full w-72 overflow-hidden border-r border-cyan-200/10 bg-slate-950/65 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-12 h-60 w-60 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute right-[-120px] top-[38%] h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="border-b border-slate-500/25 px-5 py-5">
          <div className="space-y-2">
            <motion.img
              src="/carbontrack-nexus-logo.png"
              alt="CarbonTrack Nexus logo"
              animate={{ y: [0, -2, 0, 2, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="h-20 w-auto rounded-2xl bg-white/90 p-1.5 shadow-[0_0_24px_rgba(56,189,248,0.45)]"
            />
            <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">
              {isAdmin ? 'Control Matrix' : 'User Command'}
            </p>
          </div>
        </div>

        <div className="border-b border-slate-500/25 px-4 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-500/30 bg-slate-900/70 p-3">
            <UserAvatar user={user} isAdmin={isAdmin} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Navigation
          </p>
          {nav.map(({ to, label, icon: Icon }, index) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: index * 0.03 }}
            >
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) => (isActive ? 'sidebar-link-active group' : 'sidebar-link group')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="border-t border-slate-500/25 px-3 py-4">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-300 hover:bg-red-500/15 hover:text-red-100"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
