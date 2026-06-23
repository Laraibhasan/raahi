import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import {
  MapPin, Calendar, Users, Wallet, Sun, Sunset, Moon,
  Train, Utensils, BedDouble, Package, Phone,
  ChevronLeft, ChevronRight, AlertCircle, Loader2,
  Bookmark, Share2, Printer, RefreshCw, Lightbulb,
  Star, Sparkles, Tag, Clock, ShoppingBag
} from 'lucide-react'
import { generateItineraryStream, clearItineraryCache, saveTrip } from '../api/client'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/clerk-react'
import TripAssistant from '../components/TripAssistant'
import TrainFinder from '../components/TrainFinder'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const TABS      = ['Itinerary', 'Budget', 'Transport', 'Map', 'Tips']
const timeBlocks = [
  { key: 'morning',   label: 'Morning',   Icon: Sun,    color: '#F59E0B' },
  { key: 'afternoon', label: 'Afternoon', Icon: Sunset, color: '#C4663A' },
  { key: 'evening',   label: 'Evening',   Icon: Moon,   color: '#6366F1' },
]

// ── Streaming loader ──────────────────────────────────────────────
function StreamingLoader({ destination, rawText }) {
  const lines = rawText.split('\n').filter(Boolean).slice(-6)
  return (
    <div className="min-h-screen bg-[#2C1810] flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="mb-8"
      >
        <div className="w-16 h-16 border-4 border-[#E8A87C]/30 border-t-[#E8A87C] rounded-full" />
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Planning your trip to {destination}
      </h2>
      <p className="text-[#E8A87C] text-sm mb-6">Building your itinerary in real time...</p>

      {/* Live text preview */}
      <div className="w-full max-w-md bg-white/5 rounded-2xl p-4 font-mono text-left overflow-hidden">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i === lines.length - 1 ? 1 : 0.4, x: 0 }}
            className="text-[#E8A87C] text-xs leading-relaxed truncate"
          >
            {line}
          </motion.div>
        ))}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-2 h-3 bg-[#E8A87C] ml-1"
        />
      </div>

      <p className="text-white/30 text-xs mt-6">Usually takes 10–15 seconds</p>
    </div>
  )
}

export default function Itinerary() {
  const location = useLocation()
  const navigate  = useNavigate()
  const form      = location.state?.form
  const { user }  = useUser()

  const [data,          setData]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [rawText,       setRawText]       = useState('')
  const [error,         setError]         = useState(null)
  const [activeTab,     setActiveTab]     = useState('Itinerary')
  const [activeDay,     setActiveDay]     = useState(0)
  const [mapCoords,     setMapCoords]     = useState([20.5937, 78.9629])
  const [isSaved,       setIsSaved]       = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [regenerating,  setRegenerating]  = useState(false)

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await saveTrip(user.id, data.destination, form, data)
      setIsSaved(true)
      setShowSaveModal(false)
      toast.success('Trip saved!')
    } catch {
      toast.error('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = async () => {
    if (!form) return
    setRegenerating(true)
    setData(null)
    setRawText('')
    setLoading(true)
    setActiveDay(0)
    setActiveTab('Itinerary')
    setIsSaved(false)
    try {
      await clearItineraryCache({
        ...form,
        days: Math.max(1, Math.round(
          (new Date(form.endDate) - new Date(form.startDate)) / 86400000
        ))
      })
    } catch {}

    const generateItineraryStream = (formData, onChunk, onComplete, onError) => {
      const days = Math.max(1, Math.round(
        (new Date(formData.endDate) - new Date(formData.startDate)) / 86400000
      ))

      const baseURL = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
        ? import.meta.env.VITE_API_URL
        : import.meta.env.DEV
          ? 'http://localhost:8000'
          : ''

      const attempt = (retryCount = 0) => {
        fetch(`${baseURL}/api/generate-itinerary-stream`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...formData, days }),
        })
          .then(async (res) => {
            if (res.status === 429) {
              if (retryCount < 2) {
                // wait 10 seconds then retry
                setTimeout(() => attempt(retryCount + 1), 10000)
                onChunk('\n[Rate limit hit — retrying in 10 seconds...]')
                return
              } else {
                onError('Rate limit exceeded. Please wait a minute and try again.')
                return
              }
            }

            const reader  = res.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const text  = decoder.decode(value)
              const lines = text.split('\n').filter(l => l.startsWith('data: '))

              for (const line of lines) {
                const raw = line.replace('data: ', '').trim()
                if (raw === '[DONE]') continue

                try {
                  const parsed = JSON.parse(raw)
                  if (parsed.error)  { onError(parsed.error); return }
                  if (parsed.final)  { onComplete(parsed.final); return }
                  if (parsed.chunk)  { onChunk(parsed.chunk) }
                } catch {}
              }
            }
          })
          .catch(onError)
      }

      attempt()
    }
  }

  // Geocode for map
  useEffect(() => {
    if (!form?.destination) return
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.destination + ', India')}&format=json&limit=1`)
      .then(r => r.json())
      .then(d => { if (d[0]) setMapCoords([parseFloat(d[0].lat), parseFloat(d[0].lon)]) })
      .catch(() => {})
  }, [form?.destination])

  // Initial load
  useEffect(() => {
    if (!form) { navigate('/plan'); return }

    // from My Trips — no need to generate
    if (location.state?.savedItinerary) {
      setData(location.state.savedItinerary)
      setLoading(false)
      setIsSaved(true)
      return
    }

    // stream from AI
    generateItineraryStream(
      form,
      (chunk) => setRawText(t => t + chunk),
      (final) => { setData(final); setLoading(false) },
      (err)   => { setError(String(err)); setLoading(false) }
    )
  }, [])

  if (loading) return (
    <StreamingLoader
      destination={form?.destination}
      rawText={rawText}
    />
  )

  if (error) return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-6 text-center pt-20">
      <AlertCircle size={48} className="text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-[#2C1810] mb-2">Something went wrong</h2>
      <p className="text-[#8B5E3C] text-sm mb-6 max-w-md">{error}</p>
      <button onClick={() => navigate('/plan')}
        className="bg-[#C4663A] text-white px-6 py-3 rounded-full font-semibold text-sm">
        ← Try Again
      </button>
    </div>
  )

  const day = data?.itinerary?.[activeDay]

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-16">

      {/* ── Hero ── */}
      <div className="relative px-6 pt-10 pb-8 bg-[#2C1810]">
        <div className="absolute inset-0 bg-[#2C1810]" />
        <div className="relative z-10 max-w-4xl mx-auto">

          {/* top bar */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <button onClick={() => navigate('/plan')}
              className="flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors">
              <ChevronLeft size={16} /> Back to Planning
            </button>

            <div className="flex items-center gap-2 flex-wrap no-print">
              {/* Regenerate */}
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all disabled:opacity-50"
              >
                {regenerating
                  ? <><Loader2 size={14} className="animate-spin" /> Regenerating...</>
                  : <><RefreshCw size={14} /> Regenerate</>
                }
              </button>

              {/* Share */}
              <button
                onClick={async () => {
                  const text = `Check out my ${data?.days}-day trip to ${data?.destination} planned with Raahi!`
                  if (navigator.share) {
                    try { await navigator.share({ title: `Raahi — ${data?.destination}`, text, url: window.location.href }) }
                    catch {}
                  } else {
                    navigator.clipboard.writeText(text)
                    toast.success('Copied to clipboard!')
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all"
              >
                <Share2 size={14} /> Share
              </button>

              {/* Print */}
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all">
                <Printer size={14} /> Print
              </button>

              {/* Save */}
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={isSaved}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isSaved
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-[#C4663A] hover:bg-[#A85530] text-white'
                }`}
              >
                {isSaved ? <><Bookmark size={14} className="fill-green-400" /> Saved</> : <><Bookmark size={14} /> Save</>}
              </button>
            </div>
          </div>

          {/* destination + overview */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-[#E8A87C]" />
              <span className="text-[#E8A87C] text-sm font-medium">{data.destination}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Your Raahi Itinerary
            </h1>
            <p className="text-white/60 text-sm max-w-xl leading-relaxed">{data.overview}</p>
          </div>

          {/* stats */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { icon: Calendar, label: `${data.days} Days`,                                                           sub: `${form.startDate} → ${form.endDate}` },
              { icon: Users, label: `${form.travellers} ${form.travellers === 1 ? 'Person' : 'People'}`, sub: `${form.budget} budget` },
              { icon: Wallet,   label: `₹${data.budget_breakdown?.total_per_person?.toLocaleString('en-IN')}/person`, sub: 'estimated total' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                <Icon size={15} className="text-[#E8A87C]" />
                <div>
                  <div className="text-white text-sm font-semibold">{label}</div>
                  <div className="text-white/45 text-xs capitalize">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* highlights */}
          {data.highlights?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.highlights.map(h => (
                <span key={h} className="flex items-center px-3 py-1 bg-[#C4663A]/25 text-[#E8A87C] text-xs rounded-full border border-[#C4663A]/30">
                  <Star size={9} className="fill-[#E8A87C] text-[#E8A87C] mr-1.5" /> {h}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#F0E6DC] shadow-sm">
        <div className="max-w-4xl mx-auto px-6 flex overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-[#C4663A] text-[#C4663A]'
                  : 'border-transparent text-[#8B5E3C] hover:text-[#3D2314]'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Itinerary tab */}
        {activeTab === 'Itinerary' && (
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {data.itinerary?.map((d, i) => (
                <button key={i} onClick={() => setActiveDay(i)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeDay === i
                      ? 'bg-[#C4663A] text-white shadow-md'
                      : 'bg-white text-[#8B5E3C] border border-[#F0E6DC] hover:border-[#C4663A]'
                  }`}>
                  Day {d.day}
                </button>
              ))}
            </div>

            {day && (
              <motion.div key={activeDay}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}>

                <div className="bg-[#FFF0E6] rounded-2xl px-5 py-3 mb-6 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-lg font-bold text-[#2C1810]">Day {day.day} — {day.title}</h2>
                  <span className="text-[#C4663A] font-semibold text-sm">
                    ~₹{day.daily_cost_estimate?.toLocaleString('en-IN')} per person
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  {timeBlocks.map(({ key, label, Icon, color }) => {
                    const block = day[key]
                    if (!block) return null
                    return (
                      <div key={key} className="bg-white rounded-2xl p-5 border border-[#F0E6DC] shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon size={16} style={{ color }} />
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                        </div>
                        <h3 className="font-bold text-[#2C1810] mb-1">{block.activity}</h3>
                        <div className="flex items-center gap-1 text-[#C4663A] text-xs font-medium mb-2">
                          <MapPin size={11} /> {block.place}
                        </div>
                        <p className="text-[#8B5E3C] text-sm leading-relaxed mb-3">{block.description}</p>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs text-[#8B5E3C] bg-[#F0E6DC] px-3 py-1 rounded-full">
                            <Clock size={11} className="inline mr-1" />{block.duration}
                          </span>
                          <span className="text-xs font-semibold text-[#3D2314]">
                            {block.cost_inr === 0
                            ? <span className="flex items-center gap-1 text-green-600"><Tag size={11} /> Free</span>
                            : `₹${block.cost_inr}`}
                          </span>
                        </div>
                        {block.tip && (
                          <div className="mt-3 bg-[#FFF8F0] border border-[#F0E6DC] rounded-xl px-3 py-2 text-xs text-[#8B5E3C]">
                            <Lightbulb size={12} className="text-[#C4663A] inline mr-1.5" /> {block.tip}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {day.meals && (
                  <div className="bg-white rounded-2xl p-5 border border-[#F0E6DC] shadow-sm mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Utensils size={15} className="text-[#C4663A]" />
                      <span className="font-bold text-[#2C1810] text-sm">What to Eat Today</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        ['Breakfast', Sun,    day.meals.breakfast],
                        ['Lunch',     Sunset, day.meals.lunch    ],
                        ['Dinner',    Moon,   day.meals.dinner   ],
                      ].map(([label, Icon, val]) => (
                        <div key={label} className="flex gap-3 items-start">
                          <div className="flex items-center gap-1 text-[#8B5E3C] w-24 shrink-0">
                            <Icon size={11} />
                            <span className="text-xs font-semibold">{label}</span>
                          </div>
                          <span className="text-[#3D2314] text-xs leading-relaxed">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {day.stay && (
                  <div className="bg-white rounded-2xl p-5 border border-[#F0E6DC] shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <BedDouble size={15} className="text-[#C4663A]" />
                      <span className="font-bold text-[#2C1810] text-sm">Where to Stay</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Budget',    val: day.stay.budget_option,  color: '#10B981', Icon: Wallet     },
                        { label: 'Mid-Range', val: day.stay.mid_option,     color: '#F59E0B', Icon: Star       },
                        { label: 'Premium',   val: day.stay.premium_option, color: '#8B5CF6', Icon: Sparkles   },
                      ].map(({ label, val, color, Icon }) => (
                        <div key={label} className="bg-[#FAFAF8] rounded-xl p-3 border border-[#F0E6DC]">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Icon size={11} style={{ color }} />
                            <span className="text-xs font-bold" style={{ color }}>{label}</span>
                          </div>
                          <div className="text-xs text-[#3D2314] leading-relaxed">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button onClick={() => setActiveDay(d => Math.max(0, d - 1))}
                    disabled={activeDay === 0}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#8B5E3C] hover:text-[#C4663A] disabled:opacity-30 transition-colors">
                    <ChevronLeft size={16} /> Previous Day
                  </button>
                  <button onClick={() => setActiveDay(d => Math.min(data.itinerary.length - 1, d + 1))}
                    disabled={activeDay === data.itinerary.length - 1}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#8B5E3C] hover:text-[#C4663A] disabled:opacity-30 transition-colors">
                    Next Day <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Budget tab */}
        {activeTab === 'Budget' && data.budget_breakdown && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-3xl p-6 border border-[#F0E6DC] shadow-sm mb-4">
              <h2 className="font-bold text-[#2C1810] mb-5 text-lg">Budget Breakdown</h2>
              {[
                { label: 'Accommodation',   key: 'accommodation',   Icon: BedDouble     },
                { label: 'Food & Drinks',   key: 'food',            Icon: Utensils      },
                { label: 'Local Transport', key: 'local_transport', Icon: Train         },
                { label: 'Sightseeing',     key: 'sightseeing',     Icon: MapPin        },
                { label: 'Shopping & Misc', key: 'shopping_misc',   Icon: ShoppingBag   },
              ].map(({ label, key, Icon }) => {
                const amount = data.budget_breakdown[key]
                const pct    = Math.round((amount / data.budget_breakdown.total_per_person) * 100)
                return (
                  <div key={key} className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2 text-[#3D2314] font-medium">
                        <Icon size={13} className="text-[#C4663A]" />
                        {label}
                      </div>
                      <span className="text-[#8B5E3C] font-semibold">
                        ₹{amount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="h-2 bg-[#F0E6DC] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="h-full bg-[#C4663A] rounded-full"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FFF0E6] rounded-2xl p-5 border border-[#F0E6DC] text-center">
                <div className="text-xs text-[#8B5E3C] mb-1">Per Person Total</div>
                <div className="text-2xl font-bold text-[#C4663A]">
                  ₹{data.budget_breakdown.total_per_person?.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-[#2C1810] rounded-2xl p-5 text-center">
                <div className="text-xs text-white/50 mb-1">Grand Total ({form.travellers} people)</div>
                <div className="text-2xl font-bold text-[#E8A87C]">
                  ₹{data.budget_breakdown.grand_total?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Transport tab */}
        {activeTab === 'Transport' && data.transport && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {[
              { icon: Train,  title: 'How to Reach',   body: data.transport.how_to_reach    },
              { icon: MapPin, title: 'Getting Around', body: data.transport.local_transport },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-[#F0E6DC] shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} className="text-[#C4663A]" />
                  <span className="font-bold text-[#2C1810] text-sm">{title}</span>
                </div>
                <p className="text-[#8B5E3C] text-sm leading-relaxed">{body}</p>
              </div>
            ))}

            {/* Train Finder */}
            <TrainFinder destination={data.destination} />

            {data.transport.useful_apps?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-[#F0E6DC] shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Phone size={14} className="text-[#C4663A]" />
                  <span className="font-bold text-[#2C1810] text-sm">Useful Apps</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.transport.useful_apps.map(app => (
                    <span key={app} className="px-3 py-1.5 bg-[#FFF0E6] text-[#C4663A] text-xs font-semibold rounded-full">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.emergency && (
              <div className="bg-white rounded-2xl p-5 border border-[#F0E6DC] shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Phone size={15} className="text-red-400" />
                  <span className="font-bold text-[#2C1810] text-sm">Emergency Numbers</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(data.emergency).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-[#8B5E3C] capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-[#3D2314]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Map tab */}
        {activeTab === 'Map' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="rounded-3xl overflow-hidden border border-[#F0E6DC] shadow-sm" style={{ height: '460px' }}>
              <MapContainer center={mapCoords} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapCoords}>
                  <Popup>
                    <strong>{data.destination}</strong><br />Your trip destination 🇮🇳
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <p className="text-[#8B5E3C] text-xs text-center mt-3">
              Map powered by OpenStreetMap — 100% free & open source
            </p>
          </motion.div>
        )}

        {/* Tips tab */}
        {activeTab === 'Tips' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl p-5 border border-[#F0E6DC] shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sun size={15} className="text-[#C4663A]" />
                <span className="font-bold text-[#2C1810] text-sm">Best Time Note</span>
              </div>
              <p className="text-[#8B5E3C] text-sm leading-relaxed">{data.best_time_note}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#F0E6DC] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Package size={15} className="text-[#C4663A]" />
                <span className="font-bold text-[#2C1810] text-sm">What to Pack</span>
              </div>
              <div className="space-y-2.5">
                {data.packing_tips?.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#FFF0E6] text-[#C4663A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[#3D2314] text-sm leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* AI Assistant */}
      {data && <TripAssistant tripData={data} form={form} />}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-[#2C1810] mb-1">Save this trip?</h3>
            <p className="text-[#8B5E3C] text-sm mb-6">
              This will save your <strong>{data?.destination}</strong> itinerary to My Trips.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowSaveModal(false)}
                className="flex-1 py-3 rounded-2xl border-2 border-[#F0E6DC] text-[#8B5E3C] text-sm font-semibold hover:border-[#C4663A] transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-[#C4663A] text-white text-sm font-semibold hover:bg-[#A85530] disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save Trip'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  )
}