import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { sendChatMessage } from '../api/client'

const SUGGESTIONS = [
  'What should I not miss here?',
  'Best street food to try?',
  'Is it safe for solo travel?',
  'What to do if it rains?',
  'How to get around cheaply?',
  'Best time to visit attractions?',
]

export default function TripAssistant({ tripData, form }) {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const tripContext = {
    destination:  tripData?.destination,
    days:         tripData?.days,
    overview:     tripData?.overview,
    budget_tier:  form?.budget,
  }

  const send = async (text) => {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')

    const updated = [...messages, { role: 'user', content }]
    setMessages(updated)
    setLoading(true)

    try {
      const res = await sendChatMessage(updated, tripContext)
      setMessages(m => [...m, { role: 'assistant', content: res.message }])
    } catch {
      setMessages(m => [...m, {
        role: 'assistant',
        content: "Sorry, I couldn't connect right now. Try again in a moment!"
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="no-print fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#C4663A] hover:bg-[#A85530] text-white rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x"    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} /></motion.div>
            : <motion.div key="chat" initial={{ rotate: 90,  opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><MessageCircle size={22} /></motion.div>
          }
        </AnimatePresence>
      </button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="no-print fixed bottom-24 right-6 z-50 w-[340px] max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-[#F0E6DC] flex flex-col overflow-hidden"
            style={{ height: '480px' }}
          >
            {/* Header */}
            <div className="bg-[#2C1810] px-5 py-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-[#C4663A] rounded-full flex items-center justify-center text-white font-bold text-sm">
                र
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Ask Raahi</div>
                <div className="text-white/50 text-xs">
                  Your {tripData?.destination} travel assistant
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div>
                  <p className="text-[#8B5E3C] text-xs text-center mb-4">
                    Ask me anything about your {tripData?.destination} trip!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="px-3 py-1.5 bg-[#FFF0E6] text-[#C4663A] text-xs rounded-full border border-[#F0E6DC] hover:border-[#C4663A] transition-colors font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#C4663A] text-white rounded-br-sm'
                      : 'bg-[#F0E6DC] text-[#3D2314] rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#F0E6DC] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                        className="w-1.5 h-1.5 bg-[#C4663A] rounded-full"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[#F0E6DC] flex gap-2">
              <input
                type="text"
                placeholder="Ask anything about your trip..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                className="flex-1 bg-[#FAFAF8] border border-[#F0E6DC] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#C4663A] text-[#3D2314] transition-colors"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-[#C4663A] hover:bg-[#A85530] disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0"
              >
                {loading
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Send size={13} />
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}