import { useState, useEffect } from 'react'

const cache = {}
const FALLBACK = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80'

export function useDestinationImage(destination) {
  const [url, setUrl] = useState(FALLBACK)

  useEffect(() => {
    if (!destination) return

    const key = destination.toLowerCase().trim()
    if (cache[key]) { setUrl(cache[key]); return }

    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY

    if (!accessKey) {
      console.warn('VITE_UNSPLASH_ACCESS_KEY is missing from .env')
      return
    }

    fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destination + ' india travel')}&per_page=1&orientation=landscape&client_id=${accessKey}`
    )
      .then(r => r.json())
      .then(data => {
        const imgUrl = data?.results?.[0]?.urls?.regular
        if (imgUrl) {
          cache[key] = imgUrl
          setUrl(imgUrl)
        } else {
          console.warn('No Unsplash result for:', destination, data)
        }
      })
      .catch(err => console.error('Unsplash fetch failed:', err))
  }, [destination])

  return url
}