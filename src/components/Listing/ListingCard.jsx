import { useNavigate } from 'react-router-dom'
import { MapPin, BedDouble } from 'lucide-react'

const BHK_LABELS = { 0: 'Studio', 1: '1 BHK', 2: '2 BHK', 3: '3 BHK', 4: '4+ BHK' }

const FURNISHING_LABELS = {
  furnished: 'Furnished',
  semi: 'Semi',
  unfurnished: 'Unfurnished',
}

function fmtDist(km) {
  if (km == null) return null
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

export default function ListingCard({ listing, distKm, onSelect, onHover }) {
  const navigate = useNavigate()
  const images = listing.images?.slice(0, 3) ?? []
  const handleClick = () => onSelect ? onSelect(listing) : navigate(`/listing/${listing.id}`)

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors cursor-pointer overflow-hidden flex h-32"
    >
      {/* Image grid */}
      <div className="shrink-0 w-56 h-32 flex gap-0.5 overflow-hidden rounded-l-xl">
        {images.length === 0 && (
          <div className="w-full h-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-300 dark:text-neutral-700 text-2xl">🏠</div>
        )}
        {images.length === 1 && (
          <div className="relative w-full h-full">
            <img src={images[0]} alt="" className="w-full h-full object-cover" />
            <span className="absolute top-1.5 left-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
              {FURNISHING_LABELS[listing.furnishing] ?? listing.furnishing}
            </span>
          </div>
        )}
        {images.length === 2 && (
          <>
            <div className="relative w-1/2 h-full">
              <img src={images[0]} alt="" className="w-full h-full object-cover" />
              <span className="absolute top-1.5 left-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                {FURNISHING_LABELS[listing.furnishing] ?? listing.furnishing}
              </span>
            </div>
            <div className="w-1/2 h-full">
              <img src={images[1]} alt="" className="w-full h-full object-cover" />
            </div>
          </>
        )}
        {images.length >= 3 && (
          <>
            <div className="relative w-3/5 h-full">
              <img src={images[0]} alt="" className="w-full h-full object-cover" />
              <span className="absolute top-1.5 left-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                {FURNISHING_LABELS[listing.furnishing] ?? listing.furnishing}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 w-2/5 h-full">
              <img src={images[1]} alt="" className="w-full h-1/2 object-cover" />
              <div className="relative w-full h-1/2">
                <img src={images[2]} alt="" className="w-full h-full object-cover" />
                {listing.images.length > 3 && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">+{listing.images.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
        <div>
          <p className="font-[Bricolage_Grotesque] font-semibold text-neutral-950 dark:text-white text-sm leading-snug line-clamp-2">{listing.title}</p>
          <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-600 text-xs mt-1 min-w-0">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{listing.city}, {listing.state}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <span className="font-[Bricolage_Grotesque] font-bold text-neutral-950 dark:text-white text-sm tracking-tight">
            ₹{Number(listing.rent_amount).toLocaleString('en-IN')}
            <span className="font-normal text-neutral-400 dark:text-neutral-600 text-xs">/mo</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-600 text-xs">
              <BedDouble size={11} />
              <span>{BHK_LABELS[listing.bhk] ?? `${listing.bhk} BHK`}</span>
            </div>
            {fmtDist(distKm) && (
              <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                {fmtDist(distKm)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
