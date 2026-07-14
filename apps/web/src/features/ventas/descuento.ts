import { useState } from 'react'

export type TipoDescuento = 'porcentaje' | 'valor'

export function useDescuento(subtotal: number) {
  const [tipo, setTipo] = useState<TipoDescuento>('porcentaje')
  const [entrada, setEntrada] = useState('')

  const bruto = Number(entrada) || 0
  const monto = Math.min(tipo === 'porcentaje' ? subtotal * (bruto / 100) : bruto, subtotal)
  const total = subtotal - monto

  function reiniciar() {
    setEntrada('')
    setTipo('porcentaje')
  }

  return { tipo, setTipo, entrada, setEntrada, monto, total, reiniciar }
}
