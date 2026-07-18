import { useState } from 'react'
import './calculadora-efectivo.css'

// Billetes y monedas de Colombia, del más grande al más chico.
const DENOMINACIONES = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100]

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

interface CalculadoraEfectivoProps {
  total: number
}

/** Calculadora de cambio: el cajero marca qué billetes/monedas recibió y se calcula cuánto debe devolver. */
export function CalculadoraEfectivo({ total }: CalculadoraEfectivoProps) {
  const [cantidades, setCantidades] = useState<Record<number, string>>({})

  const totalRecibido = DENOMINACIONES.reduce((acc, d) => acc + d * (Number(cantidades[d]) || 0), 0)
  const cambio = totalRecibido - total
  const hayConteo = Object.values(cantidades).some((v) => Number(v) > 0)

  function actualizar(denominacion: number, valor: string) {
    setCantidades((prev) => ({ ...prev, [denominacion]: valor }))
  }

  return (
    <div className="gg-calc-efectivo">
      <p className="gg-calc-efectivo-titulo">¿Con qué billetes/monedas paga?</p>
      <div className="gg-calc-efectivo-grid">
        {DENOMINACIONES.map((d) => (
          <div key={d} className="gg-calc-efectivo-item">
            <label htmlFor={`efectivo-${d}`}>{formatoCOP.format(d)}</label>
            <input
              id={`efectivo-${d}`}
              className="gg-input"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={cantidades[d] ?? ''}
              onChange={(e) => actualizar(d, e.target.value)}
              placeholder="0"
            />
          </div>
        ))}
      </div>

      {hayConteo && (
        <div className="gg-calc-efectivo-resultado">
          <div className="gg-calc-efectivo-fila">
            <span>Recibido</span>
            <span>{formatoCOP.format(totalRecibido)}</span>
          </div>
          <div
            className={
              'gg-calc-efectivo-fila gg-calc-efectivo-cambio' +
              (cambio < 0 ? ' gg-calc-efectivo-cambio--falta' : '')
            }
          >
            <span>{cambio < 0 ? 'Todavía falta' : 'Cambio a devolver'}</span>
            <span>{formatoCOP.format(Math.abs(cambio))}</span>
          </div>
        </div>
      )}
    </div>
  )
}
