import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, BedDouble, IndianRupee, Phone, Mail, Calendar, ArrowLeft, Shield, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import ListingsMap from '../components/Map/ListingsMap'
import AuthModal from '../components/Auth/AuthModal'

const BHK_LABELS = { 0: 'Studio', 1: '1 BHK', 2: '2 BHK', 3: '3 BHK', 4: '4+ BHK' }

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [contactRevealed, setContactRevealed] = useState(false)
  const [revealLoading, setRevealLoading] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [contactCooldown, setContactCooldown] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [id])

  const fetchListing = async () => {
    const { data } = await supabase.from('listings').select('*').eq('id', id).single()
    setListing(data)
    setLoading(false)
  }

  const handleRevealContact = async () => {
    if (!user) { setShowAuth(true); return }
    setRevealLoading(true)

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('contact_requests')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', id)
      .eq('requester_id', user.id)
      .gte('created_at', since)

    if (count > 0) {
      setContactCooldown(true)
      setRevealLoading(false)
      return
    }

    await supabase.from('contact_requests').insert({
      listing_id: id,
      requester_id: user.id,
      requester_email: user.email,
    })

    setRevealLoading(false)
    setContactRevealed(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-900">
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="text-center py-24 bg-slate-900">
        <p className="text-slate-400 text-lg">Listing not found</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-400 hover:underline">Back to home</button>
      </div>
    )
  }

  const isOwner = user?.id === listing.user_id

  return (
    <>
      <div className="bg-slate-900 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-slate-400 hover:text-slate-100 mb-4 text-sm">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Images + details */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl overflow-hidden bg-slate-800 aspect-video mb-3">
                {listing.images?.length > 0 ? (
                  <img src={listing.images[activeImg]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-6xl">🏠</div>
                )}
              </div>
              {listing.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {listing.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${activeImg === i ? 'border-blue-500' : 'border-slate-700'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <h1 className="text-2xl font-bold text-slate-100">{listing.title}</h1>
                <div className="flex items-center gap-1 text-slate-400 mt-1">
                  <MapPin size={14} />
                  <span className="text-sm">{listing.address}, {listing.city}, {listing.state} {listing.pincode}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <Tag icon={<IndianRupee size={13} />} label={`₹${Number(listing.rent_amount).toLocaleString('en-IN')}/month`} blue />
                  {listing.deposit_amount && (
                    <Tag label={`₹${Number(listing.deposit_amount).toLocaleString('en-IN')} deposit`} />
                  )}
                  <Tag icon={<BedDouble size={13} />} label={BHK_LABELS[listing.bhk] ?? `${listing.bhk} BHK`} />
                  <Tag label={listing.property_type?.charAt(0).toUpperCase() + listing.property_type?.slice(1)} />
                  <Tag label={listing.furnishing === 'semi' ? 'Semi-furnished' : listing.furnishing?.charAt(0).toUpperCase() + listing.furnishing?.slice(1)} />
                  {listing.available_from && (
                    <Tag icon={<Calendar size={13} />} label={`Available ${new Date(listing.available_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`} />
                  )}
                </div>

                {listing.description && (
                  <div className="mt-5">
                    <h3 className="font-semibold text-slate-200 mb-2">About this property</h3>
                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Map + Contact */}
            <div className="lg:col-span-2 space-y-4">
              <div className="h-52 rounded-2xl overflow-hidden border border-slate-700">
                <ListingsMap listings={[listing]} center={[listing.lat, listing.lng]} zoom={15} />
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                <h3 className="font-semibold text-slate-100 mb-4">Contact owner</h3>

                {isOwner ? (
                  <p className="text-sm text-slate-500 italic">This is your listing</p>
                ) : contactCooldown ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm px-4 py-3 rounded-xl">
                    You've already requested this owner's contact in the last 24 hours.
                  </div>
                ) : contactRevealed ? (
                  <div className="space-y-3">
                    <ContactRow icon={<Phone size={15} className="text-green-400" />} label={`+91 ${listing.contact_phone}`} href={`tel:+91${listing.contact_phone}`} />
                    {listing.contact_email && (
                      <ContactRow icon={<Mail size={15} className="text-blue-400" />} label={listing.contact_email} href={`mailto:${listing.contact_email}`} />
                    )}
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                      <Shield size={12} />
                      <span>Contact revealed — please don't share publicly</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-400 mb-4">Sign in to reveal the owner's contact number</p>
                    <button
                      onClick={handleRevealContact}
                      disabled={revealLoading}
                      className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {revealLoading ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
                      {user ? 'Reveal contact' : 'Sign in to contact'}
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-600 text-center">
                Posted {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}

function Tag({ icon, label, blue }) {
  return (
    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${blue ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
      {icon}{label}
    </span>
  )
}

function ContactRow({ icon, label, href }) {
  return (
    <a href={href} className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 transition-colors">
      {icon}
      <span>{label}</span>
    </a>
  )
}
