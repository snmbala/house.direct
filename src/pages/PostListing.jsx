import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { MapPin, Upload, X, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import ListingsMap from '../components/Map/ListingsMap'

const PROPERTY_TYPES = ['apartment', 'house', 'pg', 'studio', 'villa']
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh',
]

const input = 'w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'block text-sm font-medium text-slate-300 mb-1'

export default function PostListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [pickedLocation, setPickedLocation] = useState(null)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rateLimitError, setRateLimitError] = useState('')

  const { register, handleSubmit, formState: { errors }, getValues } = useForm({
    defaultValues: { bhk: 1, furnishing: 'unfurnished', property_type: 'apartment', available_from: '' }
  })

  const handleMapClick = useCallback((e) => {
    setPickedLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
  }, [])

  const addImages = (files) => {
    const valid = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, 8 - images.length)
    setImages(prev => [
      ...prev,
      ...valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    ])
  }

  const removeImage = (idx) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const onSubmit = async (data) => {
    if (!pickedLocation) { setStep(2); return }
    if (!user) return

    const { count } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (count >= 3) {
      setRateLimitError('You can only have 3 active listings at a time. Deactivate one to post a new listing.')
      return
    }

    setUploading(true)
    setRateLimitError('')

    const imageUrls = []
    for (const img of images) {
      const ext = img.file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('listing-images').upload(path, img.file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(path)
        imageUrls.push(publicUrl)
      }
    }

    const { error } = await supabase.from('listings').insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      property_type: data.property_type,
      bhk: parseInt(data.bhk),
      rent_amount: parseInt(data.rent_amount),
      deposit_amount: data.deposit_amount ? parseInt(data.deposit_amount) : null,
      furnishing: data.furnishing,
      available_from: data.available_from || null,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      lat: pickedLocation.lat,
      lng: pickedLocation.lng,
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      contact_email: user.email,
      images: imageUrls,
      is_active: true,
    })

    setUploading(false)
    if (!error) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="mx-auto text-green-400 mb-4" size={56} />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Listing posted!</h2>
          <p className="text-slate-400 mb-6">Tenants can now find your property on the map.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-500">
              Browse listings
            </button>
            <button onClick={() => navigate('/my-listings')} className="border border-slate-600 text-slate-300 px-6 py-2.5 rounded-xl hover:bg-slate-800">
              My listings
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Post a Rental</h1>
        <p className="text-slate-400 text-sm mb-6">List your property directly — tenants will find you on the map</p>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[['1', 'Details'], ['2', 'Location'], ['3', 'Photos']].map(([n, label_]) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= parseInt(n) ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {n}
              </div>
              <span className={`text-sm ${step >= parseInt(n) ? 'text-slate-100 font-medium' : 'text-slate-500'}`}>{label_}</span>
              {n !== '3' && <div className="w-8 h-px bg-slate-700 mx-1" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={label}>Listing title *</label>
                  <input
                    {...register('title', { required: 'Required' })}
                    placeholder="e.g. Spacious 2 BHK in Koramangala"
                    className={input}
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className={label}>Property type *</label>
                  <select {...register('property_type')} className={input}>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>

                <div>
                  <label className={label}>BHK *</label>
                  <select {...register('bhk')} className={input}>
                    <option value={0}>Studio</option>
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} BHK</option>)}
                  </select>
                </div>

                <div>
                  <label className={label}>Monthly rent (₹) *</label>
                  <input
                    type="number"
                    {...register('rent_amount', { required: 'Required', min: { value: 1000, message: 'Min ₹1,000' } })}
                    placeholder="e.g. 20000"
                    className={input}
                  />
                  {errors.rent_amount && <p className="text-red-400 text-xs mt-1">{errors.rent_amount.message}</p>}
                </div>

                <div>
                  <label className={label}>Deposit (₹)</label>
                  <input type="number" {...register('deposit_amount')} placeholder="e.g. 60000" className={input} />
                </div>

                <div>
                  <label className={label}>Furnishing *</label>
                  <select {...register('furnishing')} className={input}>
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi">Semi-furnished</option>
                    <option value="furnished">Furnished</option>
                  </select>
                </div>

                <div>
                  <label className={label}>Available from</label>
                  <input type="date" {...register('available_from')} className={input} />
                </div>

                <div className="col-span-2">
                  <label className={label}>Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    placeholder="Describe the property, amenities, nearby landmarks..."
                    className={`${input} resize-none`}
                  />
                </div>

                <div className="col-span-2 border-t border-slate-700 pt-4">
                  <p className="text-sm font-semibold text-slate-300 mb-3">Address</p>
                </div>

                <div className="col-span-2">
                  <label className={label}>Street address *</label>
                  <input
                    {...register('address', { required: 'Required' })}
                    placeholder="Building name, street, area"
                    className={input}
                  />
                  {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
                </div>

                <div>
                  <label className={label}>City *</label>
                  <input {...register('city', { required: 'Required' })} placeholder="e.g. Bengaluru" className={input} />
                  {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>}
                </div>

                <div>
                  <label className={label}>State *</label>
                  <select {...register('state', { required: 'Required' })} className={input}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state.message}</p>}
                </div>

                <div>
                  <label className={label}>Pincode</label>
                  <input
                    {...register('pincode', { pattern: { value: /^\d{6}$/, message: 'Must be 6 digits' } })}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    className={input}
                  />
                  {errors.pincode && <p className="text-red-400 text-xs mt-1">{errors.pincode.message}</p>}
                </div>

                <div className="col-span-2 border-t border-slate-700 pt-4">
                  <p className="text-sm font-semibold text-slate-300 mb-3">Contact details</p>
                </div>

                <div>
                  <label className={label}>Your name *</label>
                  <input
                    {...register('contact_name', { required: 'Required' })}
                    placeholder="Full name"
                    className={input}
                  />
                  {errors.contact_name && <p className="text-red-400 text-xs mt-1">{errors.contact_name.message}</p>}
                </div>

                <div>
                  <label className={label}>Phone number *</label>
                  <div className="flex">
                    <span className="border border-r-0 border-slate-600 rounded-l-xl px-3 py-3 text-sm text-slate-400 bg-slate-800">+91</span>
                    <input
                      {...register('contact_phone', {
                        required: 'Required',
                        pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid Indian mobile number' }
                      })}
                      placeholder="9876543210"
                      maxLength={10}
                      className="flex-1 bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {errors.contact_phone && <p className="text-red-400 text-xs mt-1">{errors.contact_phone.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSubmit(() => setStep(2), () => {})()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl transition-colors"
                >
                  Next: Pin location
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4 flex items-start gap-2">
                <MapPin size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-300">
                  {pickedLocation
                    ? `Location pinned at ${pickedLocation.lat.toFixed(5)}, ${pickedLocation.lng.toFixed(5)} — click map to adjust`
                    : 'Click on the map to pin your property location'}
                </p>
              </div>

              <div className="h-96 rounded-2xl overflow-hidden border border-slate-700 mb-4">
                <ListingsMap
                  listings={pickedLocation ? [{ id: 'preview', lat: pickedLocation.lat, lng: pickedLocation.lng, rent_amount: getValues('rent_amount') || 0, title: getValues('title') || 'Your property' }] : []}
                  onMapClick={handleMapClick}
                  pickMode
                  center={[20.5937, 78.9629]}
                  zoom={5}
                />
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="border border-slate-600 text-slate-300 px-6 py-2.5 rounded-xl hover:bg-slate-800">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => pickedLocation && setStep(3)}
                  disabled={!pickedLocation}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium px-8 py-2.5 rounded-xl transition-colors"
                >
                  Next: Add photos
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <div>
              <p className="text-sm text-slate-400 mb-4">Add up to 8 photos. Good photos get 3x more inquiries.</p>

              <div
                className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); addImages(e.dataTransfer.files) }}
                onClick={() => document.getElementById('img-input').click()}
              >
                <Upload className="mx-auto text-slate-500 mb-2" size={32} />
                <p className="text-sm text-slate-400">Drag & drop or <span className="text-blue-400">click to upload</span></p>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP — max 8 photos</p>
                <input id="img-input" type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-square">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">Cover</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {rateLimitError && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                  {rateLimitError}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setStep(2)} className="border border-slate-600 text-slate-300 px-6 py-2.5 rounded-xl hover:bg-slate-800">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-medium px-8 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                  {uploading && <Loader2 size={16} className="animate-spin" />}
                  {uploading ? 'Posting...' : 'Publish listing'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
