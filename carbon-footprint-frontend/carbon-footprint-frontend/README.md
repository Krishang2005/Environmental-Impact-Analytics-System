# CarbonTrack — Frontend

Production-grade React + Vite + Tailwind CSS frontend for the Carbon Footprint Monitoring System.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 (dark theme, custom design system) |
| Routing | React Router v6 |
| HTTP | Axios (JWT interceptor, 401 auto-logout) |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts (area, bar, pie, gauge) |
| Notifications | React Hot Toast |
| State | Context API (AuthContext) |
| Auth | JWT stored in localStorage, role-based routing |

---

## Folder Structure

```
src/
├── api/              # Axios instance + service modules per domain
│   ├── axiosInstance.js
│   ├── authApi.js
│   ├── carbonApi.js
│   ├── userApi.js
│   └── adminApi.js
├── components/
│   ├── charts/       # Recharts wrappers (area, bar, pie, gauge)
│   ├── layout/       # Sidebar, Topbar, DashboardLayout, ProtectedRoute
│   └── ui/           # Reusable design system components
├── context/          # AuthContext (login/logout/role)
├── hooks/            # useFetch generic data-fetching hook
├── pages/
│   ├── public/       # Login, Register, ForgotPassword, 404
│   ├── user/         # Dashboard, AddEntry, MyEntries, Report, Leaderboard, Profile
│   └── admin/        # Dashboard, Users, HighEmitters, ZoneReport, CsvExport, Analytics
└── utils/            # Formatters, constants, helpers
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
# .env
VITE_API_BASE_URL=/api
VITE_BACKEND_PROXY_TARGET=http://localhost:8080
```

### 3. Start development server

```bash
npm run dev
```

App will be available at `http://localhost:5173`

To open on mobile in the same Wi-Fi, run:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

---

## Share Over Internet

For demo sharing, expose only the frontend port and let Vite proxy `/api` to the backend.

1. Start backend on port `8080`
2. Start frontend on port `5173`
3. Create a public tunnel for port `5173`
4. Share that single public frontend link

This works because frontend requests use `/api`, so the public frontend link can proxy API calls back to your backend through the same machine.

### 4. Build for production

```bash
npm run build
```

---

## Backend API Mapping

| Frontend Page | API Endpoint |
|---|---|
| Login | `POST /api/auth/login` |
| Register | `POST /api/auth/register` |
| Verify OTP | `POST /api/auth/verify-otp` |
| User Dashboard | `GET /api/user/dashboard` |
| Add Entry | `POST /api/carbon/add` |
| My Entries | `GET /api/carbon/my` |
| Monthly Report | `GET /api/carbon/download-monthly` |
| Leaderboard | `GET /api/user/leaderboard` |
| Admin Dashboard | `GET /api/admin/dashboard` |
| High Emitters | `GET /api/admin/high-emitters` |
| Zone Report | `GET /api/admin/zones/summary` |
| CSV Export | `GET /api/carbon/admin/download-monthly` |

---

## Authentication Flow

1. User logs in → `POST /api/auth/login`
2. If `ROLE_USER` → JWT token returned immediately
3. If `ROLE_ADMIN` → OTP sent to email, verify via `POST /api/auth/verify-otp`
4. JWT stored in `localStorage`, attached to all subsequent requests via Axios interceptor
5. On 401 → automatic logout + redirect to `/login`

---

## Role-Based Access

| Route | Required Role |
|---|---|
| `/dashboard/*` | `ROLE_USER` |
| `/admin/*` | `ROLE_ADMIN` |
| `/login`, `/register` | Unauthenticated only |

---

## Design System

Custom dark theme with Tailwind CSS:
- **Primary colour:** `brand-600` — `#00a872` (green)
- **Background:** `surface-900` — `#0b0f0e`
- **Cards:** `glass-card` — translucent with backdrop blur
- **Typography:** DM Sans (body) + JetBrains Mono (numbers/code)
- **Animations:** `animate-fade-in`, `animate-slide-up`

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Spring Boot backend URL | `http://localhost:8080` |
| `VITE_APP_NAME` | App display name | `CarbonTrack` |
| `VITE_APP_VERSION` | Version string | `1.0.0` |
