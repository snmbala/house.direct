import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const priceIcon = (price) => L.divIcon({
  className: '',
  html: `<div style="background:#2563eb;color:white;padding:4px 8px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
    ₹${Number(price).toLocaleString('en-IN')}
  </div>`,
  iconSize: [null, null],
  iconAnchor: [30, 12],
})

const userLocationIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:20px;height:20px">
      <div style="
        position:absolute;inset:0;
        background:rgba(59,130,246,0.25);
        border-radius:50%;
        animation:pulse-ring 1.8s ease-out infinite;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:14px;height:14px;
        background:#3b82f6;
        border:2.5px solid white;
        border-radius:50%;
        box-shadow:0 0 0 2px rgba(59,130,246,0.4);
      "></div>
    </div>
    <style>
      @keyframes pulse-ring {
        0%   { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2.8); opacity: 0; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function MapClickHandler({ onClick }) {
  useMapEvents({ click: onClick })
  return null
}

function FlyToCenter({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 })
  }, [center[0], center[1], zoom])
  return null
}

export default function ListingsMap({
  listings = [],
  onMapClick,
  pickMode = false,
  center = [20.5937, 78.9629],
  zoom = 5,
  userCoords = null,
}) {
  const navigate = useNavigate()

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={pickMode ? 'cursor-crosshair' : ''}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToCenter center={center} zoom={zoom} />
      {onMapClick && <MapClickHandler onClick={onMapClick} />}

      {/* You are here */}
      {userCoords && (
        <Marker position={[userCoords.lat, userCoords.lng]} icon={userLocationIcon}>
          <Popup>
            <div style={{ textAlign: 'center', padding: '2px 4px' }}>
              <p style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9', margin: 0 }}>You are here</p>
            </div>
          </Popup>
        </Marker>
      )}

      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.lat, listing.lng]}
          icon={priceIcon(listing.rent_amount)}
          eventHandlers={{ click: () => navigate(`/listing/${listing.id}`) }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-semibold text-sm" style={{ color: '#f1f5f9' }}>{listing.title}</p>
              <p style={{ color: '#60a5fa', fontWeight: 700 }}>₹{Number(listing.rent_amount).toLocaleString('en-IN')}/mo</p>
              <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{listing.city}</p>
              <button
                onClick={() => navigate(`/listing/${listing.id}`)}
                style={{ marginTop: 8, fontSize: 12, background: '#2563eb', color: 'white', padding: '3px 10px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
              >
                View details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
