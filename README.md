# World Cup Fantasy 2026 ⚽

> A complete, full-stack Dream11-inspired fantasy football platform for FIFA World Cup 2026.  
> Built for 10 friends across India — real-time, lightning-fast, and beautiful.

---

## 🏆 Features

| Feature | Status |
|---|---|
| JWT + Google OAuth authentication | ✅ |
| Private leagues with invite codes (max 10) | ✅ |
| Dream11-style team builder with pitch view | ✅ |
| 100-credit budget system | ✅ |
| 11-player team (1 GK, 4 DEF, 3 MID, 3 FWD) | ✅ |
| Captain (2x) and Vice-Captain (1.5x) | ✅ |
| Live match scoring (Goal +10, Assist +5, etc.) | ✅ |
| Real-time updates via Socket.IO | ✅ |
| Global + Private league leaderboards | ✅ |
| Admin dashboard (score, events, users) | ✅ |
| Football-Data.org auto-sync (cron every 60s) | ✅ |
| 48-team FIFA WC 2026 fixture list (group stage) | ✅ |
| 200+ player pool across all 48 nations | ✅ |
| PWA — installable on any device | ✅ |
| Responsive (mobile + desktop) | ✅ |

---

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT + Passport.js + Google OAuth 2.0
- **Real-time**: Socket.IO
- **Scheduling**: node-cron
- **External API**: Football-Data.org (auto-fallback if no key)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (custom dark/red/gold theme)
- **Animation**: Framer Motion
- **State**: React Query + Context API
- **Forms**: React Hook Form + Zod

---

## 📦 Project Structure

```
Pragati Devaliya/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # 10 models, full WC 2026 schema
│   │   └── seed.ts            # 48 matches + 200+ players
│   └── src/
│       ├── auth/jwt.ts
│       ├── controllers/       # auth, league, match, player, team, leaderboard, admin
│       ├── middleware/        # auth, errorHandler, rateLimit
│       ├── routes/            # all API routes
│       ├── services/          # scoringEngine, footballApi
│       ├── sockets/           # Socket.IO rooms + emit helpers
│       └── server.ts
└── frontend/
    └── src/
        ├── app/               # Next.js pages (all routes)
        ├── components/        # UI, Navbar, MatchCard, CountdownTimer
        ├── context/           # AuthContext, SocketContext
        ├── lib/               # api.ts, socket.ts, utils.ts
        └── types/             # All TypeScript interfaces
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL (local or [Neon](https://neon.tech) — free cloud Postgres)
- [Football-Data.org](https://www.football-data.org/) API key (optional — fallback works without it)

---

### 1. Clone / Open Project

```bash
# Your project is at:
cd "c:\Users\moham\Music\Pragati Devaliya"
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy env file
copy .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/wcf2026
JWT_SECRET=your_very_long_random_secret_here_at_least_32_chars
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=your@email.com      # Your email — auto-gets admin access
PORT=4000
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Optional — get free key at football-data.org
FOOTBALL_API_KEY=

# Optional — Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (48 matches + 200+ players)
npm run db:seed

# Start development server
npm run dev
```

Backend runs at: **http://localhost:4000**  
Health check: **http://localhost:4000/health**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

### 4. First Login (Admin)

1. Open http://localhost:3000
2. Click **Sign Up**
3. Use the email you set as `ADMIN_EMAIL` in `backend/.env`
4. You'll automatically get **Admin** access
5. Visit **Profile → Admin Dashboard** to manage matches and events

---

## 🎯 Scoring System

| Event | Points |
|---|---|
| Goal | +10 |
| Assist | +5 |
| Clean Sheet (GK/DEF) | +4 |
| Yellow Card | -2 |
| Red Card | -5 |
| Penalty Miss | -4 |
| Captain | 2× multiplier |
| Vice-Captain | 1.5× multiplier |

---

## 📱 Access from All Devices

| Device | URL |
|---|---|
| Browser (PC/Mac/Linux) | http://localhost:3000 |
| Mobile (same network) | http://YOUR_PC_IP:3000 |
| PWA (installable) | Click "Add to Home Screen" in browser |

To allow mobile access, add your PC's local IP to `backend/.env`:
```env
CLIENT_URL=http://192.168.x.x:3000
```

---

## 🔧 Admin Controls

Access via `/admin` page (admin users only):

- **Update match scores** in real-time
- **Add events** (Goal, Assist, Yellow Card, Red Card, etc.) → auto-triggers point calculation
- **View all users and leagues**
- **Trigger manual score recalculation** at any time

---

## 📡 API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/matches | All matches (filterable) |
| GET | /api/matches/live | Live matches |
| POST | /api/teams | Save fantasy team |
| GET | /api/teams/:matchId | My team for a match |
| GET | /api/leagues | My leagues |
| POST | /api/leagues | Create league |
| POST | /api/leagues/join | Join with invite code |
| GET | /api/leaderboard/global | Global rankings |
| GET | /api/leaderboard/league/:id | League leaderboard |
| PATCH | /api/admin/matches/:id/score | Update score (Admin) |
| POST | /api/admin/matches/:id/events | Add event (Admin) |

---

## 🌐 Real-time Socket Events

| Event | Direction | Payload |
|---|---|---|
| `join:match` | Client → Server | matchId |
| `join:league` | Client → Server | leagueId |
| `score:update` | Server → Client | { matchId, homeScore, awayScore, minute } |
| `event:new` | Server → Client | { matchId, event } |
| `points:update` | Server → Client | { userId, matchId, newTotal } |
| `leaderboard:update` | Server → Client | { leagueId } |
| `notification:push` | Server → Client | { title, body, type } |

---

*World Cup Fantasy 2026 — Built with ❤️ for the beautiful game.*
