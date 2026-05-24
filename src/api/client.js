import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000,
})

export const generateItineraryStream = (formData, onChunk, onComplete, onError) => {
  const days = Math.max(1, Math.round(
    (new Date(formData.endDate) - new Date(formData.startDate)) / 86400000
  ))

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  fetch(`${baseURL}/api/generate-itinerary-stream`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...formData, days }),
  })
    .then(async (res) => {
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

export const generateItinerary = async (formData) => {
  const days = Math.max(1, Math.round(
    (new Date(formData.endDate) - new Date(formData.startDate)) / 86400000
  ))
  const res = await client.post('/api/generate-itinerary', { ...formData, days })
  return res.data
}

export const saveTrip = async (userId, destination, form, itinerary) => {
  const res = await client.post('/api/trips', {
    user_id: userId, destination, form, itinerary
  })
  return res.data
}

export const getUserTrips = async (userId) => {
  const res = await client.get(`/api/trips/user/${encodeURIComponent(userId)}`)
  return res.data
}

export const deleteTrip = async (tripId) => {
  const res = await client.delete(`/api/trips/${tripId}`)
  return res.data
}

export const sendChatMessage = async (messages, tripContext) => {
  const res = await client.post('/api/chat', {
    messages,
    trip_context: tripContext
  })
  return res.data
}

export const findTrains = async (origin, destination) => {
  const res = await client.post('/api/trains', { origin, destination })
  return res.data
}

export const clearItineraryCache = async (tripData) => {
  const res = await client.post('/api/clear-cache', tripData)
  return res.data
}

export default client