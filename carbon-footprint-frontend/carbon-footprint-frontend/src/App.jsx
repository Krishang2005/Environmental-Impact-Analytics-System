import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import {
  AdminRoute,
  GuestRoute,
  UserRoute,
} from './components/layout/ProtectedRoute'
import { PageLoader } from './components/ui'

const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'))
const LandingPage = lazy(() => import('./pages/public/LandingPage'))
const LoginPage = lazy(() => import('./pages/public/LoginPage'))
const AdminLoginPage = lazy(() => import('./pages/public/AdminLoginPage'))
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'))
const ForgotPasswordPage = lazy(() =>
  import('./pages/public/OtherPublicPages').then((module) => ({ default: module.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('./pages/public/OtherPublicPages').then((module) => ({ default: module.ResetPasswordPage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/public/OtherPublicPages').then((module) => ({ default: module.NotFoundPage })),
)

const UserDashboard = lazy(() => import('./pages/user/UserDashboard'))
const AddCarbonEntry = lazy(() => import('./pages/user/AddCarbonEntry'))
const MyEntries = lazy(() => import('./pages/user/MyEntries'))
const MonthlyReport = lazy(() => import('./pages/user/MonthlyReport'))
const Leaderboard = lazy(() => import('./pages/user/Leaderboard'))
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'))
const StreakCenter = lazy(() => import('./pages/user/StreakCenter'))
const SmartComplaints = lazy(() => import('./pages/user/SmartComplaints'))
const SettingsPage = lazy(() => import('./pages/shared/SettingsPage'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AllUsers = lazy(() => import('./pages/admin/AllUsers'))
const HighEmitters = lazy(() => import('./pages/admin/HighEmitters'))
const ZoneReport = lazy(() => import('./pages/admin/ZoneReport'))
const CsvExport = lazy(() => import('./pages/admin/CsvExport'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminComplaintCenter = lazy(() => import('./pages/admin/AdminComplaintCenter'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
