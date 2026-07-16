import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Cake, Pencil, Plus, Power, Search, Sparkles, User } from 'lucide-react'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { AppHeader } from '../../components/AppHeader'
import { cambiarEstadoCliente, obtenerCumpleanosDelMes, obtenerClientes, type Cliente } from '../../lib/api'
import { ClienteFormModal } from './ClienteFormModal'
import { ClienteDetalleModal } from './ClienteDetalleModal'
import { useConfirm } from '../../lib/confirm'
import './clientes.css'

interface ClientesScreenProps {
  onCerrarSesion: () => void
}

export function ClientesScreen({ onCerrarSesion }: ClientesScreenProps) {
  const queryClient = useQueryClient()
  const confirmar = useConfirm()
  const [busqueda, setBusqueda] = useState('')
  const [mostrarDesactivados, setMostrarDesactivados] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null)

  const {
    data: clientes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['clientes', mostrarDesactivados],
    queryFn: () => obtenerClientes(mostrarDesactivados),
  })

  const { data: cumpleanos } = useQuery({
    queryKey: ['clientes', 'cumpleanos'],
    queryFn: obtenerCumpleanosDelMes,
  })

  const mutacionEstado = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => cambiarEstadoCliente(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  })

  const idsCumpleanos = useMemo(() => new Set((cumpleanos ?? []).map((c) => c.id)), [cumpleanos])

  const clientesFiltrados = useMemo(() => {
    if (!clientes) return []
    const q = busqueda.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    )
  }, [clientes, busqueda])

  function abrirNuevo() {
    setClienteEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(c: Cliente) {
    setClienteEditando(c)
    setModalAbierto(true)
  }

  async function handleDesactivar(c: Cliente) {
    const confirmado = await confirmar(
      `¿Desactivar a "${c.nombre}"? Ya no aparecerá al registrar ventas nuevas.`,
      { peligro: true, textoConfirmar: 'Desactivar' },
    )
    if (confirmado) mutacionEstado.mutate({ id: c.id, activo: false })
  }

  return (
    <div className="gg-clientes-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-clientes-main">
        <div className="gg-clientes-toolbar">
          <h1 className="font-display gg-clientes-title">Clientes</h1>
          <Button type="button" onClick={abrirNuevo}>
            <Plus size={18} />
            Nuevo cliente
          </Button>
        </div>

        {cumpleanos && cumpleanos.length > 0 && (
          <Card className="gg-clientes-cumpleanos">
            <Cake size={18} />
            <span>
              Cumpleaños este mes: {cumpleanos.map((c) => c.nombre).join(', ')}
            </span>
          </Card>
        )}

        <div className="gg-clientes-filtros">
          <div className="gg-search">
            <Search size={18} className="gg-search-icon" />
            <input
              type="search"
              className="gg-search-input"
              placeholder="Buscar por nombre, teléfono o correo…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar clientes"
            />
          </div>
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
          <Card className="gg-clientes-estado">
            <p>Cargando clientes…</p>
          </Card>
        )}
        {isError && (
          <Card className="gg-clientes-estado">
            <p>No pudimos cargar los clientes.</p>
          </Card>
        )}
        {!isLoading && !isError && clientesFiltrados.length === 0 && (
          <Card className="gg-clientes-estado">
            <p>
              {busqueda ? 'No encontramos clientes con esa búsqueda.' : 'Todavía no tienes clientes registrados.'}
            </p>
          </Card>
        )}

        {!isLoading && !isError && clientesFiltrados.length > 0 && (
          <div className="gg-clientes-grid">
            {clientesFiltrados.map((c) => (
              <Card
                key={c.id}
                className={'gg-cliente-card' + (!c.activo ? ' gg-cliente-card--inactivo' : '')}
              >
                <div className="gg-cliente-card-header" onClick={() => setClienteDetalle(c)} role="button" tabIndex={0}>
                  <h2 className="gg-cliente-nombre">
                    <User size={16} style={{ marginRight: 6, verticalAlign: -2 }} />
                    {c.nombre}
                    {idsCumpleanos.has(c.id) && <Cake size={14} className="gg-cliente-cake" />}
                  </h2>
                  <span className="gg-cliente-puntos-chip">
                    <Sparkles size={12} />
                    {c.puntos}
                  </span>
                </div>
                <div className="gg-cliente-datos">
                  {c.telefono && <p><span>Tel. </span>{c.telefono}</p>}
                  {c.email && <p><span>Correo </span>{c.email}</p>}
                  {c.direccion && <p><span>Dir. </span>{c.direccion}</p>}
                </div>
                <div className="gg-cliente-acciones-fila">
                  <button type="button" className="gg-cliente-accion" onClick={() => setClienteDetalle(c)}>
                    Ver detalle
                  </button>
                  <button type="button" className="gg-cliente-accion" onClick={() => abrirEditar(c)}>
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="gg-cliente-accion"
                    onClick={() =>
                      c.activo ? handleDesactivar(c) : mutacionEstado.mutate({ id: c.id, activo: true })
                    }
                  >
                    <Power size={14} />
                    {c.activo ? 'Desactivar' : 'Reactivar'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {modalAbierto && (
        <ClienteFormModal cliente={clienteEditando} onClose={() => setModalAbierto(false)} />
      )}
      {clienteDetalle && (
        <ClienteDetalleModal cliente={clienteDetalle} onClose={() => setClienteDetalle(null)} />
      )}
    </div>
  )
}
