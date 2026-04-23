import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)

export function FiltersProvider({ children }) {
  const [search, setSearch] = useState('')
  const [propType, setPropType] = useState('All')
  const [maxRent, setMaxRent] = useState('')
  const [userCoords, setUserCoords] = useState(null)

  return (
    <Ctx.Provider value={{ search, setSearch, propType, setPropType, maxRent, setMaxRent, userCoords, setUserCoords }}>
      {children}
    </Ctx.Provider>
  )
}

export const useFilters = () => useContext(Ctx)
