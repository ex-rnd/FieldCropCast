# 🌿 FieldCropCast — Farmer Weather Intelligence Dashboard
A full‑stack Next.js application that helps Kenyan farmers make smarter crop decisions 🌾, powered by WeatherAI APIs, Firebase Firestore, Clerk authentication, and M‑Pesa STK Push for subscriptions.

## ✳️ Visual Overview 

https://github.com/user-attachments/assets/9d1655c0-2943-4ef5-b7f1-169190bd67ca

🌾 Built for Kenyan farmers. Powered by WeatherAI.


## 📹 Demo
First, see it in action:
- 1. Sign in via Clerk
- 2. Enter your farm name and select a Kenya county (lat/lon auto‑populates)
- 3. Click Analyze Farm — weather, risk scores, and AI summary load instantly
- 4. Select your crop to get tailored field recommendations
- 5. Upload a field photo to run satellite tree analysis
- 6. Upgrade to Pro or Scale via M‑Pesa STK Push

       
## 🔍 Project Overview

- 1. Problem
Kenyan farmers often rely on generic forecasts that don’t match their crop or location. FieldCropCast bridges that gap with actionable, crop‑specific intelligence.

- 2. Key Components
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
- 1. Start the application:
```
npm start
```
- 2. Sign in via Clerk
- 3. Set up your farm profile (name, county, crop, optional details)
- 4. Click Analyze Farm to fetch live weather and AI summary
- 5. View crop‑specific risk scores (rain, wind, heat/frost)
- 6. Upload a photo for tree health analysis
- 7. Upgrade plan via M‑Pesa STK Push


## 📐 Application Architecture
```
             ┌─────────────────────┐
             │   Client (Browser)  │
             └──────────┬──────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │   Next.js App Router│
             └──────────┬──────────┘
                        │ Proxy API calls
                        ▼
             ┌─────────────────────┐
             │ WeatherAI API       │
             │ - Forecasts         │
             │ - AI Summaries      │
             │ - Tree Analysis     │
             └─────────────────────┘
                        │
                        ▼
             ┌─────────────────────┐
             │ M-Pesa Daraja API   │
             │ - STK Push          │
             │ - Query & Callback  │
             └─────────────────────┘
```


## 📊 Operation & Results
- Farmers see real‑time weather conditions and a 7‑day forecast
- Crop‑specific risk scores (urgent / warning / caution / good) update instantly
- AI summaries available in Kiswahili (default) and English
- Tree analysis returns canopy coverage, density, species, and health breakdown
- M‑Pesa STK Push flow confirms subscription upgrades in real time

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



