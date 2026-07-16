import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { applyBrand, type TemaModo } from '../theme/theme'

const CLAVE_LOCALSTORAGE = 'gg-tema-modo'

export function leerModoGuardado(): TemaModo {
  return localStorage.getItem(CLAVE_LOCALSTORAGE) === 'oscuro' ? 'oscuro' : 'claro'
}

interface ThemeModeContextValue {
  modo: TemaModo
  alternar: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<TemaModo>(leerModoGuardado)

  useEffect(() => {
    applyBrand(undefined, modo)
    localStorage.setItem(CLAVE_LOCALSTORAGE, modo)
  }, [modo])

  function alternar() {
    setModo((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'))
  }

  return <ThemeModeContext.Provider value={{ modo, alternar }}>{children}</ThemeModeContext.Provider>
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) throw new Error('useThemeMode debe usarse dentro de <ThemeModeProvider>')
  return ctx
}
