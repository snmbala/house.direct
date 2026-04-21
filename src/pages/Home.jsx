import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ListingsMap from '../components/Map/ListingsMap'
import ListingCard from '../components/Listing/ListingCard'
import ListingDetailPanel from '../components/Listing/ListingDetailPanel'
import { useCity } from '../hooks/useCity.jsx'
import { useFilters } from '../hooks/useFilters.jsx'
import { useKeyboard } from '../hooks/useKeyboard.js'
import SEOMeta from '../components/SEOMeta.jsx'

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

const CITY_ALIASES = {
  'bangalore': 'Bengaluru', 'bengaluru': 'Bengaluru', 'bengalore': 'Bengaluru',
  'mumbai': 'Mumbai', 'bombay': 'Mumbai',
  'delhi': 'Delhi', 'new delhi': 'Delhi',
  'chennai': 'Chennai', 'madras': 'Chennai',
  'hyderabad': 'Hyderabad',
  'pune': 'Pune',
  'kolkata': 'Kolkata', 'calcutta': 'Kolkata',
  'ahmedabad': 'Ahmedabad',
  'jaipur': 'Jaipur',
  'kochi': 'Kochi', 'cochin': 'Kochi',
}

async function detectCity() {
  const cached = sessionStorage.getItem('userLocation')
  if (cached) return JSON.parse(cached)

  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const raw = (data.address?.city || data.address?.town || data.address?.state_district || '').toLowerCase()
          const result = { city: CITY_ALIASES[raw] ?? null, lat: coords.latitude, lng: coords.longitude }
          sessionStorage.setItem('userLocation', JSON.stringify(result))
          resolve(result)
        } catch {
          resolve(null)
        }
      },
      () => resolve(null),
      { timeout: 5000 }
    )
  })
}

export default function Home() {
  const { city, setCity, cityManuallySelected } = useCity()
  const { search, propType, maxRent, nearbyMode, setNearbyMode, radiusKm, userCoords, setUserCoords, locationArea } = useFilters()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedListing, setSelectedListing] = useState(null)
  const [mapOverride, setMapOverride] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    detectCity().then((result) => {
      if (!result) return
      setUserCoords({ lat: result.lat, lng: result.lng })
      setNearbyMode(true)
      if (result.city) setCity(result.city)
    })
  }, [])

  useEffect(() => {
    fetchListings()
  }, [city, propType, maxRent])

  const fetchListings = async () => {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (city !== 'All Cities') query = query.eq('city', city)
    if (propType !== 'All') query = query.eq('property_type', propType.toLowerCase())
    if (maxRent) query = query.lte('rent_amount', parseInt(maxRent))

    const { data } = await query
    setListings(data ?? [])
    setLoading(false)
  }

  const filtered = listings
    .filter(l => {
      const matchesSearch =
        search === '' ||
        l.title?.toLowerCase().includes(search.toLowerCase()) ||
        l.city?.toLowerCase().includes(search.toLowerCase()) ||
        l.address?.toLowerCase().includes(search.toLowerCase())

      const withinRadius =
        !nearbyMode || !userCoords ||
        haversineKm(userCoords.lat, userCoords.lng, l.lat, l.lng) <= radiusKm

      const matchesArea =
        !locationArea ||
        l.city?.toLowerCase().includes(locationArea.toLowerCase()) ||
        l.address?.toLowerCase().includes(locationArea.toLowerCase())

      return matchesSearch && withinRadius && matchesArea
    })
    .map(l => ({
      ...l,
      _distKm: userCoords ? haversineKm(userCoords.lat, userCoords.lng, l.lat, l.lng) : null,
    }))
    .sort((a, b) => {
      if (a._distKm == null || b._distKm == null) return 0
      return a._distKm - b._distKm
    })

  const defaultCenter = cityManuallySelected && city !== 'All Cities'
    ? getCityCenter(city)
    : userCoords
      ? [userCoords.lat, userCoords.lng]
      : [20.5937, 78.9629]

  const defaultZoom = cityManuallySelected && city !== 'All Cities' ? 12 : userCoords ? 13 : 5

  const mapCenter = mapOverride ? mapOverride.center : defaultCenter
  const mapZoom   = mapOverride ? mapOverride.zoom   : defaultZoom

  const selectedIndex = selectedListing ? filtered.findIndex(l => l.id === selectedListing.id) : -1

  const handleSelectListing = (listing) => {
    setSelectedListing(listing)
    setMapOverride({ center: [listing.lat, listing.lng], zoom: 17 })
  }

  const handleCloseDetail = () => {
    setSelectedListing(null)
    setMapOverride(null)
  }

  const handleNext = () => {
    if (selectedIndex < filtered.length - 1) handleSelectListing(filtered[selectedIndex + 1])
  }

  const handlePrev = () => {
    if (selectedIndex > 0) handleSelectListing(filtered[selectedIndex - 1])
  }

  useKeyboard({
    Escape:      () => selectedListing && handleCloseDetail(),
    ArrowRight:  () => selectedListing && handleNext(),
    ArrowLeft:   () => selectedListing && handlePrev(),
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      <SEOMeta
        title={city !== 'All Cities' ? `Rentals in ${city}` : 'Find Rentals Near You'}
        description={`Browse ${filtered.length} rental properties${city !== 'All Cities' ? ` in ${city}` : ' near you'} — apartments, houses, PGs and villas. No broker fees.`}
      />

      {/* Map + Sidebar */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1">
          <ListingsMap listings={filtered} center={mapCenter} zoom={mapZoom} userCoords={userCoords} onSelect={handleSelectListing} hoveredId={hoveredId} />
        </div>

        <div className="w-[540px] shrink-0 bg-white dark:bg-black border-l border-neutral-200 dark:border-neutral-900 flex flex-col overflow-hidden">
          {selectedListing ? (
            <ListingDetailPanel
              key={selectedListing.id}
              listing={selectedListing}
              onClose={handleCloseDetail}
              onNext={handleNext}
              onPrev={handlePrev}
              hasNext={selectedIndex < filtered.length - 1}
              hasPrev={selectedIndex > 0}
              index={selectedIndex}
              total={filtered.length}
            />
          ) : (
            <div className="overflow-y-auto flex-1">
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold text-neutral-950 dark:text-white">
                  {loading ? 'Loading…' : (
                    locationArea
                      ? <>{filtered.length} rental{filtered.length !== 1 ? 's' : ''} in {locationArea}</>
                      : nearbyMode && userCoords
                      ? <>{filtered.length} rental{filtered.length !== 1 ? 's' : ''} within {radiusKm} km</>
                      : <>{filtered.length} rental{filtered.length !== 1 ? 's' : ''} found</>
                  )}
                </p>
              </div>
              <div className="p-3 flex flex-col gap-2.5">
                {loading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-neutral-100 dark:bg-neutral-900 rounded-xl h-56 animate-pulse border border-neutral-200 dark:border-neutral-800" />
                  ))
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 text-neutral-400 dark:text-neutral-600">
                    <p className="text-3xl mb-3">🏠</p>
                    <p className="font-medium text-neutral-600 dark:text-neutral-400 text-sm">No rentals found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  filtered.map(listing => (
                    <ListingCard key={listing.id} listing={listing} distKm={listing._distKm} onSelect={handleSelectListing} onHover={setHoveredId} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getCityCenter(city) {
  const coords = {
    'Mumbai': [19.0760, 72.8777],
    'Delhi': [28.6139, 77.2090],
    'Bengaluru': [12.9716, 77.5946],
    'Chennai': [13.0827, 80.2707],
    'Hyderabad': [17.3850, 78.4867],
    'Pune': [18.5204, 73.8567],
    'Kolkata': [22.5726, 88.3639],
    'Ahmedabad': [23.0225, 72.5714],
    'Jaipur': [26.9124, 75.7873],
    'Kochi': [9.9312, 76.2673],
  }
  return coords[city] ?? [20.5937, 78.9629]
}
