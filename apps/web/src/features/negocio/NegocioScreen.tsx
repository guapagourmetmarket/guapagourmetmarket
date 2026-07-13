import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { ApiError, actualizarNegocio, obtenerNegocio } from '../../lib/api'
import './negocio.css'

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
      </main>
    </div>
  )
}
