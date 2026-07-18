import { useState } from 'react'
import { BilleteIcon } from './BilleteIcon'
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

/**
 * Calculadora de cambio: el cajero marca qué billetes/monedas recibió, o si
 * es más rápido, escribe directo cuánto le pagaron en un solo campo — las
 * dos formas calculan el mismo cambio a devolver.
 */
export function CalculadoraEfectivo({ total }: CalculadoraEfectivoProps) {
  const [cantidades, setCantidades] = useState<Record<number, string>>({})
  const [montoDirecto, setMontoDirecto] = useState('')

  const totalItemizado = DENOMINACIONES.reduce((acc, d) => acc + d * (Number(cantidades[d]) || 0), 0)
  const usaMontoDirecto = montoDirecto.trim() !== ''
  const totalRecibido = usaMontoDirecto ? Number(montoDirecto) || 0 : totalItemizado
  const cambio = totalRecibido - total
  const hayConteo = usaMontoDirecto || Object.values(cantidades).some((v) => Number(v) > 0)

  function actualizarBillete(denominacion: number, valor: string) {
    if (montoDirecto) setMontoDirecto('')
    setCantidades((prev) => ({ ...prev, [denominacion]: valor }))
  }

  return (
    <div className="gg-calc-efectivo">
      <p className="gg-calc-efectivo-titulo">¿Con qué billetes/monedas paga?</p>
      <div className={'gg-calc-efectivo-grid' + (usaMontoDirecto ? ' gg-calc-efectivo-grid--inactiva' : '')}>
        {DENOMINACIONES.map((d) => (
          <label
            key={d}
            className="gg-calc-efectivo-item"
            htmlFor={`efectivo-${d}`}
            aria-label={`Cantidad de billetes/monedas de ${formatoCOP.format(d)}`}
          >
            <BilleteIcon valor={d} />
            <input
              id={`efectivo-${d}`}
              className="gg-input"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={cantidades[d] ?? ''}
              onChange={(e) => actualizarBillete(d, e.target.value)}
              placeholder="0"
              disabled={usaMontoDirecto}
            />
          </label>
        ))}
      </div>

      <div className="gg-calc-efectivo-directo">
        <label htmlFor="efectivo-monto-directo">O escribe con cuánto paga</label>
        <input
          id="efectivo-monto-directo"
          className="gg-input"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={montoDirecto}
          onChange={(e) => setMontoDirecto(e.target.value)}
          placeholder={String(total)}
        />
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
