import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import DashboardLayout from './components/layout/DashboardLayout'
import {
  AdminRoute,
  GuestRoute,
  UserRoute,
} from './components/layout/ProtectedRoute'

import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import AdminLoginPage from './pages/public/AdminLoginPage'
import RegisterPage from './pages/public/RegisterPage'
import { ForgotPasswordPage, ResetPasswordPage, NotFoundPage } from './pages/public/OtherPublicPages'

import UserDashboard from './pages/user/UserDashboard'
import AddCarbonEntry from './pages/user/AddCarbonEntry'
import MyEntries from './pages/user/MyEntries'
import MonthlyReport from './pages/user/MonthlyReport'
import Leaderboard from './pages/user/Leaderboard'
import ProfilePage from './pages/user/ProfilePage'
import StreakCenter from './pages/user/StreakCenter'
import SmartComplaints from './pages/user/SmartComplaints'
import SettingsPage from './pages/shared/SettingsPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AllUsers from './pages/admin/AllUsers'
import HighEmitters from './pages/admin/HighEmitters'
import ZoneReport from './pages/admin/ZoneReport'
import CsvExport from './pages/admin/CsvExport'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminComplaintCenter from './pages/admin/AdminComplaintCenter'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route element={<UserRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/add-entry" element={<AddCarbonEntry />} />
              <Route path="/my-entries" element={<MyEntries />} />
              <Route path="/monthly-report" element={<MonthlyReport />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/streaks" element={<StreakCenter />} />
              <Route path="/smart-complaints" element={<SmartComplaints />} />
              <Route path="/assistant" element={<Navigate to="/dashboard" replace />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route element={<AdminRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AllUsers />} />
              <Route path="/admin/high-emitters" element={<HighEmitters />} />
              <Route path="/admin/complaints" element={<AdminComplaintCenter />} />
              <Route path="/admin/zone-report" element={<ZoneReport />} />
              <Route path="/admin/csv-export" element={<CsvExport />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/profile" element={<ProfilePage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
