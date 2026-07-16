import './skeleton.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string
  className?: string
}

/** Bloque que "respira" mientras algo carga, en vez de un texto plano. */
export function Skeleton({ width = '100%', height = 16, radius, className }: SkeletonProps) {
  return (
    <span
      className={['gg-skeleton', className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius: radius }}
    />
  )
}

/** Fila tipo "ícono + dos líneas de texto" — imita gg-gasto-item / gg-venta-item. */
export function SkeletonFila({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <div className="gg-skeleton-lista">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="gg-skeleton-fila">
          <Skeleton width={32} height={32} radius="50%" />
          <div className="gg-skeleton-fila-textos">
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={11} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Grilla de tarjetas — imita gg-producto-card. */
export function SkeletonTarjetas({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div className="gg-skeleton-tarjetas">
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className="gg-skeleton-tarjeta">
          <Skeleton height={96} radius="var(--radius-md)" />
          <Skeleton width="70%" height={13} />
          <Skeleton width="45%" height={16} />
        </div>
      ))}
    </div>
  )
}

/** Filas de tabla — imita las tablas de Reportes/Contabilidad. */
export function SkeletonTabla({ filas = 5, columnas = 4 }: { filas?: number; columnas?: number }) {
  return (
    <div className="gg-skeleton-tabla">
      {Array.from({ length: filas }).map((_, i) => (
        <div key={i} className="gg-skeleton-tabla-fila">
          {Array.from({ length: columnas }).map((_, j) => (
            <Skeleton key={j} height={13} />
          ))}
        </div>
      ))}
    </div>
  )
}
