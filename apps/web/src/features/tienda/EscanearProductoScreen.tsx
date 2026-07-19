import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, ScanLine } from 'lucide-react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { DetalleProductoModal } from '../../components/DetalleProductoModal'
import { EscanearCamara, type EscanearCamaraHandle } from '../../components/EscanearCamara'
import { obtenerProductosPublico, type ProductoPublico } from '../../lib/api'
import { useCarritoPublico } from '../../lib/carritoPublico'
import { brand } from '../../theme/theme'
import '../../components/app-header.css'
import './tienda.css'
import './escanear.css'

export function EscanearProductoScreen() {
  const camaraRef = useRef<EscanearCamaraHandle>(null)
  const carrito = useCarritoPublico()
  const [codigoSinMatch, setCodigoSinMatch] = useState('')
  const [productoEncontrado, setProductoEncontrado] = useState<ProductoPublico | null>(null)

  const { data: productos } = useQuery({
    queryKey: ['productos-publico'],
    queryFn: obtenerProductosPublico,
  })

  function manejarDetectado(codigo: string) {
    const encontrado = (productos ?? []).find((p) => p.codigoBarras === codigo)
    if (encontrado) {
      setCodigoSinMatch('')
      setProductoEncontrado(encontrado)
    } else {
      setCodigoSinMatch(codigo)
    }
  }

  function seguirEscaneando() {
    setCodigoSinMatch('')
    camaraRef.current?.reanudar()
  }

  return (
    <div className="gg-productos-page">
      <header className="gg-header">
        <div className="gg-header-marca">
          <div className="gg-header-marca-fila">
            <img src={brand.logo.hi} alt={brand.name} width={64} height={64} />
            <span className="font-display gg-header-marca-nombre">{brand.name}</span>
          </div>
        </div>
      </header>

      <main className="gg-pedido-web-main">
        <Link to="/tienda" className="gg-escanear-volver">
          <ArrowLeft size={16} />
          Volver a la tienda
        </Link>

        <h1 className="font-display gg-pedido-web-title">Escanear producto</h1>
        <p className="gg-pedido-web-subtitulo">
          Apunta la cámara al código de barras del empaque para ver el producto, su descripción y si
          hay disponible en tienda.
        </p>

        <Card className="gg-escanear-camara-card">
          <EscanearCamara ref={camaraRef} onDetectado={manejarDetectado} />
        </Card>

        {codigoSinMatch && (
          <div className="gg-escanear-no-encontrado">
            <ScanLine size={22} />
            <p>No encontramos ningún producto con el código "{codigoSinMatch}".</p>
            <Button type="button" onClick={seguirEscaneando}>
              Seguir escaneando
            </Button>
          </div>
        )}
      </main>

      {productoEncontrado && (
        <DetalleProductoModal
          producto={productoEncontrado}
          onClose={() => {
            setProductoEncontrado(null)
            camaraRef.current?.reanudar()
          }}
          onAgregar={
            productoEncontrado.disponible
              ? () => {
                  carrito.agregarProducto(productoEncontrado)
                  setProductoEncontrado(null)
                  camaraRef.current?.reanudar()
                }
              : undefined
          }
          textoAgregar="Agregar al pedido"
        />
      )}
    </div>
  )
}
