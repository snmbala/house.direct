import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PostListing from './pages/PostListing'
import ListingDetail from './pages/ListingDetail'
import MyListings from './pages/MyListings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col h-screen">
          <Navbar />
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/post" element={<PostListing />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/my-listings" element={<MyListings />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
