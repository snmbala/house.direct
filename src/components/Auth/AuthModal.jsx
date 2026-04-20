import { useState } from 'react'
import { X, Mail, Loader2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'

export default function AuthModal({ onClose }) {
  const { signInWithOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signInWithOtp(email)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-200">
          <X size={20} />
        </button>

        {sent ? (
          <div className="text-center py-4">
            <Mail className="mx-auto text-blue-400 mb-3" size={40} />
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Check your email</h2>
            <p className="text-slate-400 text-sm">We sent a magic link to <strong className="text-slate-200">{email}</strong>. Click it to sign in.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-100 mb-1">Sign in to HouseDirect</h2>
            <p className="text-slate-400 text-sm mb-6">We'll send a magic link — no password needed</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Send magic link
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
