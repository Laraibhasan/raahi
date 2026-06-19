import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Calendar, Users, Trash2,
  ArrowRight, Loader2, Inbox
} from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import { getUserTrips, deleteTrip } from '../api/client'
import { useDestinationImage } from '../hooks/useDestinationImage'
import toast from 'react-hot-toast'

function TripCard({ trip, onDelete, onView, deleting, formatDate, tripTypeEmoji }) {
  const imageUrl = useDestinationImage(trip.destination)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-[#F0E6DC] shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={imageUrl}
          alt={trip.destination}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <button
          onClick={() => onDelete(trip._id)}
          disabled={deleting === trip._id}
          className="absolute top-3 right-3 w-8 h-8 bg-black/35 hover:bg-red-500/80 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          {deleting === trip._id
            ? <Loader2 size={13} className="text-white animate-spin" />
            : <Trash2 size={13} className="text-white" />}
        </button>
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MapPin size={12} className="text-[#E8A87C]" />
            <span className="text-white font-bold text-base">{trip.destination}</span>
          </div>
          <div className="flex items-center gap-1 text-white/60 text-xs">
            <Calendar size={10} />
            <span>{trip.form?.startDate} → {trip.form?.endDate}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-[#8B5E3C] bg-[#F0E6DC] px-3 py-1.5 rounded-full font-medium">
            <Users size={11} />
            {trip.form?.travellers} {tripTypeEmoji[trip.form?.tripType] || ''} {trip.form?.tripType}
          </span>
          <span className="text-xs text-[#8B5E3C] bg-[#F0E6DC] px-3 py-1.5 rounded-full font-medium capitalize">
            {trip.form?.budget} budget
          </span>
        </div>

        {trip.itinerary?.budget_breakdown && (
          <div className="bg-gradient-to-r from-[#FFF0E6] to-[#FFF8F3] rounded-2xl px-4 py-3 mb-4 flex items-center justify-between border border-[#F0E6DC]">
            <div>
              <div className="text-xs text-[#8B5E3C] mb-0.5">Per person</div>
              <div className="text-lg font-bold text-[#C4663A]">
                ₹{trip.itinerary.budget_breakdown.total_per_person?.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#8B5E3C] mb-0.5">Grand total</div>
              <div className="text-sm font-bold text-[#3D2314]">
                ₹{trip.itinerary.budget_breakdown.grand_total?.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#8B5E3C]">Saved {formatDate(trip.created_at)}</span>
          <button
            onClick={() => onView(trip)}
            className="flex items-center gap-1.5 bg-[#C4663A] hover:bg-[#A85530] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all active:scale-95"
          >
            View Itinerary <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function MyTrips() {
  const navigate              = useNavigate()
  const { user, isLoaded }    = useUser()
  const [trips,    setTrips]  = useState([])
  const [loading,  setLoading]= useState(true)
  const [deleting, setDeleting] = useState(null)

  const tripTypeEmoji = { solo: '🧳', couple: '💑', family: '👨‍👩‍👧', friends: '👯' }

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })

  // fetch as soon as Clerk has loaded the user
    useEffect(() => {
      if (!isLoaded) return
      if (!user?.id) { setLoading(false); return }

      console.log('Fetching trips for user ID:', user.id)  // ← add this

      getUserTrips(user.id)
        .then(res => {
          console.log('Trips response:', res)              // ← add this
          setTrips(res.data.data || res.data)
        })
        .catch((err) => {
          console.error('Fetch error:', err)               // ← add this
          toast.error('Could not load trips')
        })
        .finally(() => setLoading(false))
    }, [isLoaded, user?.id])

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteTrip(id)
      setTrips(t => t.filter(x => x._id !== id))
      toast.success('Trip deleted')
    } catch {
      toast.error('Could not delete')
    } finally {
      setDeleting(null)
    }
  }

  const handleView = (trip) =>
    navigate('/itinerary', {
      state: { form: trip.form, savedItinerary: trip.itinerary }
    })

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-20">

      {/* Header */}
      <div className="bg-[#2C1810] pt-10 pb-20 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#E8A87C] text-xs tracking-[0.3em] uppercase mb-3">Your journeys</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Trips</h1>
          {user && (
            <p className="text-white/50 text-sm">
              Saved trips for <span className="text-[#E8A87C] font-medium">{user.firstName}</span>
            </p>
          )}
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-10 pb-16">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#C4663A]" size={32} />
            <p className="text-[#8B5E3C] text-sm">Loading your trips...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-[#FFF0E6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox size={32} className="text-[#E8D5C4]" />
            </div>
            <h3 className="text-[#2C1810] font-bold text-lg mb-2">No trips yet</h3>
            <p className="text-[#8B5E3C] text-sm mb-6 max-w-xs mx-auto">
              Generate an itinerary and tap "Save Trip" to see it here.
            </p>
            <button
              onClick={() => navigate('/plan')}
              className="bg-[#C4663A] text-white px-7 py-3 rounded-full text-sm font-semibold hover:bg-[#A85530] transition-colors"
            >
              Plan your first trip
            </button>
          </motion.div>
        )}

        {/* Stats bar */}
        {!loading && trips.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-[#2C1810] font-semibold">
              {trips.length} saved trip{trips.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={() => navigate('/plan')}
              className="flex items-center gap-1.5 text-[#C4663A] text-sm font-semibold hover:gap-2.5 transition-all"
            >
              Plan new trip <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trips.map((trip) => (
            <TripCard
              key={trip._id}
              trip={trip}
              onDelete={handleDelete}
              onView={handleView}
              deleting={deleting}
              formatDate={formatDate}
              tripTypeEmoji={tripTypeEmoji}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
