import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Pencil, Plus, Power } from 'lucide-react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { AppHeader } from '../../components/AppHeader'
import { cambiarEstadoProveedor, obtenerProveedores, type Proveedor } from '../../lib/api'
import { ProveedorFormModal } from './ProveedorFormModal'
import './proveedores.css'

interface ProveedoresScreenProps {
  onCerrarSesion: () => void
}

export function ProveedoresScreen({ onCerrarSesion }: ProveedoresScreenProps) {
  const queryClient = useQueryClient()
  const [mostrarDesactivados, setMostrarDesactivados] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null)

  const {
    data: proveedores,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['proveedores', mostrarDesactivados],
    queryFn: () => obtenerProveedores(mostrarDesactivados),
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      cambiarEstadoProveedor(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proveedores'] }),
  })

  function abrirNuevo() {
    setProveedorEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(p: Proveedor) {
    setProveedorEditando(p)
    setModalAbierto(true)
  }

  function handleDesactivar(p: Proveedor) {
    const confirmado = window.confirm(`¿Desactivar "${p.nombre}"? Ya no aparecerá al registrar compras nuevas.`)
    if (confirmado) mutacionEstado.mutate({ id: p.id, activo: false })
  }

  return (
    <div className="gg-proveedores-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-proveedores-main">
        <div className="gg-proveedores-toolbar">
          <h1 className="font-display gg-proveedores-title">Proveedores</h1>
          <Button type="button" onClick={abrirNuevo}>
            <Plus size={18} />
            Nuevo proveedor
          </Button>
        </div>

        <div className="gg-proveedores-filtros">
          <label className="gg-toggle-desactivados">
            <input
              type="checkbox"
              checked={mostrarDesactivados}
              onChange={(e) => setMostrarDesactivados(e.target.checked)}
            />
            Mostrar desactivados
          </label>
        </div>

        {isLoading && (
          <Card className="gg-proveedores-estado">
            <p>Cargando proveedores…</p>
          </Card>
        )}
        {isError && (
          <Card className="gg-proveedores-estado">
            <p>No pudimos cargar los proveedores.</p>
          </Card>
        )}
        {!isLoading && !isError && proveedores?.length === 0 && (
          <Card className="gg-proveedores-estado">
            <p>Todavía no tienes proveedores registrados.</p>
          </Card>
        )}

        {!isLoading && !isError && proveedores && proveedores.length > 0 && (
          <div className="gg-proveedores-grid">
            {proveedores.map((p) => (
              <Card
                key={p.id}
                className={'gg-proveedor-card' + (!p.activo ? ' gg-proveedor-card--inactivo' : '')}
              >
                <div>
                  <h2 className="gg-proveedor-nombre">
                    <Building2 size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
                    {p.nombre}
                  </h2>
                  {p.nit && <p className="gg-proveedor-nit">NIT {p.nit}</p>}
                </div>
                <div className="gg-proveedor-datos">
                  {p.telefono && <p><span>Tel. </span>{p.telefono}</p>}
                  {p.email && <p><span>Correo </span>{p.email}</p>}
                  {p.direccion && <p><span>Dir. </span>{p.direccion}</p>}
                </div>
                {p.condicionesPago && (
                  <span className="gg-proveedor-condiciones">{p.condicionesPago}</span>
                )}
                <div className="gg-proveedor-acciones-fila">
                  <button type="button" className="gg-proveedor-accion" onClick={() => abrirEditar(p)}>
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="gg-proveedor-accion"
                    onClick={() =>
                      p.activo ? handleDesactivar(p) : mutacionEstado.mutate({ id: p.id, activo: true })
                    }
                  >
                    <Power size={14} />
                    {p.activo ? 'Desactivar' : 'Reactivar'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {modalAbierto && (
        <ProveedorFormModal proveedor={proveedorEditando} onClose={() => setModalAbierto(false)} />
      )}
    </div>
  )
}
