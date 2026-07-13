import { useEffect, useRef, type KeyboardEvent } from 'react'

/**
 * Un lector de código de barras USB funciona como un teclado: escribe el
 * código muy rápido y termina con Enter. No hace falta detectar la
 * velocidad de tecleo — basta con mantener un input enfocado y reaccionar
 * a Enter. Sirve igual si la dueña escribe el código a mano.
 */
export function useEscaneoCodigoBarras(onEscanear: (codigo: string) => void, activo = true) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activo) inputRef.current?.focus()
  }, [activo])

  function enfocar() {
    inputRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const codigo = e.currentTarget.value.trim()
    if (!codigo) return
    onEscanear(codigo)
  }

  return { inputRef, handleKeyDown, enfocar }
}
