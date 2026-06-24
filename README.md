# 🌿 FieldCropCast - Farmer Weather Intelligence
A full‑stack Next.js application that helps Kenyan farmers make smarter crop decisions 🌾, powered by WeatherAI APIs, Firebase Firestore, Clerk authentication, and M‑Pesa STK Push for subscriptions.


## ✳️ Visual Overview 

<p align="center"><strong>Demo</strong></p>
<div align="center">
<video src="https://github.com/user-attachments/assets/1cbc1b12-124c-4b8b-a516-3c4ec5bfebac" width="500" controls></video>
</div>

<p align="center"><strong>Plans</strong></p>
<div align="center">
<video src="https://github.com/user-attachments/assets/2ac79454-19d2-4385-801d-2077503097ff" width="500" controls></video>
</div>

<p align="center"><strong>Firebase Database</strong></p>
<div align="center">
<video src="https://github.com/user-attachments/assets/1bddd0ab-3a58-4c90-9403-e3569a8b699c" width="500" controls></video>
</div>

<p align="center"> </p>
<p align="center"> 🌾 Built for Kenyan farmers. Powered by WeatherAI. </p>
<br/>
<p align="center"> </p>


## 📹 Demo
First, see it in action:
1. Sign in via Clerk
2. Enter your farm name and select a Kenya county (lat/lon auto‑populates)
3. Click Analyze Farm — weather, risk scores, and AI summary load instantly
4. Select your crop to get tailored field recommendations
5. Upload a field photo to run satellite tree analysis
6. Upgrade to Pro or Scale via M‑Pesa STK Push


## ⭐ Outstanding Features
The outstanding features for this app, include:
- AI‑generated weather summaries in Kiswahili + English
- Crop‑specific risk scoring (rain, wind, heat/frost) with urgency levels
- Satellite‑grade tree analysis from field photos
- Growth stage estimation based on planting date
- Real‑time weather alerts via webhook
- M‑Pesa STK Push subscription flow (Pro + Scale plans)
- Instant boot using localStorage + Firestore sync
- 17 supported crops with dynamic recommendations
- Fully client‑rendered Next.js app with server‑side API proxying

       
## 🔍 Project Overview

### 1. Problem
Kenyan farmers often rely on generic forecasts that don’t match their crop or location. FieldCropCast bridges that gap with actionable, crop‑specific intelligence.

### 2. Key Components
- `Next.js 16` frontend with Tailwind CSS
- `Clerk authentication` for secure sign‑in/out
- `Firebase Firestore` for farm profile persistence
- `WeatherAI API` for forecasts, AI summaries, and tree analysis
- `M‑Pesa Daraja API` for subscription payments (STK Push)
- `Self hosted Coolify deployment` with Nixpacks build pack - (Webhook - Auto - CI/CD)


## 🛠️ Getting Started
1. Clone the repo
```
git clone https://github.com/ex-rnd/FieldCropCast.git
cd FieldCropCast
```
2. - Install dependencies
```
npm install
```

3. Environment
- - Create a .env file in the project root with
```
WAI_API_KEY=your_weatherai_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=...
MPESA_CALLBACK_URL=https://your-domain.com/backend/api/mpesa/callback
PORT=3000
```

4. Start ngrok (for M‑Pesa callbacks in dev)
```
ngrok http 3000
```

5. Run the app 
```
npm run dev
```


## ▶️ Usage
1. Start the application:
```
npm start
```
2. Sign in via Clerk
3. Set up your farm profile (name, county, crop, optional details)
4. Click Analyze Farm to fetch live weather and AI summary
5. View crop‑specific risk scores (rain, wind, heat/frost)
6. Upload a photo for tree health analysis
7. Upgrade plan via M‑Pesa STK Push


## 📐 Application Architecture
```
             ┌─────────────────────────┐
             │     Client (Browser)    │
             │  - Farm Setup UI        │
             │  - Crop Selector        │
             │  - Tree Analysis Upload │
             └───────────┬────────────┘
                         │
                         ▼
             ┌─────────────────────────┐
             │   Next.js App Router    │
             │ /app/backend/api/*      │
             │  - Weather Proxy        │
             │  - Tree Analysis Proxy  │
             │  - Alerts Webhook       │
             │  - M-Pesa STK Push      │
             └───────────┬────────────┘
                         │
         ┌───────────────┼────────────────┐
         ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│   WeatherAI API       │       │  M-Pesa Daraja API   │
│ - Forecasts           │       │ - STK Push           │
│ - AI Summaries        │       │ - Query              │
│ - Tree Analysis       │       │ - Callback           │
└──────────────────────┘       └──────────────────────┘
```


## 📊 Operation & Results
- Farmers see real‑time weather conditions and a 7‑day forecast
- Crop‑specific risk scores (urgent / warning / caution / good) update instantly
- AI summaries available in Kiswahili (default) and English
- Tree analysis returns canopy coverage, density, species, and health breakdown
- M‑Pesa STK Push flow confirms subscription upgrades in real time


## 🔮 Future Enhancements
Future enhancements include but are not limited to:
- SMS alerts (Africa’s Talking)
- Offline‑first PWA mode
- County‑level weather heatmaps
- Batch tree analysis
- Historical weather trends
- Multi‑farm support
- AI crop diagnosis


## 🤝 Contributing
- Fork the repository
- Create branches using feature/xyz-description or fix/xyz-description
- Run type checks before PR:
```
npm run typecheck
```
- Submit pull requests with clear descriptions and linked issues

Thank you for exploring this implementation! Feel free to open issues or PRs for enhancements and bug fixes. 🎉

### Thank you for your contributions! 🎉



