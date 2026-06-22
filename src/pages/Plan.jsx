import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Calendar, ArrowRight,
  ArrowLeft, Check
} from 'lucide-react'

const budgets = [
  { id: 'budget',  label: 'Budget',    range: '₹800 – ₹1,800/day',   desc: 'Hostels, street food, buses'      },
  { id: 'mid',     label: 'Mid-Range', range: '₹1,800 – ₹4,500/day', desc: 'Hotels, restaurants, trains'      },
  { id: 'premium', label: 'Premium',   range: '₹4,500 – ₹10,000/day',desc: 'Resorts, fine dining, flights'    },
  { id: 'luxury',  label: 'Luxury',    range: '₹10,000+/day',         desc: 'Heritage hotels, private tours'   },
]

const interests = [
  { id: 'culture',     label: 'Culture & Heritage',   emoji: '🏛️' },
  { id: 'food',        label: 'Food & Street Food',   emoji: '🍛' },
  { id: 'adventure',   label: 'Adventure & Trekking', emoji: '🏔️' },
  { id: 'nature',      label: 'Nature & Wildlife',    emoji: '🌿' },
  { id: 'beaches',     label: 'Beaches & Water',      emoji: '🏖️' },
  { id: 'spiritual',   label: 'Temples & Spiritual',  emoji: '🙏' },
  { id: 'shopping',    label: 'Markets & Shopping',   emoji: '🛍️' },
  { id: 'photography', label: 'Photography',          emoji: '📸' },
  { id: 'nightlife',   label: 'Nightlife & Music',    emoji: '🎵' },
  { id: 'wellness',    label: 'Yoga & Wellness',      emoji: '🧘' },
]

const STEPS = ['Where & When', 'Travellers & Budget', 'Your Interests']

export default function Plan() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const [step, setStep] = useState(0)

  const [form, setForm] = useState({
    destination: searchParams.get('destination') || '',
    startDate:   '',
    endDate:     '',
    travellers:  1,
    budget:      '',
    interests:   [],
  })

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const toggleInterest = (id) =>
    setForm(p => ({
      ...p,
      interests: p.interests.includes(id)
        ? p.interests.filter(i => i !== id)
        : [...p.interests, id],
    }))

  const canProceed =
    step === 0 ? form.destination.trim() && form.startDate && form.endDate :
    step === 1 ? form.budget :
    step === 2 ? form.interests.length > 0 : false

  const days =
    form.startDate && form.endDate
      ? Math.max(1, Math.round(
          (new Date(form.endDate) - new Date(form.startDate)) / 86400000
        ))
      : 0

  const handleGenerate = () => {
    if (canProceed) navigate('/itinerary', { state: { form } })
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-20">

      {/* ── Dark header ── */}
      <div className="bg-[#2C1810] pt-12 pb-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#E8A87C] text-xs tracking-[0.3em] uppercase mb-3">
            Let's plan your trip
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            {form.destination
              ? `Planning your trip to ${form.destination}`
              : 'Where are you headed?'}
          </h1>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step   ? 'bg-[#C4663A] text-white'  :
                    i === step ? 'bg-white text-[#2C1810]'  :
                                 'bg-white/20 text-white/40'
                  }`}>
                    {i < step ? <Check size={13} /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i === step ? 'text-white' : 'text-white/35'}`}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-px mb-5 ${i < step ? 'bg-[#C4663A]' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Form card ── */}
      <div className="max-w-2xl mx-auto px-6 -mt-10 pb-16">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl shadow-xl border border-[#F0E6DC] p-8"
        >

          {/* ── Step 0: Where & When ── */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-[#2C1810] font-semibold mb-2 text-sm">
                  Destination
                </label>
                <div className="flex items-center gap-3 border-2 border-[#F0E6DC] focus-within:border-[#C4663A] rounded-2xl px-4 py-3.5 transition-colors">
                  <MapPin size={17} className="text-[#C4663A] flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Goa, Manali, Jaipur..."
                    value={form.destination}
                    onChange={(e) => update('destination', e.target.value)}
                    className="flex-1 outline-none text-[#3D2314] placeholder-[#8B5E3C]/40 text-sm font-medium bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'startDate', label: 'Start Date', min: new Date().toISOString().split('T')[0] },
                  { key: 'endDate',   label: 'End Date',   min: form.startDate || new Date().toISOString().split('T')[0] },
                ].map(({ key, label, min }) => (
                  <div key={key}>
                    <label className="block text-[#2C1810] font-semibold mb-2 text-sm">{label}</label>
                    <div className="flex items-center gap-2 border-2 border-[#F0E6DC] focus-within:border-[#C4663A] rounded-2xl px-4 py-3.5 transition-colors">
                      <Calendar size={15} className="text-[#C4663A] flex-shrink-0" />
                      <input
                        type="date"
                        min={min}
                        value={form[key]}
                        onChange={(e) => update(key, e.target.value)}
                        className="flex-1 outline-none text-[#3D2314] text-sm bg-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {days > 0 && (
                <div className="bg-[#FFF0E6] rounded-2xl px-5 py-3 flex items-center gap-2">
                  <span className="text-[#C4663A] font-bold text-lg">{days}</span>
                  <span className="text-[#8B5E3C] text-sm font-medium">
                    day{days > 1 ? 's' : ''} trip — perfect!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Travellers & Budget ── */}
          {step === 1 && (
            <div className="space-y-7">

              {/* Traveller count */}
              <div>
                <label className="block text-[#2C1810] font-semibold mb-3 text-sm">
                  Number of Travellers
                </label>
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => update('travellers', Math.max(1, form.travellers - 1))}
                    className="w-10 h-10 rounded-full border-2 border-[#F0E6DC] text-[#C4663A] font-bold text-xl hover:border-[#C4663A] transition-colors flex items-center justify-center"
                  >−</button>
                  <span className="text-3xl font-bold text-[#2C1810] w-6 text-center">
                    {form.travellers}
                  </span>
                  <button
                    onClick={() => update('travellers', Math.min(20, form.travellers + 1))}
                    className="w-10 h-10 rounded-full border-2 border-[#F0E6DC] text-[#C4663A] font-bold text-xl hover:border-[#C4663A] transition-colors flex items-center justify-center"
                  >+</button>
                </div>
                <p className="text-[#8B5E3C] text-xs mt-2">
                  All costs will be shown per person and as grand total for {form.travellers} {form.travellers === 1 ? 'person' : 'people'}.
                </p>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-[#2C1810] font-semibold mb-3 text-sm">Budget Range</label>
                <div className="space-y-2.5">
                  {budgets.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => update('budget', b.id)}
                      className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${
                        form.budget === b.id
                          ? 'border-[#C4663A] bg-[#FFF0E6]'
                          : 'border-[#F0E6DC] hover:border-[#E8D5C4]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-[#2C1810] text-sm">{b.label}</div>
                        <div className="text-[#8B5E3C] text-xs mt-0.5">{b.desc}</div>
                      </div>
                      <span className="text-[#C4663A] font-semibold text-xs text-right shrink-0 ml-2">
                        {b.range}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Interests ── */}
          {step === 2 && (
            <div>
              <p className="text-[#8B5E3C] text-sm mb-5">
                Pick everything that excites you — select as many as you like
              </p>
              <div className="grid grid-cols-2 gap-3">
                {interests.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                      form.interests.includes(item.id)
                        ? 'border-[#C4663A] bg-[#FFF0E6]'
                        : 'border-[#F0E6DC] hover:border-[#E8D5C4]'
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className={`text-xs font-semibold text-left leading-tight ${
                      form.interests.includes(item.id) ? 'text-[#C4663A]' : 'text-[#3D2314]'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[#F0E6DC]">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-2.5 text-[#8B5E3C] font-medium text-sm hover:text-[#C4663A] transition-colors"
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : <div />}

            <button
              onClick={step < STEPS.length - 1 ? () => setStep(s => s + 1) : handleGenerate}
              disabled={!canProceed}
              className={`flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-sm transition-all ${
                canProceed
                  ? 'bg-[#C4663A] text-white hover:bg-[#A85530] shadow-md active:scale-95'
                  : 'bg-[#F0E6DC] text-[#C4AA98] cursor-not-allowed'
              }`}
            >
              {step < STEPS.length - 1
                ? <> Next <ArrowRight size={15} /> </>
                : <> ✨ Generate My Itinerary </>
              }
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  )
}