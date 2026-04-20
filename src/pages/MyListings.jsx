import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Eye, EyeOff, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

export default function MyListings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [contactCounts, setContactCounts] = useState({})

  useEffect(() => {
    if (user) fetchMyListings()
  }, [user])

  const fetchMyListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setListings(data ?? [])
    setLoading(false)

    // Fetch contact request counts
    if (data?.length) {
      const ids = data.map(l => l.id)
      const { data: counts } = await supabase
        .from('contact_requests')
        .select('listing_id')
        .in('listing_id', ids)

      const countMap = {}
      counts?.forEach(r => {
        countMap[r.listing_id] = (countMap[r.listing_id] ?? 0) + 1
      })
      setContactCounts(countMap)
    }
  }

  const toggleActive = async (id, current) => {
    await supabase.from('listings').update({ is_active: !current }).eq('id', id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l))
  }

  const deleteListing = async (id) => {
    if (!confirm('Delete this listing permanently?')) return
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
  }

  if (!user) {
    return (
      <div className="text-center py-24 bg-slate-900 min-h-screen">
        <p className="text-slate-400">Please sign in to manage your listings</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900">
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    )
  }

  return (
    <div className="bg-slate-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">My Listings</h1>
            <p className="text-slate-400 text-sm mt-0.5">{listings.length} listing{listings.length !== 1 ? 's' : ''} · max 3 active</p>
          </div>
          <button
            onClick={() => navigate('/post')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <PlusCircle size={16} /> New listing
          </button>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20 bg-slate-800 rounded-2xl border border-slate-700">
            <p className="text-4xl mb-3">🏠</p>
            <p className="font-medium text-slate-200">No listings yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">Post your first property and get tenants directly</p>
            <button onClick={() => navigate('/post')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-500">
              Post a rental
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(listing => (
              <div key={listing.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-700 shrink-0">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xl">🏠</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 truncate">{listing.title}</p>
                  <p className="text-sm text-slate-400">{listing.city}, {listing.state}</p>
                  <p className="text-sm text-blue-400 font-medium">₹{Number(listing.rent_amount).toLocaleString('en-IN')}/mo</p>
                </div>

                <div className="flex items-center gap-1 text-slate-500 text-sm shrink-0">
                  <MessageSquare size={14} />
                  <span>{contactCounts[listing.id] ?? 0} enquir{(contactCounts[listing.id] ?? 0) === 1 ? 'y' : 'ies'}</span>
                </div>

                <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${listing.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                  {listing.is_active ? 'Active' : 'Inactive'}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded-xl transition-colors"
                    title="View"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => toggleActive(listing.id, listing.is_active)}
                    className={`p-2 rounded-xl transition-colors ${listing.is_active ? 'text-slate-500 hover:text-yellow-400 hover:bg-slate-700' : 'text-slate-500 hover:text-green-400 hover:bg-slate-700'}`}
                    title={listing.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {listing.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => deleteListing(listing.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-xl transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
