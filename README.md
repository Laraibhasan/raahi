<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
<div align="center">

# राही · Raahi

### Your AI Travel Companion for Incredible India 🇮🇳

[![Live Demo](https://img.shields.io/badge/Live%20Demo-raahiapp.vercel.app-C4663A?style=for-the-badge)](https://raahiapp.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)

Raahi is a full-stack AI-powered travel itinerary planner built specifically for Indian travellers. Tell Raahi where you want to go — it generates a complete day-by-day itinerary with real hotels, restaurants, transport options, and costs in ₹, all powered by LLMs.

![Raahi Hero](https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=80)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Itinerary Generation** | Streaming day-by-day trip plans using Groq + LangChain |
| 💰 **INR Budget Planning** | Strict budget tiers from ₹1,000/day to luxury ₹20,000+/day |
| 🚂 **Train Route Finder** | AI-suggested trains with class fares and IRCTC booking links |
| 💬 **AI Trip Assistant** | Floating chat to ask anything about your specific trip |
| 🗺️ **Interactive Maps** | Leaflet + OpenStreetMap showing destination and attractions |
| 📸 **Destination Images** | Dynamic Unsplash photos fetched per destination |
| 🌤️ **Best Time Notes** | Season and weather guidance per travel dates |
| 🔖 **Save Trips** | Save itineraries to MongoDB, view in My Trips |
| ↺ **Regenerate** | One-click fresh itinerary with Redis cache clearing |
| ⚡ **Redis Caching** | Instant responses for repeat destinations via Upstash |
| 🔐 **Auth** | Email/password + Google OAuth via Clerk |
| 📱 **PWA** | Installable on Android and iOS |
| 🖨️ **Print/Share** | Print-friendly layout and native share API |
| 🚦 **Rate Limiting** | SlowAPI protection on all AI routes |
| 🐳 **Docker** | Containerised FastAPI backend |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite** — UI framework and build tool
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — animations and transitions
- **React Router** — client-side routing
- **Leaflet + React-Leaflet** — interactive maps
- **Clerk** — authentication (email + Google OAuth)
- **Lucide React** — icons

### Backend
- **FastAPI** — async Python API framework
- **Mangum** — AWS Lambda / Vercel serverless adapter
- **LangChain + Groq** — LLM orchestration (Llama 3.1 8B)
- **Motor** — async MongoDB driver
- **SlowAPI** — rate limiting
- **Upstash Redis** — serverless caching

### Infrastructure
- **MongoDB Atlas** — M0 free tier database
- **Upstash Redis** — HTTP-based Redis (free tier)
- **Vercel** — frontend + serverless backend hosting
- **Clerk** — auth infrastructure
- **Unsplash API** — destination images
- **OpenStreetMap + Nominatim** — maps and geocoding
- **Groq API** — LLM inference (free tier)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                               │
│                                                             │
│   ┌──────────────────┐      ┌──────────────────────────┐   │
│   │  React Frontend  │ ───▶ │  FastAPI Backend          │   │
│   │  (Static/Vite)   │      │  (Serverless /api/*)      │   │
│   └──────────────────┘      └──────────┬─────────────── ┘   │
└─────────────────────────────────────────────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────┐
              │                          │              │
     ┌────────▼──────┐        ┌─────────▼──────┐  ┌───▼────┐
     │ MongoDB Atlas │        │ Upstash Redis  │  │  Groq  │
     │  (trips DB)   │        │  (LLM cache)   │  │  API   │
     └───────────────┘        └────────────────┘  └────────┘
```

---

## 📁 Project Structure

```
raahi/
├── api/                        # FastAPI backend
│   ├── index.py                # All routes, LangChain chains, MongoDB, Redis
│   ├── requirements.txt        # Python dependencies
│   ├── runtime.txt             # Python 3.11 for Vercel
│   └── Dockerfile              # Container config
│
├── src/                        # React frontend
│   ├── pages/
│   │   ├── Home.jsx            # Landing page, destination discovery
│   │   ├── Plan.jsx            # 3-step trip planning form
│   │   ├── Itinerary.jsx       # AI itinerary results + all tabs
│   │   ├── MyTrips.jsx         # Saved trips dashboard
│   │   ├── Login.jsx           # Clerk sign in
│   │   └── Signup.jsx          # Clerk sign up
│   │
│   ├── components/
│   │   ├── Navbar.jsx          # Responsive, scroll-aware navbar
│   │   ├── TripAssistant.jsx   # Floating AI chat bubble
│   │   ├── TrainFinder.jsx     # Train route search
│   │   └── InstallPrompt.jsx   # PWA install banner
│   │
│   ├── api/
│   │   └── client.js           # Axios client + all API functions
│   │
│   └── hooks/
│       └── useDestinationImage.js  # Unsplash image fetching hook
│
├── public/
│   ├── icon-192.png            # PWA icon
│   └── icon-512.png            # PWA icon
│
├── vercel.json                 # Vercel build + routing config
├── vite.config.js              # Vite + PWA plugin config
└── tailwind.config.js          # Custom earthy colour palette
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/raahi.git
cd raahi
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd api
pip install -r requirements.txt
```

### 4. Set up environment variables

Create `.env` in the root:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_UNSPLASH_ACCESS_KEY=...
```

Create `.env` in `api/`:
```env
GROQ_API_KEY=gsk_...
MONGODB_URI=mongodb+srv://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 5. Run the development servers

Terminal 1 — Frontend:
```bash
npm run dev
```

Terminal 2 — Backend:
```bash
cd api
python -m uvicorn index:app --reload
```

Frontend → `http://localhost:5173`
Backend → `http://localhost:8000`
API Docs → `http://localhost:8000/docs`

---

## 🐳 Docker (Backend)

```bash
cd api
docker build -t raahi-api .
docker run -p 8000:8000 --env-file .env raahi-api
```

---

## 🌐 Deployment

Both frontend and backend deploy to **Vercel** from the same repo.

### Environment variables to set in Vercel:

```
GROQ_API_KEY
MONGODB_URI
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
VITE_CLERK_PUBLISHABLE_KEY
VITE_UNSPLASH_ACCESS_KEY
```

Vercel auto-detects Vite and builds the frontend. The `api/` folder is deployed as serverless Python functions.

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/api/health` | Health check + cache status | — |
| `POST` | `/api/generate-itinerary-stream` | Streaming AI itinerary (SSE) | 5/min |
| `POST` | `/api/generate-itinerary` | Non-streaming fallback | 5/min |
| `POST` | `/api/clear-cache` | Clear Redis cache for a trip | — |
| `POST` | `/api/trips` | Save a trip | — |
| `GET` | `/api/trips/user/{user_id}` | Get all trips for a user | — |
| `DELETE` | `/api/trips/{trip_id}` | Delete a trip | — |
| `POST` | `/api/chat` | AI trip assistant chat | 20/min |
| `POST` | `/api/trains` | Find trains between cities | 10/min |

---

## 🎨 Design

Raahi uses a custom **earthy & warm** colour palette inspired by Indian architecture and landscapes:

| Token | Hex | Usage |
|---|---|---|
| Terracotta | `#C4663A` | Primary actions, highlights |
| Deep Brown | `#2C1810` | Dark sections, hero backgrounds |
| Warm Brown | `#8B5E3C` | Secondary text |
| Cream | `#FAFAF8` | Page background |
| Saffron Light | `#E8A87C` | Accent on dark backgrounds |

---

## 📦 Free Tier Usage

| Service | Free Limit | Usage |
|---|---|---|
| Groq API | 14,400 req/day | LLM inference |
| MongoDB Atlas | 512 MB | Trip storage |
| Upstash Redis | 10,000 req/day | Response caching |
| Vercel | 100 GB bandwidth | Hosting |
| Clerk | 10,000 MAU | Authentication |
| Unsplash | 50 req/hr (dev) | Destination images |
| OpenStreetMap | Unlimited | Maps + geocoding |

**Total monthly cost: ₹0**

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) — blazing fast LLM inference
- [LangChain](https://langchain.com) — LLM orchestration
- [Clerk](https://clerk.com) — authentication
- [Upstash](https://upstash.com) — serverless Redis
- [Unsplash](https://unsplash.com) — beautiful photography
- [OpenStreetMap](https://openstreetmap.org) — free maps

---

<div align="center">
  <p>Built with ❤️ for Indian travellers</p>
  <p><strong>राही</strong> — traveller in Hindi</p>
</div>
>>>>>>> 3bf4f07e48ec67391d30a093f03a11f87cc5d561
