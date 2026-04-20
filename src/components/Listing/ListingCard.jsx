import { useNavigate } from 'react-router-dom'
import { MapPin, BedDouble, IndianRupee } from 'lucide-react'

const BHK_LABELS = { 0: 'Studio', 1: '1 BHK', 2: '2 BHK', 3: '3 BHK', 4: '4+ BHK' }
const FURNISHING_COLORS = {
  furnished: 'bg-green-500/20 text-green-400',
  semi: 'bg-yellow-500/20 text-yellow-400',
  unfurnished: 'bg-slate-600 text-slate-300',
}

export default function ListingCard({ listing }) {
  const navigate = useNavigate()
  const thumb = listing.images?.[0]

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="bg-slate-800 rounded-2xl border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer overflow-hidden"
    >
      <div className="h-40 bg-slate-700 relative overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-4xl">🏠</div>
        )}
        <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${FURNISHING_COLORS[listing.furnishing] ?? 'bg-slate-600 text-slate-300'}`}>
          {listing.furnishing === 'semi' ? 'Semi-furnished' : listing.furnishing?.charAt(0).toUpperCase() + listing.furnishing?.slice(1)}
        </span>
      </div>

      <div className="p-3">
        <p className="font-semibold text-slate-100 truncate text-sm">{listing.title}</p>
        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
          <MapPin size={11} />
          <span className="truncate">{listing.city}, {listing.state}</span>
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-0.5 text-blue-400 font-bold text-sm">
            <IndianRupee size={13} />
            <span>{Number(listing.rent_amount).toLocaleString('en-IN')}/mo</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <BedDouble size={12} />
            <span>{BHK_LABELS[listing.bhk] ?? `${listing.bhk} BHK`}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
