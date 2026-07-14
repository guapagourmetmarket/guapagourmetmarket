import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { Check, Download, QrCode } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ApiError, actualizarNegocio, obtenerNegocio } from '../../lib/api'
import { brand } from '../../theme/theme'
import './negocio.css'

const ENLACE_PUBLICO = `${brand.publicUrl}/enlaces`

interface NegocioScreenProps {
  onCerrarSesion: () => void
}

export function NegocioScreen({ onCerrarSesion }: NegocioScreenProps) {
  const queryClient = useQueryClient()
  const { data: negocio } = useQuery({ queryKey: ['negocio'], queryFn: obtenerNegocio })

  const [nombre, setNombre] = useState('')
  const [nit, setNit] = useState('')
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [guardado, setGuardado] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(ENLACE_PUBLICO, {
      width: 480,
      margin: 2,
      color: { dark: '#2E332C', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''))
  }, [])

  useEffect(() => {
    if (!negocio) return
    setNombre(negocio.nombre)
    setNit(negocio.nit)
    setDireccion(negocio.direccion ?? '')
    setTelefono(negocio.telefono ?? '')
  }, [negocio])

  const mutacion = useMutation({
    mutationFn: actualizarNegocio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negocio'] })
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    mutacion.mutate({
      nombre: nombre.trim(),
      nit: nit.trim(),
      direccion: direccion.trim() || undefined,
      telefono: telefono.trim() || undefined,
    })
  }

  return (
    <div className="gg-negocio-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-negocio-main">
        <Card className="gg-negocio-card">
          <h1 className="font-display gg-negocio-title">Datos del negocio</h1>
          <p className="gg-negocio-subtitulo">
            Esta información aparece en los recibos de venta.
          </p>

          <form onSubmit={handleSubmit} noValidate className="gg-negocio-form">
            <Input
              label="Nombre del negocio"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <Input label="NIT" type="text" value={nit} onChange={(e) => setNit(e.target.value)} />
            <Input
              label="Dirección"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
            <Input
              label="Teléfono"
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />

            <div className="gg-negocio-acciones">
              <Button type="submit" disabled={mutacion.isPending}>
                {mutacion.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              {guardado && (
                <span className="gg-negocio-guardado">
                  <Check size={16} />
                  Guardado
                </span>
              )}
            </div>

            {mutacion.isError && (
              <p className="gg-field-error">
                {mutacion.error instanceof ApiError
                  ? mutacion.error.message
                  : 'No pudimos guardar los cambios. Intenta de nuevo.'}
              </p>
            )}
          </form>
        </Card>

        <Card className="gg-negocio-card">
          <h1 className="font-display gg-negocio-title">
            <QrCode size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Código QR de contacto
          </h1>
          <p className="gg-negocio-subtitulo">
            Imprímelo y ponlo en el mostrador: al escanearlo, tus clientes ven un menú con el
            catálogo, WhatsApp, redes sociales y cómo llegar — sin necesitar clave.
          </p>

          {qrDataUrl && (
            <div className="gg-negocio-qr">
              <img src={qrDataUrl} alt="Código QR hacia la página de contacto" width={220} height={220} />
              <a href={qrDataUrl} download="codigo-qr-guapa-gourmet.png">
                <Button type="button" variant="secondary">
                  <Download size={16} />
                  Descargar código QR
                </Button>
              </a>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
