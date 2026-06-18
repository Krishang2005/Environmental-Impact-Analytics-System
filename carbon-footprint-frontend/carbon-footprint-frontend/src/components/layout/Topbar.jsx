import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ChevronDown, LogOut, Menu, Settings, User, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { UserAvatar } from '../ui/UserAvatar'
import { userApi } from '../../api/userApi'
import { formatDateTime } from '../../utils/helpers'

export default function Topbar({ onMenuClick, title }) {
  const { user, token, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const handleLogout = () => {
    logout()
    navigate(isAdmin ? '/admin/login' : '/login')
  }

  const loadNotifications = async () => {
    if (isAdmin || !token) return

    setNotificationsLoading(true)
    try {
      const res = await userApi.getNotifications()
      setNotifications(res.data?.notifications || [])
      setUnreadCount(res.data?.unreadCount || 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    loadNotifications()
  }, [isAdmin, token])

  const toggleNotifications = async () => {
    const nextOpen = !notificationsOpen
    setNotificationsOpen(nextOpen)
    setDropdownOpen(false)
    if (nextOpen) {
      await loadNotifications()
    }
  }

  const markAllAsRead = async () => {
    try {
      await userApi.markAllNotificationsRead()
      setNotifications((previous) => previous.map((item) => ({ ...item, readStatus: true })))
      setUnreadCount(0)
    } catch {
      // no-op
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-500/25 bg-slate-950/45 px-4 backdrop-blur-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg border border-slate-500/25 p-1.5 text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <h1 className="font-display text-sm font-semibold text-slate-100">
            {title || (isAdmin ? 'Admin Mission Control' : 'Carbon Intelligence Dashboard')}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative rounded-xl border border-slate-500/25 bg-slate-900/75 p-2 text-slate-300 transition hover:border-cyan-200/30 hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {!isAdmin && unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-semibold text-slate-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full z-20 mt-2 w-[360px] overflow-hidden rounded-2xl border border-slate-400/35 bg-slate-950/92 shadow-[0_25px_60px_-28px_rgba(56,189,248,0.75)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-500/25 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Notifications</p>
                    <p className="text-[11px] text-slate-400">
                      {isAdmin ? 'User reminders are automated' : `${unreadCount} unread`}
                    </p>
                  </div>
                  {!isAdmin && notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-400/30 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 transition hover:text-white"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {isAdmin ? (
                  <div className="px-4 py-6 text-sm text-slate-400">
                    User-facing notifications are generated from live risk and threshold monitoring.
                  </div>
                ) : notificationsLoading ? (
                  <div className="px-4 py-6 text-sm text-slate-400">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-slate-400">No notifications yet.</div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`border-b border-slate-500/20 px-4 py-3 last:border-b-0 ${
                          item.readStatus ? 'bg-transparent' : 'bg-cyan-500/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <p className="mt-1 whitespace-pre-line text-xs leading-5 text-slate-400">{item.message}</p>
                          </div>
                          <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            item.severity === 'HIGH' ? 'bg-red-500/15 text-red-200' : 'bg-amber-500/15 text-amber-200'
                          }`}
                          >
                            {item.severity === 'HIGH' ? 'High' : 'Watch'}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">{formatDateTime(item.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen((previous) => !previous)
              setNotificationsOpen(false)
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-500/25 bg-slate-900/80 p-1.5 pl-2 transition hover:border-cyan-200/30"
          >
            <UserAvatar user={user} isAdmin={isAdmin} size="sm" />
            <span className="hidden max-w-[110px] truncate text-sm text-slate-200 sm:block">{user?.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-400/35 bg-slate-950/92 shadow-[0_20px_55px_-25px_rgba(56,189,248,0.7)] backdrop-blur-xl"
              >
                <div className="border-b border-slate-500/30 px-3 py-2.5">
                  <p className="truncate text-xs font-medium text-white">{user?.name}</p>
                  <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { navigate(isAdmin ? '/admin/profile' : '/profile'); setDropdownOpen(false) }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
                  >
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </button>
                  <button
                    onClick={() => { navigate(isAdmin ? '/admin/settings' : '/settings'); setDropdownOpen(false) }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                  </button>
                  <div className="mt-1 border-t border-slate-500/30 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-100"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
