import { useState, useEffect, useRef } from 'react'
import SEOMeta from '../components/SEOMeta.jsx'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Loader2, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Profile() {
  const { user, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [stats, setStats] = useState({ active: 0, total: 0, enquiries: 0 })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/'); return }
    setAvatarUrl(user.user_metadata?.avatar_url ?? null)
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    const { data: listings } = await supabase
      .from('listings').select('id, is_active').eq('user_id', user.id)
    if (listings?.length) {
      const ids = listings.map(l => l.id)
      const { count } = await supabase
        .from('contact_requests').select('id', { count: 'exact', head: true }).in('listing_id', ids)
      setStats({ active: listings.filter(l => l.is_active).length, total: listings.length, enquiries: count ?? 0 })
    }
    setLoading(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('listing-images').upload(path, file, { upsert: true })
    if (uploadError) { setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(path)
    await updateProfile({ avatar_url: publicUrl })
    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  if (!user) return null

  const initial = (user.user_metadata?.name || user.email)[0].toUpperCase()
  const joined = new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white dark:bg-black min-h-full">
      <SEOMeta title="Profile" description="Manage your HouseNearby profile and listings." />
      <div className="max-w-md mx-auto px-4 py-12">

        {/* Avatar */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative mb-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-full border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500 flex items-center justify-center cursor-pointer overflow-hidden bg-transparent transition-colors"
            >
              {uploading ? (
                <Loader2 className="animate-spin text-white dark:text-black" size={24} />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-[Bricolage_Grotesque] text-3xl font-semibold text-neutral-500 dark:text-neutral-400">{initial}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              <Camera size={12} className="text-neutral-600 dark:text-neutral-400" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="font-[Bricolage_Grotesque] text-lg font-semibold text-neutral-950 dark:text-white">
            {user.user_metadata?.name || user.email}
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">{user.email}</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-0.5">Member since {joined}</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-neutral-400" size={20} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Active', value: stats.active },
              { label: 'Total listings', value: stats.total },
              { label: 'Enquiries', value: stats.enquiries },
            ].map(s => (
              <div key={s.label} className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 text-center">
                <p className="font-[Bricolage_Grotesque] text-2xl font-bold text-neutral-950 dark:text-white">{s.value}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-600 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => navigate('/my-listings')}
            className="w-full flex items-center justify-between px-5 py-4 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors border-b border-neutral-200 dark:border-neutral-800"
          >
            <span className="font-medium">My listings</span>
            <ChevronRight size={15} className="text-neutral-400 dark:text-neutral-600" />
          </button>
          <button
            onClick={() => navigate('/post')}
            className="w-full flex items-center justify-between px-5 py-4 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors"
          >
            <span className="font-medium">Post a rental</span>
            <ChevronRight size={15} className="text-neutral-400 dark:text-neutral-600" />
          </button>
        </div>

        <button
          onClick={async () => { await signOut(); navigate('/') }}
          className="w-full mt-4 flex items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 py-3.5 rounded-2xl text-sm transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
