import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Calendar, Star,
  ArrowRight, Compass, Wallet, Map, Clock
} from 'lucide-react'

const destinations = [
  {
    id: 1,
    name: 'Jaipur',
    state: 'Rajasthan',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1000',
    tags: ['Heritage', 'Culture', 'Food'],
    bestTime: 'Oct – Mar',
    budget: '₹2,500 – ₹6,000',
    rating: 4.8,
    desc: 'The Pink City — palaces, forts and royal cuisine',
  },
  {
    id: 2,
    name: 'Kerala Backwaters',
    state: 'Kerala',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80',
    tags: ['Nature', 'Houseboat', 'Relaxation'],
    bestTime: 'Sep – Mar',
    budget: '₹3,000 – ₹8,000',
    rating: 4.9,
    desc: 'Serene backwaters, houseboat stays and coconut shores',
  },
  {
    id: 3,
    name: 'Goa',
    state: 'Goa',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80',
    tags: ['Beach', 'Nightlife', 'Water Sports'],
    bestTime: 'Nov – Feb',
    budget: '₹2,000 – ₹7,000',
    rating: 4.7,
    desc: 'Sun, sand, seafood and a vibe unlike anywhere else',
  },
  {
    id: 4,
    name: 'Manali',
    state: 'Himachal Pradesh',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1000',
    tags: ['Mountains', 'Adventure', 'Snow'],
    bestTime: 'Dec – Feb · Apr – Jun',
    budget: '₹2,000 – ₹5,000',
    rating: 4.8,
    desc: 'Snow-capped peaks, riverside camps and mountain air',
  },
  {
    id: 5,
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800&q=80',
    tags: ['Spiritual', 'Culture', 'Ghats'],
    bestTime: 'Oct – Mar',
    budget: '₹1,500 – ₹4,000',
    rating: 4.6,
    desc: 'The eternal city — Ganga ghats, temples and chai',
  },
  {
    id: 6,
    name: 'Andaman Islands',
    state: 'Andaman & Nicobar',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80',
    tags: ['Beach', 'Diving', 'Island'],
    bestTime: 'Oct – May',
    budget: '₹4,000 – ₹10,000',
    rating: 4.9,
    desc: 'Crystal waters, coral reefs and untouched island life',
  },
]

const categories = ['All', 'Hill Stations', 'Beaches', 'Heritage', 'Wildlife', 'Spiritual', 'Adventure']

const features = [
  { icon: Compass, title: 'AI-Powered Plans',   desc: 'A full day-by-day itinerary built by AI that knows India deeply.' },
  { icon: Wallet,  title: 'Everything in INR',  desc: 'Hotels, trains, food — know the real cost before you go.' },
  { icon: Map,     title: 'Interactive Maps',   desc: 'Every spot on a live map. Explore routes and nearby places.' },
  { icon: Clock,   title: 'Saves Hours',        desc: 'Days of research condensed into 30 seconds.' },
]

export default function Home() {
  const [search, setSearch]               = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const navigate = useNavigate()

  const handleSearch = () => {
    if (search.trim()) navigate(`/plan?destination=${encodeURIComponent(search.trim())}`)
  }

  const filtered = activeCategory === 'All'
  ? destinations
  : destinations.filter(d => d.tags.some(t =>
      t.toLowerCase().includes(activeCategory.toLowerCase()) ||
      activeCategory.toLowerCase().includes(t.toLowerCase())
    ))

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Hero ── */}
      <div className="relative min-h-screen flex flex-col items-center justify-center">

        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1920&q=80')` }}
        />
        {/* Warm overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2C1810]/75 via-[#C4663A]/25 to-[#2C1810]/85" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-white/65 text-xs tracking-[0.35em] uppercase mb-5 font-medium">
              Your AI Travel Companion for India
            </p>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-5">
              Discover
              <span className="text-[#E8A87C]"> Incredible</span>
              <br />India with AI
            </h1>
            <p className="text-white/75 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              Tell Raahi where you want to go. Get stays, food, transport
              and hidden gems — all planned and priced in ₹.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <div className="flex-1 flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-2xl">
              <MapPin className="text-[#C4663A] flex-shrink-0" size={18} />
              <input
                type="text"
                placeholder="Where do you want to go? (e.g. Goa, Manali...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-transparent text-[#3D2314] placeholder-[#8B5E3C]/50 outline-none text-sm font-medium"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-[#C4663A] hover:bg-[#A85530] active:scale-95 text-white px-8 py-4 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-xl flex items-center gap-2 justify-center"
            >
              Plan My Trip <ArrowRight size={16} />
            </button>
          </motion.div>

          {/* Quick picks */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap gap-2 justify-center mt-6"
          >
            {['Rajasthan', 'Goa', 'Kerala', 'Himachal', 'Varanasi', 'Coorg'].map((place) => (
              <button
                key={place}
                onClick={() => navigate(`/plan?destination=${place}`)}
                className="px-4 py-1.5 bg-white/15 hover:bg-white/25 text-white/85 text-xs rounded-full border border-white/25 transition-all backdrop-blur-sm"
              >
                {place}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <div className="w-px h-8 bg-white/30" />
          <p className="text-white/40 text-[10px] tracking-[0.3em]">SCROLL</p>
        </motion.div>
      </div>

      {/* ── Destinations ── */}
      <div className="max-w-6xl mx-auto px-6 py-20">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <p className="text-[#C4663A] text-xs font-bold tracking-[0.2em] uppercase mb-2">
              Hand-picked for you
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2C1810]">
              Popular Destinations
            </h2>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#C4663A] text-white shadow-md'
                    : 'bg-[#F0E6DC] text-[#8B5E3C] hover:bg-[#E8D5C4]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dest, i) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              onClick={() => navigate(`/plan?destination=${dest.name}`)}
              className="group cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#F0E6DC]"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-[#3D2314]">{dest.rating}</span>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1">
                  <MapPin size={11} className="text-white" />
                  <span className="text-white text-xs font-medium">{dest.state}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-[#2C1810] mb-1 group-hover:text-[#C4663A] transition-colors">
                  {dest.name}
                </h3>
                <p className="text-[#8B5E3C] text-sm mb-3 leading-relaxed">{dest.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {dest.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 bg-[#FFF0E6] text-[#C4663A] text-xs rounded-full font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#F0E6DC]">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-[#8B5E3C]">
                      <Calendar size={11} />
                      <span className="text-xs">{dest.bestTime}</span>
                    </div>
                    <span className="text-sm font-bold text-[#3D2314]">
                      {dest.budget}
                      <span className="text-xs font-normal text-[#8B5E3C]"> /day</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[#C4663A] text-sm font-semibold group-hover:gap-2 transition-all">
                    Plan this <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Why Raahi ── */}
      <div className="bg-[#2C1810] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#E8A87C] text-xs font-bold tracking-[0.25em] uppercase mb-3">Why Raahi</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Travel smarter across India</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center hover:bg-white/8 transition-colors"
              >
                <div className="w-12 h-12 bg-[#C4663A]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <f.icon size={20} className="text-[#E8A87C]" />
                </div>
                <h3 className="text-white font-semibold mb-2 text-sm">{f.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-[#1A0F0A] py-8 text-center">
        <span className="text-[#C4663A] font-bold text-xl">राही</span>
        <p className="text-white/30 text-xs mt-2 tracking-wide">
          Your AI travel companion for Incredible India 🇮🇳
        </p>
      </footer>

    </div>
  )
}