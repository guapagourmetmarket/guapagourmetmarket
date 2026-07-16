import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Categoria, Marca } from '@guapa/shared'
import { Modal } from '../../components/Modal'
import {
  ApiError,
  crearCategoria,
  crearMarca,
  eliminarCategoria,
  eliminarMarca,
  obtenerCategorias,
  obtenerMarcas,
  renombrarCategoria,
  renombrarMarca,
} from '../../lib/api'
import { useConfirm } from '../../lib/confirm'
import './gestion-categorias.css'

interface GestionCategoriasModalProps {
  onClose: () => void
}

type Item = Categoria | Marca

function ListaEditable({
  titulo,
  placeholder,
  items,
  cargando,
  onCrear,
  onRenombrar,
  onEliminar,
  creando,
}: {
  titulo: string
  placeholder: string
  items: Item[] | undefined
  cargando: boolean
  onCrear: (nombre: string) => void
  onRenombrar: (id: string, nombre: string) => void
  onEliminar: (id: string) => void
  creando: boolean
}) {
  const confirmar = useConfirm()
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nombreEdicion, setNombreEdicion] = useState('')
  const [error, setError] = useState('')

  function iniciarEdicion(item: Item) {
    setEditandoId(item.id)
    setNombreEdicion(item.nombre)
    setError('')
  }

  function confirmarEdicion() {
    if (!nombreEdicion.trim()) {
      setError('El nombre no puede estar vacío.')
      return
    }
    onRenombrar(editandoId!, nombreEdicion.trim())
    setEditandoId(null)
  }

  function handleCrear() {
    if (!nuevoNombre.trim()) return
    onCrear(nuevoNombre.trim())
    setNuevoNombre('')
  }

  async function handleEliminar(item: Item) {
    const confirmado = await confirmar(
      `¿Eliminar "${item.nombre}"? Los productos que la usan quedarán sin asignar.`,
      { peligro: true, textoConfirmar: 'Eliminar' },
    )
    if (confirmado) onEliminar(item.id)
  }

  return (
    <div className="gg-gestion-columna">
      <h3 className="gg-gestion-titulo">{titulo}</h3>

      <div className="gg-gestion-nueva">
        <input
          type="text"
          className="gg-input"
          placeholder={placeholder}
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
        />
        <button type="button" className="gg-gestion-boton-icono" onClick={handleCrear} disabled={creando}>
          <Plus size={16} />
        </button>
      </div>

      {cargando && <p className="gg-gestion-vacio">Cargando…</p>}
      {!cargando && (items?.length ?? 0) === 0 && <p className="gg-gestion-vacio">Sin registros todavía.</p>}

      <ul className="gg-gestion-lista">
        {items?.map((item) => (
          <li key={item.id} className="gg-gestion-item">
            {editandoId === item.id ? (
              <>
                <input
                  type="text"
                  className="gg-input gg-gestion-input-edicion"
                  value={nombreEdicion}
                  onChange={(e) => setNombreEdicion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmarEdicion()}
                  autoFocus
                />
                <button type="button" className="gg-gestion-boton-icono" onClick={confirmarEdicion}>
                  <Check size={15} />
                </button>
                <button type="button" className="gg-gestion-boton-icono" onClick={() => setEditandoId(null)}>
                  <X size={15} />
                </button>
              </>
            ) : (
              <>
                <span className="gg-gestion-nombre">{item.nombre}</span>
                <button type="button" className="gg-gestion-boton-icono" onClick={() => iniciarEdicion(item)}>
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="gg-gestion-boton-icono gg-gestion-boton-eliminar"
                  onClick={() => handleEliminar(item)}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {error && <p className="gg-field-error">{error}</p>}
    </div>
  )
}

export function GestionCategoriasModal({ onClose }: GestionCategoriasModalProps) {
  const queryClient = useQueryClient()

  const { data: categorias, isLoading: cargandoCategorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: obtenerCategorias,
  })
  const { data: marcas, isLoading: cargandoMarcas } = useQuery({
    queryKey: ['marcas'],
    queryFn: obtenerMarcas,
  })

  const invalidarTodo = () => {
    queryClient.invalidateQueries({ queryKey: ['categorias'] })
    queryClient.invalidateQueries({ queryKey: ['marcas'] })
    queryClient.invalidateQueries({ queryKey: ['productos'] })
  }

  const crearCategoriaMut = useMutation({ mutationFn: crearCategoria, onSuccess: invalidarTodo })
  const renombrarCategoriaMut = useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) => renombrarCategoria(id, nombre),
    onSuccess: invalidarTodo,
    onError: (err) => window.alert(err instanceof ApiError ? err.message : 'No se pudo renombrar.'),
  })
  const eliminarCategoriaMut = useMutation({
    mutationFn: eliminarCategoria,
    onSuccess: invalidarTodo,
    onError: (err) => window.alert(err instanceof ApiError ? err.message : 'No se pudo eliminar.'),
  })

  const crearMarcaMut = useMutation({ mutationFn: crearMarca, onSuccess: invalidarTodo })
  const renombrarMarcaMut = useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) => renombrarMarca(id, nombre),
    onSuccess: invalidarTodo,
    onError: (err) => window.alert(err instanceof ApiError ? err.message : 'No se pudo renombrar.'),
  })
  const eliminarMarcaMut = useMutation({
    mutationFn: eliminarMarca,
    onSuccess: invalidarTodo,
    onError: (err) => window.alert(err instanceof ApiError ? err.message : 'No se pudo eliminar.'),
  })

  return (
    <Modal title="Categorías y marcas" onClose={onClose}>
      <div className="gg-gestion-grid">
        <ListaEditable
          titulo="Categorías"
          placeholder="Nueva categoría…"
          items={categorias}
          cargando={cargandoCategorias}
          creando={crearCategoriaMut.isPending}
          onCrear={(nombre) => crearCategoriaMut.mutate(nombre)}
          onRenombrar={(id, nombre) => renombrarCategoriaMut.mutate({ id, nombre })}
          onEliminar={(id) => eliminarCategoriaMut.mutate(id)}
        />
        <ListaEditable
          titulo="Marcas"
          placeholder="Nueva marca…"
          items={marcas}
          cargando={cargandoMarcas}
          creando={crearMarcaMut.isPending}
          onCrear={(nombre) => crearMarcaMut.mutate(nombre)}
          onRenombrar={(id, nombre) => renombrarMarcaMut.mutate({ id, nombre })}
          onEliminar={(id) => eliminarMarcaMut.mutate(id)}
        />
      </div>
    </Modal>
  )
}
