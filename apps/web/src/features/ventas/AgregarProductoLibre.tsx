import { useState, type FormEvent } from 'react'
import { PackagePlus } from 'lucide-react'
import { Button } from '../../components/Button'
import './agregar-producto-libre.css'

interface AgregarProductoLibreProps {
  nombreInicial?: string
  onAgregar: (nombre: string, precio: number) => void
}

/**
 * Para un producto que todavía no está cargado en el catálogo: se escribe
 * el nombre y el precio a mano y se agrega igual a la cuenta, para no hacer
 * esperar al cliente mientras se crea el producto formalmente.
 */
export function AgregarProductoLibre({ nombreInicial = '', onAgregar }: AgregarProductoLibreProps) {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState(nombreInicial)
  const [precio, setPrecio] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const precioNum = Number(precio)
    if (!nombre.trim() || !precioNum || precioNum <= 0) return
    onAgregar(nombre.trim(), precioNum)
    setNombre('')
    setPrecio('')
    setAbierto(false)
  }

  if (!abierto) {
    return (
      <button
        type="button"
        className="gg-libre-abrir"
        onClick={() => {
          setNombre(nombreInicial)
          setAbierto(true)
        }}
      >
        <PackagePlus size={16} />
        ¿No está en el catálogo? Agrégalo con nombre y precio
      </button>
    )
  }

  return (
    <form className="gg-libre-form" onSubmit={handleSubmit}>
      <p className="gg-libre-form-titulo">Producto nuevo (sin catálogo todavía)</p>
      <input
        type="text"
        className="gg-input"
        placeholder="Nombre del producto"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        autoFocus
      />
      <input
        type="number"
        className="gg-input"
        placeholder="Precio de venta"
        min="0"
        step="1"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
      />
      <div className="gg-libre-form-acciones">
        <Button type="submit">Agregar a la cuenta</Button>
        <button type="button" className="gg-libre-cancelar" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
