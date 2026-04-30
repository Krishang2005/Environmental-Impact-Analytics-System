import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CarbonAssistantWidget from '../assistant/CarbonAssistantWidget'
import CinematicBackground from '../fx/CinematicBackground'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isUser } = useAuth()
  const location = useLocation()

  return (
    <div className="relative flex h-screen overflow-hidden bg-transparent">
      <CinematicBackground />

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute left-[-10%] top-[18%] h-72 w-72 rounded-full bg-cyan-400/15 blur-[96px]" />
        <div className="absolute right-[-8%] top-[12%] h-80 w-80 rounded-full bg-indigo-400/15 blur-[110px]" />
      </div>

      {/* Desktop Sidebar */}
      <div className="relative z-20 hidden flex-shrink-0 lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 h-full w-64">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-20 flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {isUser && <CarbonAssistantWidget />}
      </div>
    </div>
  )
}
