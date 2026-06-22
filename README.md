# WeatherAI Dashboard

A real-time weather dashboard built on the [WeatherAI API](https://weather-ai.co). Shows current conditions, a 7-day forecast, hourly breakdown, and AI-generated insights — with city search and automatic IP-based location detection.

![WeatherAI Dashboard preview](https://img.shields.io/badge/WeatherAI-Dashboard-64b5f6?style=flat-square)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

---

## Features

- **Auto-detect location** on load via IP geo-detection (`/v1/weather-geo`)
- **City search** with autocomplete (geocoded via OpenStreetMap Nominatim)
- **Current conditions** — temperature, feels like, condition, UV, wind, humidity, pressure, visibility, precipitation
- **7-day forecast** strip
- **Next 24-hour** scrollable hourly timeline
- **Gemini AI summary** from the WeatherAI API
- **°C / °F toggle** — no extra request needed, converts in-browser
- **Adaptive background** — warm/cool/cold gradient tint based on temperature
- **API key stays server-side** — the Express proxy never exposes your key to the browser

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/weather-ai-dashboard.git
cd weather-ai-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set your API key

```bash
cp .env.example .env
```

Open `.env` and set your WeatherAI key:

```
WAI_API_KEY=wai_your_key_here
```

Get a free key at **[weather-ai.co/dashboard](https://weather-ai.co/dashboard)** → API Keys.

### 4. Run

```bash
npm start
```

Open **[http://localhost:3000](http://localhost:3000)**.

For development with auto-reload (Node ≥ 18):

```bash
npm run dev
```

---

## API Routes (server-side proxy)

| Route | Description |
|---|---|
| `GET /api/weather?lat=&lon=&days=&units=` | Current conditions + 7-day forecast |
| `GET /api/weather-geo?days=&units=` | Auto-detect location from caller IP |
| `GET /api/geocode?q=<city>` | Geocode a city name → lat/lon |
| `GET /api/usage` | WeatherAI quota usage for your key |

All `/api/*` routes proxy to `https://api.weather-ai.co` with your `WAI_API_KEY` injected server-side.

---

## Deploy

### Railway

1. Push this repo to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
3. Add the environment variable `WAI_API_KEY` in **Variables**.
4. Railway auto-detects `npm start`. Done.

### Render

1. Push to GitHub.
2. [render.com](https://render.com) → **New → Web Service → Connect repo**.
3. Build command: `npm install`  
   Start command: `npm start`
4. Add `WAI_API_KEY` under **Environment**.

### Netlify / Vercel (static + serverless)

This project uses a Node server; deploy to a platform that supports Node runtimes (Railway, Render, Fly.io, Heroku). For Netlify/Vercel, convert `server.js` routes to serverless functions and set `WAI_API_KEY` as an environment variable.

---

## Project Structure

```
weather-ai-dashboard/
├── server.js          # Express proxy server (hides the API key)
├── public/
│   └── index.html     # Single-file dashboard (HTML + CSS + JS)
├── package.json
├── .env.example       # Environment variable template
├── .gitignore
└── README.md
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `WAI_API_KEY` | ✅ | Your WeatherAI API key (`wai_…`) |
| `PORT` | Optional | Server port. Defaults to `3000` |

---

## Tech Stack

- **Runtime**: Node.js ≥ 18
- **Server**: Express 4
- **Geocoding**: OpenStreetMap Nominatim (no extra key required)
- **Frontend**: Vanilla HTML/CSS/JS — zero build step, zero dependencies
- **Weather data**: [WeatherAI API](https://weather-ai.co/docs)

---

## License

MIT
