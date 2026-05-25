# 🧳 Raahi — AI-Powered Indian Travel Planner

<div align="center">

![Raahi](https://img.shields.io/badge/Raahi-Travel%20Planner-orange?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)

**Plan your perfect Indian trip in seconds with AI-generated itineraries, real costs, and local insights.**

[Live Demo](https://raahiapp.vercel.app) · [Report Bug](https://github.com/yourusername/trip_planner/issues) · [Request Feature](https://github.com/yourusername/trip_planner/issues)

</div>

---

## ✨ Features

- 🤖 **AI Itinerary Generation** — Streaming day-by-day travel plans powered by LLaMA 3.3 70B via Groq
- 💰 **Budget-Aware Planning** — Four tiers: Budget (₹1k–2.5k/day), Mid-range, Premium, and Luxury
- 🚆 **Train Finder** — Discover best trains between any two Indian cities with real fares and schedules
- 💬 **Trip Chat Assistant** — Ask follow-up questions about your itinerary with a context-aware AI chat
- 🗺️ **Multi-Day Itineraries** — Morning, afternoon, and evening activities with meal and stay recommendations
- 💾 **Save & Manage Trips** — Save itineraries to your profile and revisit them anytime
- ⚡ **Smart Caching** — Redis-backed caching (7-day TTL) so repeated queries are instant
- 🔐 **Auth via Clerk** — Secure user authentication out of the box

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework |
| Tailwind CSS | Styling |
| Axios | HTTP client |
| Clerk | Authentication |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| LangChain + Groq | LLM orchestration (LLaMA 3.3 70B) |
| MongoDB + Motor | Database (async) |
| Upstash Redis | Response caching |
| Mangum | AWS Lambda / Vercel adapter |
| SlowAPI | Rate limiting |

### Infrastructure
| Technology | Purpose |
|---|---|
| Vercel | Hosting (frontend + serverless API) |
| MongoDB Atlas | Cloud database |
| Upstash | Serverless Redis |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB Atlas account
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Upstash Redis account (free at [upstash.com](https://upstash.com))
- Clerk account (free at [clerk.com](https://clerk.com))

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/raahi.git
cd raahi
```

### 2. Set up the backend

```bash
cd api
pip install -r requirements.txt
```

Create `api/.env`:

```env
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=your_mongodb_atlas_uri
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

Run the backend locally:

```bash
uvicorn index:app --reload --port 8000
```

### 3. Set up the frontend

```bash
# from project root
npm install
```

Create `.env` in the project root:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key   # optional, for destination images
```

Run the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. API calls to `/api/*` are proxied to `http://localhost:8000` via Vite's dev proxy.

---

## 📁 Project Structure

```
raahi/
├── api/
│   ├── index.py          # FastAPI app — all routes
│   ├── requirements.txt  # Python dependencies
│   ├── Dockerfile        # For local Docker dev
│   └── .env              # Backend secrets (not committed)
├── src/
│   ├── api/
│   │   └── client.js     # Axios client + all API calls
│   ├── components/       # Reusable React components
│   ├── pages/            # Route-level page components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   └── assets/           # Static assets
├── public/
├── vercel.json           # Vercel deployment config
├── vite.config.js        # Vite config with API proxy
├── tailwind.config.js
└── package.json
```

---

## 🌐 Deployment (Vercel)

### Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key for LLM |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_UNSPLASH_ACCESS_KEY` | Unsplash API key (optional) |

> **Note:** `VITE_API_URL` should be left **empty** or not set — the app uses relative paths in production.

### `vercel.json`

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.py", "use": "@vercel/python" },
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "api/index.py" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/generate-itinerary-stream` | Stream AI itinerary generation |
| `POST` | `/api/generate-itinerary` | Generate itinerary (non-streaming) |
| `POST` | `/api/chat` | Trip chat assistant |
| `POST` | `/api/trains` | Find trains between two cities |
| `POST` | `/api/trips` | Save a trip |
| `GET` | `/api/trips/user/{user_id}` | Get all trips for a user |
| `DELETE` | `/api/trips/{trip_id}` | Delete a saved trip |
| `POST` | `/api/clear-cache` | Clear cached itinerary |

Rate limits: 5 req/min on itinerary endpoints, 20 req/min on chat, 10 req/min on trains.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
Made with ❤️ for Indian travellers
</div>
