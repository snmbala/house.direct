import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home, PlusCircle, ListChecks, LogOut, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import AuthModal from './Auth/AuthModal'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  const handlePostClick = () => {
    if (!user) {
      setShowAuth(true)
    } else {
      navigate('/post')
    }
  }

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-blue-400 text-lg">
            <Home size={22} />
            HouseDirect
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePostClick}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <PlusCircle size={16} />
              Post Rental
            </button>

            {user ? (
              <div className="flex items-center gap-1">
                <Link
                  to="/my-listings"
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <ListChecks size={16} />
                  My Listings
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <User size={16} />
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
