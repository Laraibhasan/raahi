import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Train, MapPin, Clock, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { findTrains } from '../api/client'

const CLASS_COLORS = {
  SL:  { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  '3A':{ bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  '2A':{ bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  '1A':{ bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF' },
  CC:  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  EC:  { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
}

const MAJOR_CITIES = [
  'New Delhi', 'Mumbai', 'Bangalore', 'Chennai',
  'Kolkata', 'Hyderabad', 'Ahmedabad', 'Pune', 'Lucknow',
]

function TrainCard({ train }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-[#F0E6DC] shadow-sm overflow-hidden">
      <div className="p-4">

        {/* Name + number + popularity */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-bold text-[#2C1810] text-sm">{train.name}</span>
              <span className="text-xs text-[#8B5E3C] bg-[#F0E6DC] px-2 py-0.5 rounded-full font-mono">
                #{train.number}
              </span>
            </div>
            <div className="text-xs text-[#8B5E3C]">Runs: {train.runs_on}</div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
            train.popularity === 'Very Popular'
              ? 'bg-red-50 text-red-600'
              : 'bg-green-50 text-green-600'
          }`}>
            {train.popularity}
          </span>
        </div>

        {/* Timing bar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-[#2C1810]">{train.departure}</div>
            <div className="text-xs text-[#8B5E3C]">Departs</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1 text-xs text-[#8B5E3C]">
              <Clock size={10} />
              <span>{train.duration}</span>
            </div>
            <div className="w-full h-px bg-gradient-to-r from-[#C4663A] to-[#E8A87C] relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#C4663A]" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#2C1810]">{train.arrival}</div>
            <div className="text-xs text-[#8B5E3C]">Arrives</div>
          </div>
        </div>

        {/* Class badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {train.classes?.map((cls) => {
            const style = CLASS_COLORS[cls.type] || CLASS_COLORS['3A']
            return (
              <span
                key={cls.type}
                style={{
                  background:   style.bg,
                  color:        style.text,
                  borderColor:  style.border,
                  borderWidth:  1,
                  borderStyle: 'solid',
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
              >
                {cls.type} · ₹{cls.fare_inr?.toLocaleString('en-IN')}
              </span>
            )
          })}
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-[#8B5E3C] hover:text-[#C4663A] transition-colors font-medium"
          >
            {expanded
              ? <><ChevronUp size={13} /> Hide tip</>
              : <><ChevronDown size={13} /> Show tip</>
            }
          </button>

          <a
            href="https://www.irctc.co.in/nget/train-search"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#C4663A] hover:bg-[#A85530] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all active:scale-95"
          >
            Book on IRCTC <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Expandable tip */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="bg-[#FFF8F0] border border-[#F0E6DC] rounded-xl px-3 py-2 text-xs text-[#8B5E3C]">
                💡 {train.tip}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TrainFinder({ destination }) {
  const [origin,  setOrigin]  = useState('')
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const handleSearch = async () => {
    if (!origin.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await findTrains(origin.trim(), destination)
      setResult(res)
    } catch {
      setError('Could not fetch train routes. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const trains    = result?.data?.trains    || []
  const tips      = result?.data?.journey_tips || []
  const distKm    = result?.data?.distance_km
  const fromCache = result?.from_cache
  const disclaimer= result?.data?.disclaimer

  return (
    <div className="bg-white rounded-2xl border border-[#F0E6DC] shadow-sm p-5">

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Train size={16} className="text-[#C4663A]" />
        <span className="font-bold text-[#2C1810] text-sm">
          Find Trains to {destination}
        </span>
      </div>

      {/* Origin input */}
      <div className="mb-3">
        <label className="text-xs text-[#8B5E3C] font-semibold mb-1.5 block">
          Your departure city
        </label>
        <div className="flex flex-col min-[400px]:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 border-2 border-[#F0E6DC] focus-within:border-[#C4663A] rounded-xl px-3 py-2.5 transition-colors">
            <MapPin size={14} className="text-[#C4663A] shrink-0" />
            <input
              type="text"
              placeholder="e.g. Delhi, Mumbai, Bangalore..."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 outline-none text-[#3D2314] text-sm bg-transparent placeholder-[#8B5E3C]/40"
            />
          </div>
            <button
              onClick={handleSearch}
              disabled={!origin.trim() || loading}
              className="bg-[#C4663A] hover:bg-[#A85530] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 w-full min-[400px]:w-auto"
            >
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : <Train size={14} />
            }
            <span>{loading ? 'Finding...' : 'Find'}</span>
          </button>
        </div>
      </div>

      {/* Quick city chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {MAJOR_CITIES
          .filter((c) => c.toLowerCase() !== destination?.toLowerCase())
          .slice(0, 6)
          .map((city) => (
            <button
              key={city}
              onClick={() => setOrigin(city)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all font-medium ${
                origin === city
                  ? 'bg-[#C4663A] text-white border-[#C4663A]'
                  : 'bg-[#F0E6DC] text-[#8B5E3C] border-[#F0E6DC] hover:border-[#C4663A]'
              }`}
            >
              {city}
            </button>
          ))
        }
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-xs text-center py-2">{error}</p>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Meta row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#8B5E3C] font-medium">
              {trains.length} trains found
              {distKm ? ` · ~${distKm} km` : ''}
            </span>
            {fromCache && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                ⚡ Cached
              </span>
            )}
          </div>

          {/* Train cards */}
          <div className="space-y-3 mb-4">
            {trains.map((train, i) => (
              <TrainCard key={i} train={train} />
            ))}
          </div>

          {/* Journey tips */}
          {tips.length > 0 && (
            <div className="bg-[#FFF8F0] rounded-xl p-3 mb-3">
              <div className="text-xs font-bold text-[#2C1810] mb-2">🚂 Booking Tips</div>
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-2 text-xs text-[#8B5E3C] mb-1 last:mb-0">
                  <span className="text-[#C4663A] shrink-0">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          {disclaimer && (
            <p className="text-xs text-[#8B5E3C]/60 text-center italic">
              {disclaimer}
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}
