# 🌿 FieldCropCast — Farmer Weather Intelligence Dashboard

A full-stack weather intelligence platform for Kenyan farmers, powered by the WeatherAI API, Next.js 16, Clerk authentication, Firebase Firestore, and M-Pesa Express payments.

FieldCropCast translates raw meteorological data into crop-specific farming actions — with AI-generated field summaries, satellite tree analysis, 7-day risk scoring, and a real M-Pesa subscription flow.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6c47ff?style=flat-square)
![Firebase](https://img.shields.io/badge/DB-Firebase-ffca28?style=flat-square&logo=firebase)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

---

## 📹 Demo

```text
> 1. Sign in via Clerk
> 2. Enter your farm name and select a Kenya county (lat/lon auto-populates)
> 3. Click Analyze Farm — weather, risk scores, and AI summary load
> 4. Select your crop to get tailored field recommendations
> 5. Upload a field photo to run satellite tree analysis
> 6. Upgrade to Pro or Scale via M-Pesa STK Push
```

---

## 🔍 Project Overview

### Problem

Kenyan smallholder farmers make critical decisions — when to plant, spray, irrigate, or harvest — with little access to weather intelligence tuned to their specific crop and location. Generic forecasts don't give actionable advice.

### What the app demonstrates

A complete farm intelligence lifecycle:

1. **Identify** — Farmer signs in via Clerk; profile syncs to Firebase Firestore
2. **Analyse** — WeatherAI API returns current conditions, 7-day forecast, and an AI field summary
3. **Act** — Crop-specific risk scoring and field recommendations surface from the forecast
4. **Diagnose** — Field photos run through the WeatherAI Trees API for satellite-grade tree health analysis
5. **Subscribe** — M-Pesa STK Push upgrades the farmer to Pro or Scale plan

### The 13 API proxy routes

| Route | Method | Purpose |
| --- | --- | --- |
| `app/backend/api/weather` | GET | Main weather proxy (current + 7-day + AI summary) |
| `app/backend/api/weather-geo` | GET | Weather by detected IP location |
| `app/backend/api/geocode` | GET | Reverse geocode lat/lon → place name |
| `app/backend/api/config` | GET | Static UI config (crops, units, refresh interval) |
| `app/backend/api/usage` | GET | WeatherAI quota usage for the current period |
| `app/backend/api/trees/analyze` | POST | Upload field photo → tree count, health, recommendations |
| `app/backend/api/trees/quota` | GET | Tree analysis monthly usage and limit |
| `app/backend/api/trees/history` | GET | Previous tree analysis records |
| `app/backend/api/alerts` | GET / DELETE | Active weather alerts + dismiss |
| `app/backend/api/alerts/webhook` | POST | WeatherAI webhook receiver |
| `app/backend/api/mpesa/stk-push` | POST | Initiate M-Pesa STK Push payment |
| `app/backend/api/mpesa/query` | GET | Poll Safaricom for payment status |
| `app/backend/api/mpesa/callback` | POST | Safaricom payment callback receiver |

---

## 🛠️ Getting Started

### 1. Clone

```bash
git clone https://github.com/ex-rnd/FieldCropCast.git
cd FieldCropCast
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env`

```env
# WeatherAI
WAI_API_KEY=wai_your_key_here

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_APP_ID=...

# M-Pesa Daraja
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=...
MPESA_CALLBACK_URL=https://your-domain.com/backend/api/mpesa/callback

# Optional
WEBHOOK_SECRET=your_webhook_shared_secret
PORT=3000
```

### 4. Start ngrok (M-Pesa callbacks, dev only)

```bash
ngrok http 3000
# Copy the HTTPS URL → set MPESA_CALLBACK_URL in .env
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## ▶️ Usage

### Farm Setup

- Sign in via Clerk
- Select your **county** from all 47 Kenya counties — lat/lon auto-populates
- Set your farm name, crop, and optional details (planting date, farm size, soil type)
- Click **Analyze Farm** to fetch live weather and AI summary

### Crop Risk Assessment

```text
Select crop → Risk scores recalculate instantly (no extra API call)
Rain · Wind · Heat/Frost each scored 0–100 with urgency level
Field recommendations colour-coded: urgent / warning / caution / good
```

### Tree Analysis

```http
POST /backend/api/trees/analyze
Content-Type: multipart/form-data

Fields: image (file), farmerId, county, landAcres, notes, location
```

Returns: tree count, density per acre, canopy coverage %, confidence score, health breakdown, species guess, AI observations and recommendations.

### M-Pesa Payment Flow

```http
POST /backend/api/mpesa/stk-push
{ "phoneNumber": "0712345678", "amount": 1200, "planId": "pro" }

→ STK Push sent to farmer's phone
→ Poll GET /backend/api/mpesa/query?checkoutId=<id> every 8s
→ ResultCode "0" = success · "1032" = cancelled
```

---

## 🚀 App Routes

| Route | Description |
| --- | --- |
| `/` | Main dashboard (auth required) |
| `/sign-in` | Clerk hosted sign-in |
| `/sign-up` | Clerk hosted sign-up |
| `/backend/api/*` | All proxy API routes (server-side, credentials never exposed) |

---

## 📁 Key Files

### `app/page.tsx`

- Root state orchestration
- Boots from localStorage → Firebase (cloud wins)
- Manages weather fetch, auto-refresh (30 min), alert polling (30 s)

### `components/AppTopNav.tsx`

- Navigation bar, farm identity pill, risk status
- Plans modal (Starter / Pro / Scale feature comparison)
- Payment trigger → `PaymentModal`

### `components/CenterPanel.tsx`

- Crop selector (17 crops), crop details, crop stage estimator
- Field recommendations, current conditions, 7-day risk cards

### `components/RightSidebar.tsx`

- AI summary (Kiswahili + English toggle)
- Field photo upload → tree analysis results
- 7-day forecast strip, weather alerts

### `components/PaymentModal.tsx`

- M-Pesa STK Push flow with phone input, loading, success/failure states
- Polls `/backend/api/mpesa/query` every 8 s with 90 s timeout

### `lib/weather-utils.ts`

- Risk scoring engine, field recommendations, crop stage estimation
- WMO condition code → emoji/text, unit formatters

### `lib/api-error.ts`

- Classifies upstream errors: `QUOTA_EXCEEDED` · `AUTH_ERROR` · `UPSTREAM_ERROR` · `TIMEOUT`
- Consistent error shape `{ code, error, detail, resetAt? }` across all routes

### `lib/mpesa.ts`

- Daraja OAuth token fetch, timestamp generator, password builder, phone formatter

### `lib/farm-db.ts`

- Firebase Firestore helpers: `loadFarmFromFirebase`, `saveFarmToFirebase`
- Email as document ID in `farmers` collection

---

## 🔐 Environment & Secrets

- Never commit `.env` — it is `.gitignore`d
- All API keys (WeatherAI, M-Pesa) are server-side only — never sent to the browser
- Clerk handles farmer authentication; Firebase Firestore stores farm profiles keyed by Clerk email
- Set `WEBHOOK_SECRET` to validate WeatherAI webhook payloads

---

## ☁️ Deployment

Deployed via [Coolify](https://coolify.io) with the **Nixpacks** build pack.

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Base Directory | `/` |
| Port | `3000` |
| Build Pack | Nixpacks |

Set all environment variables in Coolify before deploying. For M-Pesa production, replace Daraja sandbox URLs with live endpoints and set `MPESA_CALLBACK_URL` to your production domain.

---

## 🔜 Roadmap

- 📱 SMS alert delivery integration (Africa's Talking)
- 🗺️ Farm map view with county heat map overlay
- 📸 Multi-image batch tree analysis
- 📊 Historical weather trend charts per county
- 🤝 Team seats — multi-farmer accounts per farm
- 🌐 Offline-first PWA support for low-connectivity areas
- 🔁 Webhook retry queue with exponential backoff

---

## 🤝 Contributing

- Fork the repo
- Branch naming: `feature/xyz` or `fix/xyz`
- Type-check before opening a PR:

```bash
npm run typecheck
```

- Submit PRs with clear descriptions and link related issues

---

## 📄 Documentation

Full technical reference — API routes, data model, authentication flow, payment integration, error codes:
**[DOCUMENTATION.md](./DOCUMENTATION.md)**

---

### 🙏 Built for Kenyan farmers. Powered by WeatherAI 🌾
