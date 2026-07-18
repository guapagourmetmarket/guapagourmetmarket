import { useId } from 'react'

// Íconos de billetes/monedas colombianos: no son fotos reales (evita
// reproducir el diseño oficial ni los retratos), pero usan el mismo color
// y la misma forma (proporción de billete, aro bimetálico en las monedas
// grandes) por la que cualquier persona en Colombia ya identifica cada
// denominación de un vistazo, tanto aquí como en el modo táctil.

const COLOR_BILLETE: Record<number, { claro: string; oscuro: string }> = {
  100000: { claro: '#D34A93', oscuro: '#A32E6E' }, // rosado
  50000: { claro: '#4A9C5F', oscuro: '#2F6E42' }, // verde
  20000: { claro: '#7C4CB0', oscuro: '#582E85' }, // morado
  10000: { claro: '#E89A2C', oscuro: '#B9740F' }, // naranja
  5000: { claro: '#8C3A48', oscuro: '#5E212C' }, // vinotinto
  2000: { claro: '#6B6B6B', oscuro: '#484848' }, // gris
}

// Las monedas de $500 y $1.000 son bimetálicas de verdad (aro y centro de
// colores distintos); las de $200 y $100 son de un solo metal.
const COLOR_MONEDA: Record<number, { aro: string; centro: string }> = {
  1000: { aro: '#C9A227', centro: '#B7B7B7' },
  500: { aro: '#B7B7B7', centro: '#C9A227' },
  200: { aro: '#C9A83F', centro: '#C9A83F' },
  100: { aro: '#ABABAB', centro: '#ABABAB' },
}

function etiqueta(valor: number) {
  return valor >= 1000 ? `$${valor / 1000}k` : `$${valor}`
}

interface BilleteIconProps {
  valor: number
  className?: string
}

export function BilleteIcon({ valor, className }: BilleteIconProps) {
  const id = useId()
  const texto = etiqueta(valor)

  if (valor >= 2000) {
    const { claro, oscuro } = COLOR_BILLETE[valor] ?? { claro: '#6B6B6B', oscuro: '#484848' }
    const gradId = `gg-billete-grad-${id}`
    return (
      <svg
        viewBox="0 0 70 34"
        width="70"
        height="34"
        className={'gg-billete-icon' + (className ? ` ${className}` : '')}
        role="img"
        aria-label={`Billete de ${texto}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={claro} />
            <stop offset="100%" stopColor={oscuro} />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="68" height="32" rx="4" fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.2)" />
        <rect
          x="4"
          y="4"
          width="62"
          height="26"
          rx="2"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeDasharray="1.5 1.5"
        />
        {/* Franja diagonal clara, sugiere la marca de agua sin copiar ninguna. */}
        <path d="M46 4 L60 4 L38 30 L24 30 Z" fill="rgba(255,255,255,0.14)" />
        <circle cx="52" cy="17" r="7" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
        <text x="9" y="11" fontSize="6" fontWeight="700" fill="rgba(255,255,255,0.85)">
          $
        </text>
        <text x="10" y="29" fontSize="6" fontWeight="700" fill="rgba(255,255,255,0.85)">
          $
        </text>
        <text x="30" y="21" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">
          {texto}
        </text>
      </svg>
    )
  }

  const { aro, centro } = COLOR_MONEDA[valor] ?? { aro: '#A8A8A8', centro: '#A8A8A8' }
  const esBimetalica = aro !== centro
  const gradAro = `gg-moneda-aro-${id}`
  const gradCentro = `gg-moneda-centro-${id}`
  return (
    <svg
      viewBox="0 0 38 38"
      width="38"
      height="38"
      className={'gg-billete-icon' + (className ? ` ${className}` : '')}
      role="img"
      aria-label={`Moneda de ${texto}`}
    >
      <defs>
        <radialGradient id={gradAro} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="45%" stopColor={aro} stopOpacity="0" />
          <stop offset="100%" stopColor={aro} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={gradCentro} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="60%" stopColor={centro} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="19" cy="19" r="17" fill={aro} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <circle cx="19" cy="19" r="17" fill={`url(#${gradAro})`} />
      {esBimetalica && (
        <>
          <circle cx="19" cy="19" r="11.5" fill={centro} stroke="rgba(0,0,0,0.2)" strokeWidth="0.75" />
          <circle cx="19" cy="19" r="11.5" fill={`url(#${gradCentro})`} />
        </>
      )}
      <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(0,0,0,0.12)" strokeDasharray="1 1.6" />
      <text x="19" y="23" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="rgba(0,0,0,0.72)">
        {texto}
      </text>
    </svg>
  )
}
