# ⚽ World Cup Fantasy 2026

A full-stack fantasy football web application for the FIFA World Cup 2026. Build your dream team, compete in leagues, and track live scores — inspired by Dream11 and FPL.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Express.js, TypeScript, Prisma ORM, Socket.IO |
| **Database** | SQLite (dev) / PostgreSQL (production) |
| **Auth** | JWT + Google OAuth 2.0 |
| **Real-time** | Socket.IO for live scores, events, leaderboard |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Set Up Environment

```bash
# Backend — copy and configure
cp backend/.env.example backend/.env
# IMPORTANT: Generate a strong JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
# Paste the output as JWT_SECRET in backend/.env
```

### 3. Initialize Database & Seed Data

```bash
cd backend
npx prisma db push
npx tsx prisma/seed.ts
```

This creates:
- 🏟️ **104 matches** (72 group stage + 32 knockout) across 16 real venues
- ⚽ **720+ players** across all 48 FIFA 2026 teams
- 👤 **3 demo accounts** (admin, demo, custom)
- 🏆 **5 achievements** + season history

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend && npm run dev
```

### 5. Login

Default admin and demo accounts are created during seeding. Check your `backend/.env` for `ADMIN_EMAIL` and update passwords immediately after first login via the admin panel.

> ⚠️ **Security**: Never commit credentials to version control. Rotate all default passwords before deploying to production.

## 📱 Features

- **Team Builder** — Drag-and-drop pitch with 5 formations (4-4-2, 4-3-3, 3-5-2, 3-4-3, 5-3-2)
- **AI Coach** — Squad analysis, captain recommendations, budget optimization
- **Live Scoring** — Real-time score updates via Socket.IO
- **Captain System** — Captain gets 2x points, Vice-Captain gets 1.5x
- **Private Leagues** — Create/join with invite codes, league leaderboards
- **Admin Panel** — Manage matches, add events, trigger score recalculation
- **PWA** — Installable on mobile with offline support
- **Push Notifications** — Goal alerts, match reminders (requires VAPID keys)
- **Knockout Bracket** — Visual tournament bracket view

## ⚙️ Optional Configuration

### Google OAuth
1. Create OAuth 2.0 credentials at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Set redirect URI: `http://localhost:4000/api/auth/google/callback`
3. Add to `backend/.env`:
```
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_secret
```

### Push Notifications
```bash
npx web-push generate-vapid-keys
# Add the output to backend/.env as VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
```

### Football Data API (Live Sync)
Register at [football-data.org](https://www.football-data.org/client/register) and add `FOOTBALL_API_KEY` to `.env`.

## 📁 Project Structure

```
├── backend/
│   ├── prisma/           # Schema + seed data
│   ├── src/
│   │   ├── auth/         # JWT + Passport strategies
│   │   ├── controllers/  # 8 controllers (auth, team, match, league, etc.)
│   │   ├── middleware/    # Auth guard, validators, error handler, rate limiter
│   │   ├── routes/       # REST API routes
│   │   ├── services/     # Scoring engine, football API sync
│   │   └── sockets.ts    # Socket.IO event handlers
│   └── server.ts         # Express + Socket.IO + Cron setup
├── frontend/
│   ├── src/
│   │   ├── app/          # 13 Next.js pages
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth + Socket providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # API client, utilities
│   │   └── types/        # TypeScript interfaces
│   └── public/           # PWA assets, icons
└── README.md
```

## 🔒 Security Notes

- Never commit `.env` files (already in `.gitignore`)
- Always regenerate `JWT_SECRET` before deploying
- Change `ADMIN_EMAIL` to your real email
- Use PostgreSQL with SSL for production
