import { createContext, useContext, useState } from 'react'

export const CITIES = ['All Cities', 'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi']

const CityContext = createContext(null)

export function CityProvider({ children }) {
  const [city, setCity] = useState('All Cities')
  const [cityManuallySelected, setCityManuallySelected] = useState(false)

  const selectCity = (c) => {
    setCity(c)
    setCityManuallySelected(true)
  }

  return (
    <CityContext.Provider value={{ city, setCity, cityManuallySelected, setCityManuallySelected, selectCity }}>
      {children}
    </CityContext.Provider>
  )
}

export function useCity() {
  return useContext(CityContext)
}
