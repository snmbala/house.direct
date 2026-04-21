import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme'
import { CityProvider } from './hooks/useCity'
import { FiltersProvider } from './hooks/useFilters'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import PostListing from './pages/PostListing'
import ListingDetail from './pages/ListingDetail'
import MyListings from './pages/MyListings'
import EditListing from './pages/EditListing'
import Profile from './pages/Profile'
import Messages from './pages/Messages'

function Layout() {
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'post', element: <div className="h-full overflow-y-auto"><PostListing /></div> },
      { path: 'listing/:id', element: <div className="h-full overflow-y-auto"><ListingDetail /></div> },
      { path: 'my-listings', element: <div className="h-full overflow-y-auto"><MyListings /></div> },
      { path: 'edit/:id', element: <div className="h-full overflow-y-auto"><EditListing /></div> },
      { path: 'profile', element: <div className="h-full overflow-y-auto"><Profile /></div> },
      { path: 'messages', element: <Messages /> },
    ],
  },
])

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <CityProvider>
          <AuthProvider>
            <FiltersProvider>
              <RouterProvider router={router} />
            </FiltersProvider>
          </AuthProvider>
        </CityProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}
