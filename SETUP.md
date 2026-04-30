# Local Setup

This repo now works on this laptop with:

- MySQL running locally
- database `carbon_footprint` created
- backend roles auto-seeded on first startup
- backend zones auto-seeded on first startup
- frontend reset-password route restored

## Current Status

Verified locally:

- MySQL service is running
- database `carbon_footprint` exists
- backend test passes when `DB_PASSWORD` is set correctly

Still missing on this laptop:

- `node` / `npm` is not on `PATH`
- `git` is not on `PATH`

## Backend

Path:

- `carbon-footprint-backend`

Required environment variables in PowerShell:

```powershell
$env:DB_USERNAME="root"
$env:DB_PASSWORD="YOUR_MYSQL_PASSWORD"
$env:MAIL_USERNAME="YOUR_GMAIL_ADDRESS"
$env:MAIL_PASSWORD="YOUR_GMAIL_APP_PASSWORD"
$env:OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```

Optional environment variables:

```powershell
$env:SERVER_PORT="8080"
$env:RESET_PASSWORD_URL="http://localhost:5173/reset-password"
$env:DEV_OTP_CONSOLE_FALLBACK="true"
```

Run backend:

```powershell
cd carbon-footprint-backend
./mvnw spring-boot:run
```

Test backend:

```powershell
cd carbon-footprint-backend
$env:DB_PASSWORD="YOUR_MYSQL_PASSWORD"
./mvnw test
```

## Database

The backend expects MySQL.

Database name:

- `carbon_footprint`

If you ever need to create it manually:

```powershell
& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' -h 127.0.0.1 -P 3306 -u root --password=YOUR_MYSQL_PASSWORD -e "CREATE DATABASE IF NOT EXISTS carbon_footprint;"
```

Notes:

- Roles are auto-created by `RoleInitializer`
- Zones are auto-created by `ZoneInitializer`
- For development only, set `JPA_DDL_AUTO=update` if you want Hibernate to create/update tables automatically. The checked-in default is `validate`; production/demo deployments should use reviewed Flyway migrations.

## Frontend

Path:

- `carbon-footprint-frontend/carbon-footprint-frontend`

Current frontend `.env` can stay minimal because:

- `VITE_API_BASE_URL=` uses same-origin `/api`
- Vite proxies `/api` to `http://localhost:8080` by default

Recommended `.env`:

```env
VITE_API_BASE_URL=
VITE_BACKEND_PROXY_TARGET=http://localhost:8080
VITE_APP_NAME=CarbonTrack
VITE_APP_VERSION=1.0.0
```

Run frontend after installing Node.js:

```powershell
cd carbon-footprint-frontend\carbon-footprint-frontend
npm install
npm run dev
```

Expected URL:

- `http://localhost:5173`

## Install Missing Tools

Install Node.js:

- install the current LTS release from the official Node.js site

Install Git:

- install Git for Windows from the official Git site

After installing, open a new terminal and verify:

```powershell
node -v
npm -v
git --version
```

## Common Issues

`Access denied for user 'root'@'localhost'`

- set the correct `DB_PASSWORD`

`Unknown database 'carbon_footprint'`

- create the database manually or let Spring create it through the configured JDBC URL

Password reset email opens the wrong page

- make sure `RESET_PASSWORD_URL` points to `http://localhost:5173/reset-password`

Admin OTP mail fails

- with `DEV_OTP_CONSOLE_FALLBACK=true`, the OTP is printed in backend logs for local use

## Repo Notes

There is an unusual extra folder in the frontend root:

- `carbon-footprint-frontend/carbon-footprint-frontend/{public,src`

It looks accidental and should be reviewed before cleanup, but I left it untouched.
