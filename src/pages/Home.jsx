import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ListingsMap from '../components/Map/ListingsMap'
import ListingCard from '../components/Listing/ListingCard'

const PROPERTY_TYPES = ['All', 'Apartment', 'House', 'PG', 'Studio', 'Villa']
const CITIES = ['All Cities', 'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi']

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
          resolve({ city: CITY_ALIASES[raw] ?? null, lat: coords.latitude, lng: coords.longitude })
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
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('All Cities')
  const [propType, setPropType] = useState('All')
  const [maxRent, setMaxRent] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [userCoords, setUserCoords] = useState(null)

  useEffect(() => {
    detectCity().then((result) => {
      if (!result) return
      setUserCoords({ lat: result.lat, lng: result.lng })
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

  const filtered = listings.filter(l =>
    search === '' ||
    l.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.city?.toLowerCase().includes(search.toLowerCase()) ||
    l.address?.toLowerCase().includes(search.toLowerCase())
  )

  const mapCenter = city !== 'All Cities'
    ? getCityCenter(city)
    : userCoords
      ? [userCoords.lat, userCoords.lng]
      : [20.5937, 78.9629]

  const mapZoom = city !== 'All Cities' ? 12 : userCoords ? 11 : 5

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Search bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by city, area or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 border rounded-xl px-3 py-2.5 text-sm transition-colors ${
              showFilters
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="max-w-7xl mx-auto mt-3 flex flex-wrap gap-2">
            {PROPERTY_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setPropType(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  propType === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-slate-400">Max rent ₹</span>
              <input
                type="number"
                placeholder="e.g. 25000"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
                className="w-28 bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {maxRent && (
                <button onClick={() => setMaxRent('')} className="text-slate-400 hover:text-slate-200">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Count */}
      <div className="px-4 py-2 text-sm text-slate-400 bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          {loading ? 'Loading...' : `${filtered.length} rental${filtered.length !== 1 ? 's' : ''} found`}
        </div>
      </div>

      {/* Content — always split */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1">
          <ListingsMap listings={filtered} center={mapCenter} zoom={mapZoom} userCoords={userCoords} />
        </div>

        <div className="w-80 overflow-y-auto bg-slate-900 border-l border-slate-700">
          <div className="p-3 grid grid-cols-1 gap-3">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-2xl h-64 animate-pulse border border-slate-700" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <p className="text-4xl mb-3">🏠</p>
                <p className="font-medium text-slate-400">No rentals found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filtered.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </div>
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
