import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { AlertTriangle, ArrowLeft, ScanLine } from 'lucide-react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { DetalleProductoModal } from '../../components/DetalleProductoModal'
import { obtenerProductosPublico, type ProductoPublico } from '../../lib/api'
import { useCarritoPublico } from '../../lib/carritoPublico'
import { brand } from '../../theme/theme'
import '../../components/app-header.css'
import './tienda.css'
import './escanear.css'

type Estado = 'iniciando' | 'escaneando' | 'sin-camara' | 'no-encontrado'

export function EscanearProductoScreen() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const carrito = useCarritoPublico()
  const [estado, setEstado] = useState<Estado>('iniciando')
  const [codigoSinMatch, setCodigoSinMatch] = useState('')
  const [productoEncontrado, setProductoEncontrado] = useState<ProductoPublico | null>(null)

  const { data: productos } = useQuery({
    queryKey: ['productos-publico'],
    queryFn: obtenerProductosPublico,
  })

  function detenerCamara() {
    controlsRef.current?.stop()
    controlsRef.current = null
  }

  function iniciarCamara() {
    const reader = new BrowserMultiFormatReader()
    setEstado('iniciando')
    reader
      .decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        videoRef.current!,
        (resultado) => {
          if (!resultado) return
          const codigo = resultado.getText()
          const encontrado = (productos ?? []).find(
            (p) => p.codigoBarras === codigo,
          )
          detenerCamara()
          if (encontrado) {
            setProductoEncontrado(encontrado)
          } else {
            setCodigoSinMatch(codigo)
            setEstado('no-encontrado')
          }
        },
      )
      .then((controls) => {
        controlsRef.current = controls
        setEstado('escaneando')
      })
      .catch(() => {
        setEstado('sin-camara')
      })
  }

  useEffect(() => {
    iniciarCamara()
    return () => detenerCamara()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos])

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
          <div className="gg-escanear-camara">
            <video ref={videoRef} className="gg-escanear-video" muted playsInline />
            {estado === 'escaneando' && <div className="gg-escanear-marco" />}
            {estado === 'iniciando' && (
              <div className="gg-escanear-overlay">
                <p>Activando la cámara…</p>
              </div>
            )}
            {estado === 'sin-camara' && (
              <div className="gg-escanear-overlay">
                <AlertTriangle size={28} />
                <p>
                  No pudimos usar la cámara. Revisa que le hayas dado permiso a este sitio, o busca el
                  producto directamente en la tienda.
                </p>
                <Button type="button" variant="secondary" onClick={iniciarCamara}>
                  Intentar de nuevo
                </Button>
              </div>
            )}
            {estado === 'no-encontrado' && (
              <div className="gg-escanear-overlay">
                <ScanLine size={28} />
                <p>No encontramos ningún producto con el código "{codigoSinMatch}".</p>
                <Button type="button" onClick={iniciarCamara}>
                  Seguir escaneando
                </Button>
              </div>
            )}
          </div>
        </Card>
      </main>

      {productoEncontrado && (
        <DetalleProductoModal
          producto={productoEncontrado}
          onClose={() => {
            setProductoEncontrado(null)
            iniciarCamara()
          }}
          onAgregar={
            productoEncontrado.disponible
              ? () => {
                  carrito.agregarProducto(productoEncontrado)
                  setProductoEncontrado(null)
                  iniciarCamara()
                }
              : undefined
          }
          textoAgregar="Agregar al pedido"
        />
      )}
    </div>
  )
}
