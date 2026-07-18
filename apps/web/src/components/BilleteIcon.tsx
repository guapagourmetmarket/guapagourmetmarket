// Íconos de billetes/monedas colombianos: no son fotos reales (evita
// reproducir el diseño oficial), pero usan el mismo color por el que
// cualquier persona en Colombia ya identifica cada denominación de un
// vistazo, para reconocerlos rápido tanto en el modo táctil como aquí.

const COLOR_BILLETE: Record<number, string> = {
  100000: '#C13A82', // rosado
  50000: '#3E8C55', // verde
  20000: '#6B3FA0', // morado
  10000: '#DB8A1E', // naranja
  5000: '#7A2E3A', // vinotinto
  2000: '#5B5B5B', // gris
}

const COLOR_MONEDA: Record<number, string> = {
  1000: '#A9791B',
  500: '#B8A26A',
  200: '#C9AD4A',
  100: '#A8A8A8',
}

function etiqueta(valor: number) {
  return valor >= 1000 ? `$${valor / 1000}k` : `$${valor}`
}

interface BilleteIconProps {
  valor: number
  className?: string
}

export function BilleteIcon({ valor, className }: BilleteIconProps) {
  const texto = etiqueta(valor)

  if (valor >= 2000) {
    const color = COLOR_BILLETE[valor] ?? '#6B6B6B'
    return (
      <svg
        viewBox="0 0 64 38"
        width="64"
        height="38"
        className={'gg-billete-icon' + (className ? ` ${className}` : '')}
        role="img"
        aria-label={`Billete de ${texto}`}
      >
        <rect x="1" y="1" width="62" height="36" rx="6" fill={color} stroke="rgba(0,0,0,0.18)" />
        <rect
          x="5"
          y="5"
          width="54"
          height="28"
          rx="3"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeDasharray="2 2"
        />
        <circle cx="48" cy="19" r="8" fill="rgba(255,255,255,0.22)" />
        <text x="32" y="24" textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff">
          {texto}
        </text>
      </svg>
    )
  }

  const color = COLOR_MONEDA[valor] ?? '#A8A8A8'
  return (
    <svg
      viewBox="0 0 38 38"
      width="38"
      height="38"
      className={'gg-billete-icon' + (className ? ` ${className}` : '')}
      role="img"
      aria-label={`Moneda de ${texto}`}
    >
      <circle cx="19" cy="19" r="17" fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
      <circle cx="19" cy="19" r="12.5" fill="none" stroke="rgba(255,255,255,0.4)" />
      <text x="19" y="23" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff">
        {texto}
      </text>
    </svg>
  )
}
