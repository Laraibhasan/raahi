import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useAuth, useUser, SignOutButton } from '@clerk/clerk-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location  = useLocation()
  const { isSignedIn } = useAuth()
  const { user }       = useUser()

  const isHome = location.pathname === '/'
  const solid  = scrolled || !isHome

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid ? 'bg-[#FFF8F3] shadow-sm border-b border-[#E8D5C4]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-2">
          <span className={`text-2xl font-bold transition-colors ${solid ? 'text-[#C4663A]' : 'text-white'}`}>
            राही
          </span>
          <span className={`text-xs font-semibold tracking-[0.25em] mt-1 transition-colors ${solid ? 'text-[#8B5E3C]' : 'text-white/70'}`}>
            RAAHI
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Explore',     path: '/'      },
            { label: 'Plan a Trip', path: '/plan'  },
            { label: 'My Trips',    path: '/trips' },
          ].map(({ label, path }) => (
            <Link key={label} to={path}
              className={`text-sm font-medium transition-colors ${
                solid ? 'text-[#3D2314] hover:text-[#C4663A]' : 'text-white/85 hover:text-white'
              } ${location.pathname === path ? 'font-bold' : ''}`}>
              {label}
            </Link>
          ))}

          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={user?.imageUrl}
                  alt={user?.firstName}
                  className="w-8 h-8 rounded-full border-2 border-[#F0E6DC] object-cover"
                />
                <span className={`text-sm font-medium ${solid ? 'text-[#3D2314]' : 'text-white'}`}>
                  {user?.firstName}
                </span>
              </div>
              <SignOutButton>
                <button className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  solid
                    ? 'border-[#F0E6DC] text-[#8B5E3C] hover:border-[#C4663A] hover:text-[#C4663A]'
                    : 'border-white/30 text-white/80 hover:bg-white/10'
                }`}>
                  Sign out
                </button>
              </SignOutButton>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"
                className={`text-sm font-medium transition-colors ${solid ? 'text-[#3D2314] hover:text-[#C4663A]' : 'text-white/85 hover:text-white'}`}>
                Sign in
              </Link>
              <Link to="/signup"
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  solid
                    ? 'bg-[#C4663A] text-white hover:bg-[#A85530]'
                    : 'bg-white/20 text-white border border-white/40 hover:bg-white/30'
                }`}>
                Sign up
              </Link>
            </div>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden ${solid ? 'text-[#3D2314]' : 'text-white'}`}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#FFF8F3] border-t border-[#E8D5C4] px-6 py-5 flex flex-col gap-4"
        >
          <Link to="/"      className="text-[#3D2314] font-medium py-1">Explore</Link>
          <Link to="/plan"  className="text-[#3D2314] font-medium py-1">Plan a Trip</Link>
          <Link to="/trips" className="text-[#3D2314] font-medium py-1">My Trips</Link>
          {isSignedIn ? (
            <>
              <div className="flex items-center gap-2 py-1">
                <img src={user?.imageUrl} className="w-7 h-7 rounded-full" />
                <span className="text-[#3D2314] text-sm font-medium">{user?.firstName}</span>
              </div>
              <SignOutButton>
                <button className="text-left text-[#C4663A] font-semibold text-sm">Sign out</button>
              </SignOutButton>
            </>
          ) : (
            <>
              <Link to="/login"  className="text-[#3D2314] font-medium py-1">Sign in</Link>
              <Link to="/signup" className="bg-[#C4663A] text-white px-4 py-3 rounded-full text-center font-semibold text-sm">
                Sign up free
              </Link>
            </>
          )}
        </motion.div>
      )}
    </motion.nav>
  )
}