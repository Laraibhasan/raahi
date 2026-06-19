import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [show,   setShow]   = useState(false)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      // show the banner after 30 seconds on the page
      setTimeout(() => setShow(true), 30000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setPrompt(null)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          exit={{   y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-24 left-4 right-4 z-40 md:left-auto md:right-6 md:w-80"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#F0E6DC] p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#C4663A] rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0">
              र
            </div>
            <div className="flex-1">
              <div className="font-bold text-[#2C1810] text-sm">Install Raahi</div>
              <div className="text-[#8B5E3C] text-xs mt-0.5">
                Add to home screen for quick access
              </div>
              <button
                onClick={handleInstall}
                className="mt-2 bg-[#C4663A] hover:bg-[#A85530] text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
              >
                Install App
              </button>
            </div>
            <button
              onClick={() => setShow(false)}
              className="text-[#8B5E3C] hover:text-[#3D2314] transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}