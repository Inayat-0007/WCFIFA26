# 🚀 Complete Deployment Guide — FIFA World Cup 2026 Fantasy App

> **Goal**: Get your app live on the internet, running 24/7, so you and your 10 friends can play during the World Cup.
>
> **Total time**: ~30 minutes | **Total cost**: $0 (all free tiers)

---

## 📋 What You're Setting Up (Current Status)

| Step | Service | What It Does | Cost | Status |
|------|---------|-------------|------|--------|
| 1 | **Neon** (neon.tech) | PostgreSQL database in the cloud | Free | ✅ **Completed** |
| 2 | **football-data.org** | Live match scores API key | Free | ✅ **Completed** |
| 3 | **VAPID Keys** | Push notification encryption keys | Free | ✅ **Completed** |
| 4 | **Render.com** | Hosts backend live at `https://wcfifa26.onrender.com` | Free | ✅ **Completed & Live** |
| 5 | **Vercel** | Hosts your frontend (Next.js) on global CDN | Free | ⏳ **Next Step** |
| 6 | **GitHub Push** | Push final code & trigger auto-deploy | Free | ✅ **Completed** |

---

## Step 1: Create a Free PostgreSQL Database (Neon)

> **Why?** Your local SQLite file (`dev.db`) gets erased every time a cloud server restarts. You need a permanent database in the cloud.

### 1.1 — Sign Up

1. Go to **https://neon.tech**
2. Click **"Sign Up"** → use your **GitHub account** (fastest)
3. No credit card required

### 1.2 — Create a Database

1. After signing in, you'll see **"Create a project"**
2. **Project name**: `wcfifa26`
3. **Region**: Pick the closest to you (e.g., `Asia Southeast` if you're in India)
4. **PostgreSQL version**: Leave default (latest)
5. Click **"Create Project"**

### 1.3 — Get Your Connection String

1. After creation, you'll see a **"Connection Details"** widget
2. Click the **"Pooled connection"** tab (important for web apps)
3. Copy the full connection string — it looks like this:

```
postgresql://neondb_owner:abc123xyz@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

4. **Save this somewhere safe** — you'll paste it into Render in Step 4

> [!TIP]
> **Free tier limits**: 0.5 GB storage, auto-sleeps after 5 min of inactivity (wakes up instantly on next query). More than enough for 10 friends.

---

## Step 2: Get a Free Football API Key

> **Why?** This key lets your backend's cron job fetch real live match scores, goals, and cards from `football-data.org` every 60 seconds during the World Cup.

### 2.1 — Register

1. Go to **https://www.football-data.org/client/register**
2. Fill in your name and email
3. Choose the **Free** plan (€0/month — free forever)
4. Click **Register**

### 2.2 — Get Your Key

1. Check your email for the confirmation + API token
2. Or log in at **https://www.football-data.org/client/home** to see your token
3. Your API key looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

4. **Save this key** — you'll paste it into Render in Step 4

> [!IMPORTANT]
> **Free tier rate limit**: 10 requests/minute. Your cron runs once per minute and makes 1-3 requests per cycle — well within limits. FIFA World Cup IS included in the free tier ✅

---

## Step 3: Generate VAPID Keys (Push Notifications)

> **Why?** VAPID keys encrypt push notifications between your server and your friends' browsers. Without them, the "Enable Notifications" button on the profile page won't work.

### 3.1 — Run One Command

Open your terminal and run:

```bash
npx web-push generate-vapid-keys
```

### 3.2 — Save the Output

You'll see something like:

```
=======================================

Public Key:
BLc-5fX2H0Tq...very-long-string...kQ

Private Key:
3KzvKMwJt4...shorter-string...Hw

=======================================
```

**Copy both keys and save them** — you'll paste them into Render in Step 4.

> [!CAUTION]
> Generate these keys **ONLY ONCE**. If you regenerate them later, all existing push subscriptions become invalid and your friends will need to re-enable notifications.

---

## Step 4: Deploy Backend to Render.com

> **Why?** Render hosts your Express API + Socket.IO server + cron job 24/7 in the cloud for free. Your friends' browsers connect here for authentication, team data, and live score updates.

### 4.1 — Sign Up

1. Go to **https://render.com**
2. Click **"Get Started"** → sign up with **GitHub** (this links your repos automatically)

### 4.2 — Create a Web Service

1. In your Render Dashboard, click **"New +"** → **"Web Service"**
2. Find and select your repository: `Inayat-0007/WCFIFA26`
3. Configure these settings:

| Field | Value |
|-------|-------|
| **Name** | `WCFIFA26` |
| **Region** | Pick closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

> [!WARNING]
> The **Root Directory** must be set to `backend` — this tells Render to run commands inside the `/backend` folder, not the project root.

### 4.3 — Add Environment Variables

Before clicking "Create", scroll down to **"Environment Variables"** and add each one:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | *Paste the Neon connection string from Step 1.3* |
| `JWT_SECRET` | `8Wi9rI7wMGpD832PY5dxOrE7ak4t1n9CTLmmrYWHbO+W0+WS0i3hEnU+QN17Lw17` |
| `JWT_EXPIRES_IN` | `7d` |
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | *(leave blank for now — you'll update after Step 5)* |
| `API_URL` | *(leave blank for now — Render will give you a URL after deploy)* |
| `FOOTBALL_API_KEY` | *Paste your key from Step 2.2* |
| `VAPID_PUBLIC_KEY` | *Paste your public key from Step 3.2* |
| `VAPID_PRIVATE_KEY` | *Paste your private key from Step 3.2* |
| `ADMIN_EMAIL` | `admin@worldcupfantasy.com` |

### 4.4 — Deploy

1. Click **"Create Web Service"**
2. Render will build your project — wait 2-3 minutes
3. Once deployed, you'll get a URL like: `https://wcfifa26.onrender.com`
4. Test it by visiting: `https://wcfifa26.onrender.com/health`
   - You should see: `{"status":"ok","service":"World Cup Fantasy 2026 API",...}`

5. **Copy your Render URL** — you need it for Step 5

### 4.5 — Migrate Database & Seed Data

After your backend is deployed and running, you need to initialize the database. In Render Dashboard:

1. Go to your **WCFIFA26** service
2. Click the **"Shell"** tab (top-right area)
3. Run these commands one by one:

```bash
npx prisma db push
```

```bash
npx ts-node prisma/seed.ts
```

You should see the familiar output:
```
🌍 Seeding World Cup Fantasy 2026 database...
✅ 720 total players seeded
✅ 72 group matches seeded
✅ 32 knockout matches seeded
🎉 Database seeding complete!
```

> [!IMPORTANT]
> You must change `schema.prisma` **before deploying** for PostgreSQL. See the "Pre-Deployment Code Changes" section below.

---

## Step 5: Deploy Frontend to Vercel

> **Why?** Vercel hosts your Next.js UI on a global CDN — your friends get instant page loads from servers closest to them. It auto-deploys when you push to GitHub.

### 5.1 — Sign Up

1. Go to **https://vercel.com/signup**
2. Sign up with **GitHub** (same account as your repo)

### 5.2 — Import Your Project

1. Click **"Add New..."** → **"Project"**
2. Find and import: `Inayat-0007/WCFIFA26`
3. Configure:

| Field | Value |
|-------|-------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | Click **Edit** → enter `frontend` |

### 5.3 — Add Environment Variable

Expand **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://wcfifa26.onrender.com/api` |

> Replace `wcfifa26.onrender.com` with your actual Render URL from Step 4.4.

### 5.4 — Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes for the build
3. You'll get a URL like: `https://wcfifa-26.vercel.app`
4. **This is the URL you share with your 10 friends!** 🎉

### 5.5 — Update Render's CLIENT_URL

Now go back to **Render Dashboard**:

1. Go to your `WCFIFA26` service → **"Environment"** tab
2. Update these two variables:
   - `CLIENT_URL` = `https://wcfifa-26.vercel.app`
   - `API_URL` = `https://wcfifa26.onrender.com`
3. Click **"Save Changes"** → choose **"Save and deploy"**

> This ensures CORS allows your Vercel frontend to talk to the Render backend.

---

## ⚠️ Pre-Deployment Code Changes (Do This FIRST!)

Before pushing to GitHub for deployment, you need to make **one change** in your codebase to switch from SQLite to PostgreSQL:

### Change 1: Update Prisma Schema

Open `backend/prisma/schema.prisma` and change:

```diff
datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
}
```

### Change 2: Push All Changes to GitHub

```bash
cd c:\Users\moham\Music\inayat
git add .
git commit -m "feat: switch to PostgreSQL and prepare for cloud deployment"
git push
```

> Both Vercel and Render will **automatically rebuild and redeploy** when you push to `main`.

---

## Step 6: Verify Everything Works

### 6.1 — Backend Health Check

Visit: `https://wcfifa26.onrender.com/health`

Expected response:
```json
{
  "status": "ok",
  "service": "World Cup Fantasy 2026 API",
  "timestamp": "2026-06-10T12:00:00.000Z"
}
```

### 6.2 — Frontend Load

Visit: `https://wcfifa-26.vercel.app`

You should see the landing page with the World Cup theme.

### 6.3 — Login Test

1. Click **Login**
2. Use: `admin@worldcupfantasy.com` / `Admin@2026!`
3. You should land on the dashboard with match data

### 6.4 — Invite Your Friends
Share the Vercel URL with your friends. They can:

1. Go to `https://wcfifa-26.vercel.app/signup`
2. Create an account
3. Start building fantasy teams for upcoming matches!

---

## 🔧 How It All Works Together (24/7 Flow)

```
Your Friend opens the app on their phone
       │
       ▼
[Vercel CDN] serves the Next.js UI instantly
       │
       ▼
Browser connects to [Render Backend] via:
  • REST API (login, teams, matches)
  • WebSocket (live score updates)
       │
       ▼
[Render Backend] runs 24/7:
  • Express API handles all requests
  • Socket.IO pushes live updates
  • node-cron runs every 60 seconds:
       │
       ▼
  [football-data.org API]
    ← fetches live match events
       │
       ▼
  Events saved to [Neon PostgreSQL]
       │
       ▼
  Scoring engine recalculates points
       │
       ▼
  Socket.IO broadcasts to all friends' browsers
       │
       ▼
  🎉 Your friend sees "GOAL! +10 pts" live
```

---

## ⚡ Free Tier Limitations & Workarounds

### Render Free Tier
| Behavior | Detail | Impact |
|----------|--------|--------|
| **Sleep after 15 min** | If no one uses the app for 15 min, the backend sleeps | First request after sleep takes 30-60 seconds (cold start) |
| **WebSockets keep it awake** | Active Socket.IO connections prevent sleep | If even 1 friend has the app open, it stays awake ✅ |
| **750 free hours/month** | Enough for 1 service running 24/7 (720 hrs/month) | Just barely fits — don't run multiple services |

**Workaround for cold starts**: Use a free external pinger like **https://cron-job.org** to hit your `/health` endpoint every 14 minutes. This prevents sleep entirely.

### Neon Free Tier
| Behavior | Detail |
|----------|--------|
| **Auto-sleep after 5 min** | Database pauses when no queries come in |
| **Instant wake-up** | First query wakes it up in ~500ms (barely noticeable) |
| **0.5 GB storage** | Plenty for 10 users, 720 players, 104 matches |

### Vercel Free Tier
| Behavior | Detail |
|----------|--------|
| **No sleep** | Static sites are always online ✅ |
| **100 GB bandwidth** | Way more than 10 friends need |
| **Personal use only** | Hobby plan is for non-commercial projects |

---

## 📱 Share With Your Friends

Once everything is deployed, send your friends this message:

> **🏆 World Cup Fantasy 2026 is LIVE!**
>
> 1. Open: `https://wcfifa-26.vercel.app`
> 2. Click **Sign Up** → create your account
> 3. Go to **Matches** → pick an upcoming match
> 4. Build your **11-player team** (100 credits budget)
> 5. Pick a **Captain** (2x points) and **Vice-Captain** (1.5x)
> 6. Create or join a **Private League** using an invite code
> 7. When the match goes live, watch your points update in real-time! ⚡
>
> Have fun! ⚽🔥

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend returns CORS error | Update `CLIENT_URL` in Render env vars to match your Vercel URL exactly (no trailing slash) |
| "Cannot connect to database" | Check `DATABASE_URL` in Render — must start with `postgresql://` not `file:./` |
| Seed fails with "table not found" | Run `npx prisma db push` first, then seed |
| Frontend shows "Network Error" | Check `NEXT_PUBLIC_API_URL` in Vercel — must include `/api` at the end |
| Push notifications don't work | Ensure VAPID keys are set in Render and the site is served over HTTPS |
| App is slow on first load | That's the Render cold start (30-60s). Set up a cron pinger to prevent it |
| Google login fails | You need real Google OAuth credentials — email/password login works without it |
