import { useState } from 'react'
import { ArrowLeft, MapPin, Phone, Mail, Calendar, Shield, Loader2, ChevronLeft, ChevronRight, X, MessageSquare, Zap, Wifi, Car, Dumbbell, Waves, Trees, ShieldCheck, Droplets, Wind, PawPrint, Building2, Users, Wrench, PhoneCall } from 'lucide-react'
import { useKeyboard } from '../../hooks/useKeyboard.js'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth.jsx'
import AuthModal from '../Auth/AuthModal'

const AMENITY_META = {
  parking_2w:    { label: '2W Parking',    icon: <Car size={12} /> },
  parking_4w:    { label: '4W Parking',    icon: <Car size={12} /> },
  lift:          { label: 'Lift',          icon: <Building2 size={12} /> },
  power_backup:  { label: 'Power Backup',  icon: <Zap size={12} /> },
  security:      { label: 'Security',      icon: <ShieldCheck size={12} /> },
  gym:           { label: 'Gym',           icon: <Dumbbell size={12} /> },
  swimming_pool: { label: 'Pool',          icon: <Waves size={12} /> },
  clubhouse:     { label: 'Club House',    icon: <Building2 size={12} /> },
  garden:        { label: 'Garden',        icon: <Trees size={12} /> },
  wifi:          { label: 'Wi-Fi',         icon: <Wifi size={12} /> },
  gated:         { label: 'Gated',         icon: <Shield size={12} /> },
  intercom:      { label: 'Intercom',      icon: <PhoneCall size={12} /> },
  water_24x7:    { label: 'Water 24×7',   icon: <Droplets size={12} /> },
  balcony:       { label: 'Balcony',       icon: <Trees size={12} /> },
  pet_friendly:  { label: 'Pet Friendly',  icon: <PawPrint size={12} /> },
  ac:            { label: 'AC',            icon: <Wind size={12} /> },
}

const BHK_LABELS = { 0: 'Studio', 1: '1 BHK', 2: '2 BHK', 3: '3 BHK', 4: '4+ BHK' }
const FURNISHING_LABELS = { furnished: 'Furnished', semi: 'Semi-furnished', unfurnished: 'Unfurnished' }
const PREFERRED_LABELS = { any: 'Anyone', family: 'Family', bachelor: 'Bachelors', working: 'Working Professionals' }
const THUMB_ROW = 4

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-600 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  )
}

function ContactRow({ icon, label, href }) {
  return (
    <a href={href} className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white transition-colors">
      <span className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-500 shrink-0">{icon}</span>
      <span className="font-medium">{label}</span>
    </a>
  )
}

export default function ListingDetailPanel({ listing, onClose, onPrev, onNext, hasPrev, hasNext, index, total }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeImg, setActiveImg] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [thumbsExpanded, setThumbsExpanded] = useState(false)
  const [msgLoading, setMsgLoading] = useState(false)
  const [contactRevealed, setContactRevealed] = useState(false)
  const [revealLoading, setRevealLoading] = useState(false)
  const [contactCooldown, setContactCooldown] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  const images = listing.images ?? []
  const isOwner = user?.id === listing.user_id
  const amenities = listing.amenities ?? []

  const handleMessage = async () => {
    if (!user) { setShowAuth(true); return }
    setMsgLoading(true)
    const { data } = await supabase
      .from('conversations')
      .upsert(
        { listing_id: listing.id, requester_id: user.id, owner_id: listing.user_id },
        { onConflict: 'listing_id,requester_id' }
      )
      .select('id')
      .single()
    setMsgLoading(false)
    if (data) navigate(`/messages?c=${data.id}`)
  }

  useKeyboard({
    ArrowLeft:  () => setActiveImg(i => Math.max(0, i - 1)),
    ArrowRight: () => setActiveImg(i => Math.min(images.length - 1, i + 1)),
    Escape: () => { if (lightbox) setLightbox(false) },
  })

  const handleRevealContact = async () => {
    if (!user) { setShowAuth(true); return }
    setRevealLoading(true)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('contact_requests')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listing.id)
      .eq('requester_id', user.id)
      .gte('created_at', since)
    if (count > 0) { setContactCooldown(true); setRevealLoading(false); return }
    await supabase.from('contact_requests').insert({
      listing_id: listing.id, requester_id: user.id, requester_email: user.email,
    })
    setRevealLoading(false)
    setContactRevealed(true)
  }

  const visibleThumbs = thumbsExpanded ? images : images.slice(0, THUMB_ROW)
  const hiddenCount = images.length - THUMB_ROW

  return (
    <>
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 shrink-0">
          <button onClick={onClose} className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-600 hover:text-neutral-950 dark:hover:text-white transition-colors text-sm">
            <ArrowLeft size={14} /> Back
          </button>
          <span className="flex-1" />
          <span className="text-xs text-neutral-400 dark:text-neutral-600 tabular-nums">{index + 1} / {total}</span>
          <button onClick={onClose} className="ml-3 p-1.5 rounded-full text-neutral-400 dark:text-neutral-600 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Hero image */}
          <div
            className="aspect-video bg-neutral-100 dark:bg-neutral-900 relative overflow-hidden cursor-zoom-in"
            onClick={() => images.length > 0 && setLightbox(true)}
          >
            {images.length > 0 ? (
              <img src={images[activeImg]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl select-none">🏠</div>
            )}
            {images.length > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm tabular-nums">
                {activeImg + 1} / {images.length}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="px-3 pt-2 pb-2 border-b border-neutral-100 dark:border-neutral-900">
              <div className="grid grid-cols-4 gap-1.5">
                {visibleThumbs.map((img, i) => {
                  const isLast = !thumbsExpanded && i === THUMB_ROW - 1 && hiddenCount > 0
                  return (
                    <button
                      key={i}
                      onClick={() => { setActiveImg(i); if (isLast && !thumbsExpanded) setThumbsExpanded(true) }}
                      className={`relative rounded-lg overflow-hidden border-2 aspect-square transition-colors ${activeImg === i ? 'border-neutral-950 dark:border-white' : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      {isLast && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">+{hiddenCount}</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {thumbsExpanded && images.length > THUMB_ROW && (
                <button onClick={() => setThumbsExpanded(false)} className="text-[10px] text-neutral-400 dark:text-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-400 mt-2 transition-colors">
                  Show less
                </button>
              )}
            </div>
          )}

          <div className="px-5 py-5 space-y-6">

            {/* Price + Title */}
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-[Bricolage_Grotesque] text-2xl font-bold text-neutral-950 dark:text-white">
                  ₹{Number(listing.rent_amount).toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-neutral-400 dark:text-neutral-600">/month</span>
                {listing.deposit_amount && (
                  <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-800">
                    ₹{Number(listing.deposit_amount).toLocaleString('en-IN')} deposit
                  </span>
                )}
              </div>
              <h2 className="font-[Bricolage_Grotesque] text-base font-semibold text-neutral-800 dark:text-neutral-200 leading-snug">
                {listing.title}
              </h2>
              {(listing.address || listing.city) && (
                <div className="flex items-start gap-1.5 text-neutral-400 dark:text-neutral-600 mt-1.5">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span className="text-xs leading-relaxed">{[listing.address, listing.city, listing.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            {/* Key specs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Bedrooms', value: BHK_LABELS[listing.bhk] ?? `${listing.bhk} BHK` },
                { label: 'Type', value: listing.property_type?.charAt(0).toUpperCase() + listing.property_type?.slice(1) },
                { label: 'Furnishing', value: FURNISHING_LABELS[listing.furnishing] ?? listing.furnishing },
              ].map(s => (
                <div key={s.label} className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 rounded-xl px-3 py-3">
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mb-0.5">{s.label}</p>
                  <p className="text-xs font-semibold text-neutral-950 dark:text-white">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Extra details row */}
            {(listing.maintenance_included != null || listing.preferred_tenants || listing.available_from) && (
              <div className="flex flex-wrap gap-2">
                {listing.maintenance_included === true && (
                  <span className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 px-2.5 py-1.5 rounded-full">
                    <Wrench size={11} /> Maintenance included
                  </span>
                )}
                {listing.maintenance_included === false && listing.maintenance_amount && (
                  <span className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 px-2.5 py-1.5 rounded-full">
                    <Wrench size={11} /> +₹{Number(listing.maintenance_amount).toLocaleString('en-IN')} maintenance
                  </span>
                )}
                {listing.preferred_tenants && listing.preferred_tenants !== 'any' && (
                  <span className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 px-2.5 py-1.5 rounded-full">
                    <Users size={11} /> {PREFERRED_LABELS[listing.preferred_tenants] ?? listing.preferred_tenants}
                  </span>
                )}
                {listing.available_from && (
                  <span className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-900 px-2.5 py-1.5 rounded-full">
                    <Calendar size={11} /> From {new Date(listing.available_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <Section title="About">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </Section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <Section title="Amenities">
                <div className="flex flex-wrap gap-2">
                  {amenities.map(a => {
                    const meta = AMENITY_META[a]
                    return (
                      <span key={a} className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 rounded-full">
                        <span className="text-neutral-400 dark:text-neutral-600">{meta?.icon}</span>
                        {meta?.label ?? a}
                      </span>
                    )
                  })}
                </div>
              </Section>
            )}

            {/* Contact */}
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-900 bg-neutral-50 dark:bg-neutral-950">
                <p className="font-[Bricolage_Grotesque] text-sm font-semibold text-neutral-950 dark:text-white">Contact owner</p>
              </div>
              <div className="p-4">
                {isOwner ? (
                  <p className="text-sm text-neutral-400 dark:text-neutral-600 italic">This is your listing</p>
                ) : !contactRevealed && !contactCooldown ? (
                  <div className="space-y-2">
                    <button onClick={handleRevealContact} disabled={revealLoading}
                      className="w-full bg-neutral-950 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-60 text-white dark:text-black font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      {revealLoading ? <Loader2 size={13} className="animate-spin" /> : <Phone size={13} />}
                      {user ? 'Reveal contact' : 'Sign in to contact'}
                    </button>
                    <button onClick={handleMessage} disabled={msgLoading}
                      className="w-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-60 text-neutral-700 dark:text-neutral-300 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      {msgLoading ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                      Message owner
                    </button>
                  </div>
                ) : contactCooldown ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 py-1">Already contacted in the last 24 hours.</p>
                ) : contactRevealed ? (
                  <div className="space-y-3">
                    <ContactRow icon={<Phone size={13} />} label={`+91 ${listing.contact_phone}`} href={`tel:+91${listing.contact_phone}`} />
                    {listing.contact_email && <ContactRow icon={<Mail size={13} />} label={listing.contact_email} href={`mailto:${listing.contact_email}`} />}
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-600 pt-3 border-t border-neutral-100 dark:border-neutral-900">
                      <Shield size={10} /><span>Don't share this contact publicly</span>
                    </div>
                    <button onClick={handleMessage} disabled={msgLoading}
                      className="w-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 disabled:opacity-60 text-neutral-700 dark:text-neutral-300 font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                      {msgLoading ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                      Message owner
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <p className="text-[11px] text-neutral-300 dark:text-neutral-700 text-center pb-2">
              Posted {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

          </div>
        </div>

        {/* Prev / Next */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-neutral-100 dark:border-neutral-900">
          <button onClick={onPrev} disabled={!hasPrev}
            className="group flex items-center gap-1.5 text-sm font-medium text-neutral-400 dark:text-neutral-600 hover:text-neutral-950 dark:hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors">
            <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
            Previous
          </button>
          <button onClick={onNext} disabled={!hasNext}
            className="group flex items-center gap-1.5 text-sm font-medium text-neutral-400 dark:text-neutral-600 hover:text-neutral-950 dark:hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-colors">
            Next
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && images.length > 0 && (
        <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-2 z-10" onClick={() => setLightbox(false)}>
            <X size={20} />
          </button>
          {activeImg > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 z-10"
              onClick={(e) => { e.stopPropagation(); setActiveImg(i => i - 1) }}>
              <ChevronLeft size={28} />
            </button>
          )}
          {activeImg < images.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 z-10"
              onClick={(e) => { e.stopPropagation(); setActiveImg(i => i + 1) }}>
              <ChevronRight size={28} />
            </button>
          )}
          <img src={images[activeImg]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          <span className="absolute bottom-4 text-white/50 text-sm tabular-nums">{activeImg + 1} / {images.length}</span>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
