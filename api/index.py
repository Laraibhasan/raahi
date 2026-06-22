from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from mangum import Mangum
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from bson import ObjectId
import os, json, datetime, hashlib
import certifi

load_dotenv()

# ── Rate limiter ──
limiter = Limiter(key_func=get_remote_address)
app     = FastAPI(title="Raahi API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "https://raahiapp.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── MongoDB — lazy init (works in serverless) ──
_mongo_client = None
_db           = None

def get_db():
    global _mongo_client, _db
    if _db is None:
        uri = os.getenv("MONGODB_URI")
        if uri:
            _mongo_client = AsyncIOMotorClient(
                uri,
                tlsCAFile=certifi.where(),
                tlsInsecure=True,
                serverSelectionTimeoutMS=5000,
            )
            _db = _mongo_client.raahi
    return _db

# ── Redis ──
def get_redis():
    try:
        from upstash_redis import Redis
        return Redis(
            url=os.getenv("UPSTASH_REDIS_REST_URL"),
            token=os.getenv("UPSTASH_REDIS_REST_TOKEN"),
        )
    except Exception:
        return None

def make_cache_key(trip) -> str:
    key = f"{trip.destination.lower().strip()}:{trip.days}:{trip.budget}:{trip.tripType}:{','.join(sorted(trip.interests))}"
    return f"itinerary:{hashlib.md5(key.encode()).hexdigest()}"

# ── Constants ──
BUDGET_MAP = {
    "budget": """STRICT BUDGET TIER — ₹800–₹1,800/day per person total.
        Accommodation: ₹200–₹500/night (dormitories, dharamshalas, basic OYO rooms).
        Meals: ₹40–₹120/meal (street food, dhabas, local thali only).
        Transport: state buses, shared autos, local trains only. Zero private taxis.
        Sightseeing: only free or under ₹80 entry fees.
        Every cost_inr field must reflect this. Keep daily_cost_estimate under ₹1,800.""",

    "mid": """MID-RANGE TIER — ₹1,800–₹4,500/day per person total.
        Accommodation: ₹800–₹2,000/night (budget hotels, clean guesthouses).
        Meals: ₹150–₹450/meal (sit-down restaurants, not fine dining).
        Transport: Ola/Uber, AC state buses, sleeper class trains.
        Sightseeing: standard entry fees ₹80–₹300.
        Keep daily_cost_estimate between ₹1,800 and ₹4,500.""",

    "premium": """PREMIUM TIER — ₹4,500–₹10,000/day per person total.
        Accommodation: ₹2,500–₹6,000/night (3-4 star hotels, boutique stays).
        Meals: ₹500–₹1,500/meal (good restaurants, some fine dining).
        Transport: private cabs, AC trains, occasional short flights.
        Sightseeing: guided tours ₹300–₹1,500.""",

    "luxury": """LUXURY TIER — ₹10,000+/day per person total.
        Accommodation: ₹7,000–₹40,000/night (5-star, palace hotels like Taj/Oberoi).
        Meals: ₹1,500–₹4,000/meal (fine dining, chef's table).
        Transport: private chauffeur, business class, helicopter transfers.
        Sightseeing: private guided tours, exclusive access.""",
}

PROMPT = """
You are Raahi, an expert Indian travel planner with deep local knowledge of every
state, city and hidden gem in India. Be specific — mention real place names,
real restaurants, real hotels.

CRITICAL BUDGET RULE: You MUST strictly follow the budget tier. Every single
cost_inr value, daily_cost_estimate, and budget_breakdown number must stay
within the specified range. Be realistic about Indian travel costs.

Trip details:
- Destination: {destination}
- Duration: {days} days ({startDate} to {endDate})
- Travellers: {travellers} people
- Budget tier: {budget}
- Interests: {interests}

BUDGET CALCULATION RULES — follow exactly:
- total_per_person = sum of all daily_cost_estimates across all days
- grand_total = total_per_person × {travellers} (multiply by number of travellers)
- For budget trips, total_per_person should be under ₹1,800 × {days}
- For mid trips, total_per_person should be under ₹4,500 × {days}
- Double-check your maths before returning.

Return ONLY a raw JSON object — no markdown, no backticks, no extra text. Schema:

{{
  "destination": "string",
  "days": {days},
  "overview": "2-3 engaging lines about this trip",
  "best_time_note": "weather and season note for these travel dates",
  "highlights": ["top thing 1", "top thing 2", "top thing 3"],
  "itinerary": [
    {{
      "day": 1,
      "title": "Arrival & First Impressions",
      "morning":   {{ "activity": "", "place": "", "description": "", "duration": "", "cost_inr": 0, "tip": "" }},
      "afternoon": {{ "activity": "", "place": "", "description": "", "duration": "", "cost_inr": 0, "tip": "" }},
      "evening":   {{ "activity": "", "place": "", "description": "", "duration": "", "cost_inr": 0, "tip": "" }},
      "meals": {{
        "breakfast": "what and where, ~₹X/person",
        "lunch":     "what and where, ~₹X/person",
        "dinner":    "what and where, ~₹X/person"
      }},
      "stay": {{
        "budget_option":  "name, ~₹X/night",
        "mid_option":     "name, ~₹X/night",
        "premium_option": "name, ~₹X/night"
      }},
      "daily_cost_estimate": 1500
    }}
  ],
  "budget_breakdown": {{
    "accommodation": 3000,
    "food":          2000,
    "local_transport": 800,
    "sightseeing":   1200,
    "shopping_misc": 500,
    "total_per_person": 7500,
    "grand_total":   22500
  }},
  "transport": {{
    "how_to_reach": "best way from major cities like Delhi/Mumbai",
    "local_transport": "how to get around once there",
    "useful_apps": ["Ola", "IRCTC", "RedBus"]
  }},
  "packing_tips": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "emergency": {{
    "tourist_helpline": "1800-111-363",
    "police": "100",
    "ambulance": "108"
  }}
}}
"""

TRAIN_PROMPT = """
You are an expert on Indian Railways with knowledge of all major train routes.
List the best trains from {origin} to {destination}.

Return ONLY raw JSON, no markdown, no backticks:
{{
  "origin":      "{origin}",
  "destination": "{destination}",
  "trains": [
    {{
      "name":       "train name",
      "number":     "train number",
      "departure":  "HH:MM",
      "arrival":    "HH:MM (next day if applicable, e.g. 06:30+1)",
      "duration":   "Xh Ym",
      "runs_on":    "Daily OR Mon/Wed/Fri etc",
      "classes": [
        {{"type": "SL",  "fare_inr": 400}},
        {{"type": "3A",  "fare_inr": 1100}},
        {{"type": "2A",  "fare_inr": 1600}},
        {{"type": "1A",  "fare_inr": 2800}}
      ],
      "popularity": "Very Popular",
      "tip": "one practical booking or travel tip for this train"
    }}
  ],
  "distance_km": 500,
  "journey_tips": [
    "Book at least 60 days in advance on IRCTC",
    "Tatkal quota opens 1 day before departure"
  ],
  "disclaimer": "Fares and schedules are approximate. Always verify on IRCTC before booking."
}}

List 3-5 best trains on this route. Use real train names and numbers.
Only include classes that actually exist on each train.
"""

# ── Pydantic Models ──
class TripRequest(BaseModel):
    destination: str
    startDate:   str
    endDate:     str
    travellers:  int
    tripType:    str=""
    budget:      str
    interests:   List[str]
    days:        int

class SaveTripRequest(BaseModel):
    user_id:     str
    destination: str
    form:        dict
    itinerary:   dict

class ChatMessage(BaseModel):
    role:    str
    content: str

class ChatRequest(BaseModel):
    messages:     List[ChatMessage]
    trip_context: dict

class TrainRequest(BaseModel):
    origin:      str
    destination: str

# ══════════════════════════════════════
# ROUTES
# ══════════════════════════════════════

@app.get("/api/health")
async def health():
    redis = get_redis()
    db    = get_db()
    return {
        "status":   "ok",
        "message":  "Raahi API running 🇮🇳",
        "cache":    "connected" if redis else "unavailable",
        "database": "connected" if db else "unavailable",
    }

# ── Streaming itinerary ──
@app.post("/api/generate-itinerary-stream")
@limiter.limit("5/minute")
async def generate_itinerary_stream(request: Request, trip: TripRequest):
    redis     = get_redis()
    cache_key = make_cache_key(trip)

    if redis:
        try:
            cached = redis.get(cache_key)
            if cached:
                print(f"✅ Stream cache HIT: {cache_key}")
                async def stream_cached():
                    yield f"data: {cached}\n\n"
                    yield "data: [DONE]\n\n"
                return StreamingResponse(
                    stream_cached(),
                    media_type="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-From-Cache": "true"},
                )
        except Exception as e:
            print(f"⚠️  Redis read error: {e}")

    async def generate():
        try:
            from langchain_groq import ChatGroq
            from langchain_core.prompts import ChatPromptTemplate

            llm   = ChatGroq(
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=4096,
                api_key=os.getenv("GROQ_API_KEY"),
                streaming=True,
            )
            chain = ChatPromptTemplate.from_template(PROMPT) | llm
            full_response = ""

            async for chunk in chain.astream({
                "destination": trip.destination,
                "days":        trip.days,
                "startDate":   trip.startDate,
                "endDate":     trip.endDate,
                "travellers":  trip.travellers,
                "tripType":    trip.tripType,
                "budget":      BUDGET_MAP.get(trip.budget, trip.budget),
                "interests":   ", ".join(trip.interests),
            }):
                text = chunk.content if hasattr(chunk, "content") else str(chunk)
                if text:
                    full_response += text
                    yield f"data: {json.dumps({'chunk': text})}\n\n"

            raw = full_response.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"): raw = raw[4:]
            raw   = raw.strip()
            start = raw.find("{"); end = raw.rfind("}")
            if start != -1 and end != -1: raw = raw[start:end+1]

            try:
                result = json.loads(raw)
            except json.JSONDecodeError:
                from json_repair import repair_json
                result = json.loads(repair_json(raw))
            
            # Force correct grand_total regardless of what AI calculated
            if 'budget_breakdown' in result:
                result['budget_breakdown']['grand_total'] = (
                    result['budget_breakdown'].get('total_per_person', 0) * trip.travellers
                )

            if redis:
                try:
                    redis.setex(cache_key, 604800, json.dumps(result))
                    print(f"✅ Cached streamed result: {cache_key}")
                except Exception as e:
                    print(f"⚠️  Redis write error: {e}")

            yield f"data: {json.dumps({'final': result})}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            import traceback; traceback.print_exc()
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )

# ── Non-streaming fallback ──
@app.post("/api/generate-itinerary")
@limiter.limit("5/minute")
async def generate_itinerary(request: Request, trip: TripRequest):
    redis     = get_redis()
    cache_key = make_cache_key(trip)

    if redis:
        try:
            cached = redis.get(cache_key)
            if cached:
                print(f"✅ Cache HIT: {cache_key}")
                return {"success": True, "data": json.loads(cached), "from_cache": True}
        except Exception as e:
            print(f"⚠️  Redis read error: {e}")

    try:
        from langchain_groq import ChatGroq
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        llm   = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=4096,
            api_key=os.getenv("GROQ_API_KEY"),
        )
        chain = ChatPromptTemplate.from_template(PROMPT) | llm | StrOutputParser()
        raw   = await chain.ainvoke({
            "destination": trip.destination,
            "days":        trip.days,
            "startDate":   trip.startDate,
            "endDate":     trip.endDate,
            "travellers":  trip.travellers,
            "tripType":    trip.tripType,
            "budget":      BUDGET_MAP.get(trip.budget, trip.budget),
            "interests":   ", ".join(trip.interests),
        })

        raw   = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"): raw = raw[4:]
        raw   = raw.strip()
        start = raw.find("{"); end = raw.rfind("}")
        if start != -1 and end != -1: raw = raw[start:end+1]

        result = json.loads(raw)

        # Force correct grand_total regardless of what AI calculated
        if 'budget_breakdown' in result:
            result['budget_breakdown']['grand_total'] = (
                result['budget_breakdown'].get('total_per_person', 0) * trip.travellers
            )

        if redis:
            try:
                redis.setex(cache_key, 604800, json.dumps(result))
            except Exception as e:
                print(f"⚠️  Redis write error: {e}")

        return {"success": True, "data": result, "from_cache": False}

    except json.JSONDecodeError as e:
        try:
            from json_repair import repair_json
            return {"success": True, "data": json.loads(repair_json(raw)), "from_cache": False}
        except Exception:
            import traceback; traceback.print_exc()
            raise HTTPException(500, f"AI returned invalid JSON: {e}")
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(500, str(e))

# ── Trips ──
@app.post("/api/trips")
async def save_trip(data: SaveTripRequest):
    db = get_db()
    if db is None:
        raise HTTPException(500, "Database not connected")
    doc = {
        "user_id":     data.user_id,
        "destination": data.destination,
        "form":        data.form,
        "itinerary":   data.itinerary,
        "created_at":  datetime.datetime.utcnow(),
    }
    result = await db.trips.insert_one(doc)
    return {"success": True, "trip_id": str(result.inserted_id)}

@app.get("/api/trips/user/{user_id}")
async def get_user_trips(user_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(500, "Database not connected")
    cursor = db.trips.find({"user_id": user_id}).sort("created_at", -1)
    trips  = await cursor.to_list(50)
    for t in trips:
        t["_id"]        = str(t["_id"])
        t["created_at"] = t["created_at"].isoformat()
    return {"success": True, "data": trips}

@app.delete("/api/trips/{trip_id}")
async def delete_trip(trip_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(500, "Database not connected")
    await db.trips.delete_one({"_id": ObjectId(trip_id)})
    return {"success": True}

# ── Cache clear ──
@app.post("/api/clear-cache")
async def clear_cache(trip: TripRequest):
    redis = get_redis()
    if redis:
        try:
            cache_key = make_cache_key(trip)
            redis.delete(cache_key)
            print(f"🗑️  Cache cleared: {cache_key}")
        except Exception as e:
            print(f"⚠️  Cache clear error: {e}")
    return {"success": True}

# ── AI Chat ──
@app.post("/api/chat")
@limiter.limit("20/minute")
async def trip_chat(request: Request, data: ChatRequest):
    try:
        from langchain_groq import ChatGroq
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

        ctx    = data.trip_context
        system = f"""You are Raahi, a friendly and knowledgeable Indian travel assistant.
You are helping someone plan their trip to {ctx.get('destination', 'India')}.

Their trip:
- Destination: {ctx.get('destination')}
- Duration: {ctx.get('days')} days
- Overview: {ctx.get('overview', '')}
- Budget tier: {ctx.get('budget_tier', 'mid-range')}

Rules:
- Keep replies short and practical (3-5 sentences max)
- Always mention real place names, real restaurants, real costs in ₹
- Be conversational and warm, like a local friend giving advice
- For safety questions be honest but reassuring
- Never make up information — if unsure, say so"""

        llm  = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=400,
            api_key=os.getenv("GROQ_API_KEY"),
        )
        msgs = [SystemMessage(content=system)]
        for m in data.messages:
            msgs.append(
                HumanMessage(content=m.content) if m.role == "user"
                else AIMessage(content=m.content)
            )
        response = await llm.ainvoke(msgs)
        return {"success": True, "message": response.content}

    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(500, str(e))

# ── Train finder ──
@app.post("/api/trains")
@limiter.limit("10/minute")
async def find_trains(request: Request, data: TrainRequest):
    redis     = get_redis()
    cache_key = f"trains:{data.origin.lower().strip()}:{data.destination.lower().strip()}"

    if redis:
        try:
            cached = redis.get(cache_key)
            if cached:
                print(f"✅ Train cache HIT: {cache_key}")
                return {"success": True, "data": json.loads(cached), "from_cache": True}
        except Exception as e:
            print(f"⚠️  Redis read error: {e}")

    try:
        from langchain_groq import ChatGroq
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        llm   = ChatGroq(
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=2000,
            api_key=os.getenv("GROQ_API_KEY"),
        )
        chain = ChatPromptTemplate.from_template(TRAIN_PROMPT) | llm | StrOutputParser()
        raw   = await chain.ainvoke({
            "origin":      data.origin,
            "destination": data.destination,
        })

        raw   = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"): raw = raw[4:]
        raw   = raw.strip()
        start = raw.find("{"); end = raw.rfind("}")
        if start != -1 and end != -1: raw = raw[start:end+1]

        result = json.loads(raw)

        if redis:
            try:
                redis.setex(cache_key, 2592000, json.dumps(result))
            except Exception as e:
                print(f"⚠️  Redis write error: {e}")

        return {"success": True, "data": result, "from_cache": False}

    except json.JSONDecodeError as e:
        try:
            from json_repair import repair_json
            return {"success": True, "data": json.loads(repair_json(raw)), "from_cache": False}
        except Exception:
            import traceback; traceback.print_exc()
            raise HTTPException(500, f"Failed to parse: {e}")
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(500, str(e))

handler = Mangum(app)