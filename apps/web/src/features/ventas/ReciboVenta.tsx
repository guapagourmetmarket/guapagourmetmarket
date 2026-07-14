import type { Negocio, Venta } from '../../lib/api'
import { brand } from '../../theme/theme'
import './recibo.css'

interface ReciboVentaProps {
  venta: Venta
  negocio: Negocio | null | undefined
}

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const METODOS_PAGO_LABEL: Record<Venta['metodoPago'], string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  mixto: 'Mixto',
}

function formatoFecha(fecha: string) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export function ReciboVenta({ venta, negocio }: ReciboVentaProps) {
  const totalItems = venta.items.reduce((acc, item) => acc + item.subtotal, 0)
  const subtotal = venta.valor + venta.descuento
  const valorLibre = subtotal - totalItems
  const ivaIncluido = venta.items.reduce(
    (acc, item) => acc + (item.subtotal - item.subtotal / (1 + item.iva / 100)),
    0,
  )

  return (
    <div className="gg-recibo-imprimible">
      <div className="gg-recibo-header">
        <p className="gg-recibo-negocio">{negocio?.nombre ?? brand.name}</p>
        {negocio?.nit && <p>NIT {negocio.nit}</p>}
        {negocio?.direccion && <p>{negocio.direccion}</p>}
        {negocio?.telefono && <p>Tel. {negocio.telefono}</p>}
      </div>

      <div className="gg-recibo-linea" />

      <div className="gg-recibo-meta">
        <p>Recibo de venta No. {venta.numero}</p>
        <p>{formatoFecha(venta.fecha)}</p>
        {venta.clienteNombre && <p>Cliente: {venta.clienteNombre}</p>}
      </div>

      <div className="gg-recibo-linea" />

      <table className="gg-recibo-tabla">
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Descripción</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {venta.items.map((item) => (
            <tr key={item.id}>
              <td>{item.cantidad}</td>
              <td>{item.nombreProducto}</td>
              <td>{formatoCOP.format(item.subtotal)}</td>
            </tr>
          ))}
          {venta.descripcion && (
            <tr>
              <td>—</td>
              <td>{venta.descripcion}</td>
              <td>{formatoCOP.format(valorLibre)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="gg-recibo-linea" />

      {venta.descuento > 0 && (
        <div className="gg-recibo-fila">
          <span>Subtotal</span>
          <span>{formatoCOP.format(subtotal)}</span>
        </div>
      )}
      {venta.descuento > 0 && (
        <div className="gg-recibo-fila">
          <span>Descuento</span>
          <span>−{formatoCOP.format(venta.descuento)}</span>
        </div>
      )}
      {ivaIncluido > 0 && (
        <div className="gg-recibo-fila">
          <span>IVA incluido (aprox.)</span>
          <span>{formatoCOP.format(ivaIncluido)}</span>
        </div>
      )}
      <div className="gg-recibo-fila gg-recibo-total">
        <span>Total</span>
        <span>{formatoCOP.format(venta.valor)}</span>
      </div>
      <div className="gg-recibo-fila">
        <span>Método de pago</span>
        <span>{METODOS_PAGO_LABEL[venta.metodoPago]}</span>
      </div>
    </div>
  )
}
