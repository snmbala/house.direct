import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)

export function FiltersProvider({ children }) {
  const [search, setSearch] = useState('')
  const [propType, setPropType] = useState('All')
  const [maxRent, setMaxRent] = useState('')
  const [nearbyMode, setNearbyMode] = useState(true)
  const [radiusKm, setRadiusKm] = useState(6)
  const [userCoords, setUserCoords] = useState(null)
  const [locationArea, setLocationArea] = useState('')

  return (
    <Ctx.Provider value={{ search, setSearch, propType, setPropType, maxRent, setMaxRent, nearbyMode, setNearbyMode, radiusKm, setRadiusKm, userCoords, setUserCoords, locationArea, setLocationArea }}>
      {children}
    </Ctx.Provider>
  )
}

export const useFilters = () => useContext(Ctx)
