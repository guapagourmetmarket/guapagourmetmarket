import { useEffect, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, ScanBarcode, Star, Trash2 } from 'lucide-react'
import type { InfoNutricional } from '@guapa/shared'
import { AppHeader } from '../../components/AppHeader'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { RecortarFotoModal } from '../../components/RecortarFotoModal'
import {
  ApiError,
  actualizarProducto,
  crearCategoria,
  crearMarca,
  crearProducto,
  eliminarImagenProducto,
  marcarImagenPrincipal,
  obtenerCategorias,
  obtenerMarcas,
  obtenerProducto,
  subirImagenProducto,
} from '../../lib/api'
import { KardexProducto } from './KardexProducto'
import './nuevo-producto.css'

interface ProductoFormScreenProps {
  onCerrarSesion: () => void
}

const IVAS = [0, 5, 19] as const

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const CAMPOS_NUTRICIONALES: { clave: keyof InfoNutricional; label: string }[] = [
  { clave: 'calorias', label: 'Calorías' },
  { clave: 'proteinaG', label: 'Proteína (g)' },
  { clave: 'grasaG', label: 'Grasa (g)' },
  { clave: 'carbohidratosG', label: 'Carbohidratos (g)' },
  { clave: 'azucaresG', label: 'Azúcares (g)' },
  { clave: 'sodioMg', label: 'Sodio (mg)' },
]

function bloquearEnter(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') e.preventDefault()
}

// Misma fórmula que usa el reporte de márgenes: rentabilidad sobre el
// precio de venta, no sobre el costo — así el número coincide en toda
// la app.
function calcularRentabilidad(compra: number, venta: number): string {
  if (compra <= 0 || venta <= 0) return ''
  return (((venta - compra) / venta) * 100).toFixed(1)
}

function calcularPrecioVentaDesdeRentabilidad(compra: number, rentabilidadPct: number): string {
  if (compra <= 0 || Number.isNaN(rentabilidadPct) || rentabilidadPct >= 100) return ''
  return String(Math.round(compra / (1 - rentabilidadPct / 100)))
}

export function ProductoFormScreen({ onCerrarSesion }: ProductoFormScreenProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const editando = Boolean(id)

  const { data: productoExistente } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => obtenerProducto(id!),
    enabled: editando,
  })
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: obtenerCategorias })
  const { data: marcas } = useQuery({ queryKey: ['marcas'], queryFn: obtenerMarcas })

  const [codigoInterno, setCodigoInterno] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaNombre, setCategoriaNombre] = useState('')
  const [marcaNombre, setMarcaNombre] = useState('')
  const [unidadMedida, setUnidadMedida] = useState('unidad')
  const [precioCompra, setPrecioCompra] = useState('')
  const [precioVenta, setPrecioVenta] = useState('')
  const [rentabilidad, setRentabilidad] = useState('')
  const [iva, setIva] = useState<(typeof IVAS)[number]>(0)
  const [existencias, setExistencias] = useState('0')
  const [stockMinimo, setStockMinimo] = useState('0')
  const [vendePorPeso, setVendePorPeso] = useState(false)
  const [tipoPromocion, setTipoPromocion] = useState<'ninguna' | 'descuento' | 'nxm'>('ninguna')
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState('')
  const [promocionN, setPromocionN] = useState('')
  const [promocionM, setPromocionM] = useState('')
  const [ingredientes, setIngredientes] = useState('')
  const [peso, setPeso] = useState('')
  const [pesoUnidad, setPesoUnidad] = useState('g')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [nutricional, setNutricional] = useState<Record<string, string>>({})
  const [fotos, setFotos] = useState<File[]>([])
  const [fotosPreview, setFotosPreview] = useState<string[]>([])
  const [error, setError] = useState('')
  const [tareaRecorte, setTareaRecorte] = useState<{
    archivos: File[]
    indice: number
    resultados: File[]
    onCompletado: (archivos: File[]) => void
  } | null>(null)

  useEffect(() => {
    if (!productoExistente) return
    setCodigoInterno(productoExistente.codigoInterno)
    setCodigoBarras(productoExistente.codigoBarras ?? '')
    setNombre(productoExistente.nombre)
    setDescripcion(productoExistente.descripcion ?? '')
    setCategoriaNombre(productoExistente.categoriaNombre)
    setMarcaNombre(productoExistente.marcaNombre ?? '')
    setUnidadMedida(productoExistente.unidadMedida)
    setPrecioCompra(String(productoExistente.precioCompra))
    setPrecioVenta(String(productoExistente.precioVenta))
    setRentabilidad(calcularRentabilidad(productoExistente.precioCompra, productoExistente.precioVenta))
    setIva(productoExistente.iva)
    setExistencias(String(productoExistente.existencias))
    setStockMinimo(String(productoExistente.stockMinimo ?? 0))
    setVendePorPeso(productoExistente.vendePorPeso ?? false)
    setDescuentoPorcentaje(
      productoExistente.descuentoPorcentaje != null ? String(productoExistente.descuentoPorcentaje) : '',
    )
    setPromocionN(productoExistente.promocionN != null ? String(productoExistente.promocionN) : '')
    setPromocionM(productoExistente.promocionM != null ? String(productoExistente.promocionM) : '')
    setTipoPromocion(
      productoExistente.promocionN != null
        ? 'nxm'
        : productoExistente.descuentoPorcentaje != null
          ? 'descuento'
          : 'ninguna',
    )
    setIngredientes(productoExistente.ingredientes ?? '')
    setPeso(productoExistente.peso != null ? String(productoExistente.peso) : '')
    setPesoUnidad(productoExistente.pesoUnidad ?? 'g')
    setFechaVencimiento(productoExistente.fechaVencimiento ?? '')
    const infoPrevia = productoExistente.infoNutricional ?? {}
    setNutricional(
      Object.fromEntries(
        CAMPOS_NUTRICIONALES.map(({ clave }) => [
          clave,
          infoPrevia[clave as keyof typeof infoPrevia] != null
            ? String(infoPrevia[clave as keyof typeof infoPrevia])
            : '',
        ]),
      ),
    )
  }, [productoExistente])

  function iniciarRecorte(archivos: File[], onCompletado: (archivos: File[]) => void) {
    if (archivos.length === 0) return
    setTareaRecorte({ archivos, indice: 0, resultados: [], onCompletado })
  }

  function manejarRecorteListo(archivoRecortado: File) {
    setTareaRecorte((tarea) => {
      if (!tarea) return tarea
      const resultados = [...tarea.resultados, archivoRecortado]
      const siguiente = tarea.indice + 1
      if (siguiente >= tarea.archivos.length) {
        tarea.onCompletado(resultados)
        return null
      }
      return { ...tarea, indice: siguiente, resultados }
    })
  }

  function manejarRecorteCancelado() {
    setTareaRecorte((tarea) => {
      if (!tarea) return tarea
      const siguiente = tarea.indice + 1
      if (siguiente >= tarea.archivos.length) {
        if (tarea.resultados.length > 0) tarea.onCompletado(tarea.resultados)
        return null
      }
      return { ...tarea, indice: siguiente }
    })
  }

  function handleFotos(e: ChangeEvent<HTMLInputElement>) {
    const nuevos = Array.from(e.target.files ?? [])
    e.target.value = ''
    iniciarRecorte(nuevos, (recortados) => {
      setFotos((prev) => [...prev, ...recortados])
      setFotosPreview((prev) => [...prev, ...recortados.map((a) => URL.createObjectURL(a))])
    })
  }

  // Precio de compra, precio de venta y rentabilidad quedan enlazados: se
  // puede escribir cualquiera de las dos formas — compra + venta (la
  // rentabilidad se calcula sola) o compra + la rentabilidad que se quiere
  // ganar (el precio de venta se calcula solo).
  function handlePrecioCompra(valor: string) {
    setPrecioCompra(valor)
    const compraNum = Number(valor) || 0
    const ventaNum = Number(precioVenta) || 0
    if (compraNum > 0 && ventaNum > 0) setRentabilidad(calcularRentabilidad(compraNum, ventaNum))
  }

  function handlePrecioVenta(valor: string) {
    setPrecioVenta(valor)
    const compraNum = Number(precioCompra) || 0
    const ventaNum = Number(valor) || 0
    if (compraNum > 0 && ventaNum > 0) setRentabilidad(calcularRentabilidad(compraNum, ventaNum))
  }

  function handleRentabilidad(valor: string) {
    setRentabilidad(valor)
    const compraNum = Number(precioCompra) || 0
    const rentNum = Number(valor)
    if (compraNum > 0 && valor.trim() !== '' && !Number.isNaN(rentNum)) {
      const ventaCalculada = calcularPrecioVentaDesdeRentabilidad(compraNum, rentNum)
      if (ventaCalculada) setPrecioVenta(ventaCalculada)
    }
  }

  function quitarFotoPendiente(indice: number) {
    setFotos((prev) => prev.filter((_, i) => i !== indice))
    setFotosPreview((prev) => {
      URL.revokeObjectURL(prev[indice])
      return prev.filter((_, i) => i !== indice)
    })
  }

  const mutacionSubirFoto = useMutation({
    mutationFn: ({ productoId, archivo }: { productoId: string; archivo: File }) =>
      subirImagenProducto(productoId, archivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producto', id] }),
  })

  const mutacionImagenPrincipal = useMutation({
    mutationFn: (imagenId: string) => marcarImagenPrincipal(id!, imagenId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producto', id] }),
  })

  const mutacionEliminarImagen = useMutation({
    mutationFn: (imagenId: string) => eliminarImagenProducto(id!, imagenId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['producto', id] }),
  })

  async function resolverCategoriaId(): Promise<string> {
    const nombre = categoriaNombre.trim()
    const existente = categorias?.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase())
    if (existente) return existente.id
    const creada = await crearCategoria(nombre)
    queryClient.invalidateQueries({ queryKey: ['categorias'] })
    return creada.id
  }

  async function resolverMarcaId(): Promise<string | undefined> {
    const nombre = marcaNombre.trim()
    if (!nombre) return undefined
    const existente = marcas?.find((m) => m.nombre.toLowerCase() === nombre.toLowerCase())
    if (existente) return existente.id
    const creada = await crearMarca(nombre)
    queryClient.invalidateQueries({ queryKey: ['marcas'] })
    return creada.id
  }

  function datosNutricion() {
    const entradas = CAMPOS_NUTRICIONALES.map(({ clave }) => [clave, nutricional[clave]] as const).filter(
      ([, v]) => v && v.trim() !== '',
    )
    if (entradas.length === 0) return undefined
    return Object.fromEntries(entradas.map(([k, v]) => [k, Number(v)]))
  }

  async function datosFormulario() {
    const [categoriaId, marcaId] = await Promise.all([resolverCategoriaId(), resolverMarcaId()])
    return {
      codigoInterno: codigoInterno.trim(),
      codigoBarras: codigoBarras.trim() || undefined,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      categoriaId,
      marcaId,
      unidadMedida: unidadMedida.trim() || 'unidad',
      precioCompra: Number(precioCompra) || 0,
      precioVenta: Number(precioVenta) || 0,
      iva,
      existencias: Number(existencias) || 0,
      stockMinimo: Number(stockMinimo) || 0,
      vendePorPeso,
      // null (no undefined) a propósito: así, si se borra el campo, se
      // manda explícitamente y se quita el descuento activo en vez de que
      // "campo vacío" simplemente no se envíe y la oferta se quede pegada.
      // Las dos promociones son excluyentes: solo se manda la que esté
      // activa según el selector, la otra siempre va en null.
      descuentoPorcentaje: tipoPromocion === 'descuento' && descuentoPorcentaje.trim() ? Number(descuentoPorcentaje) : null,
      promocionN: tipoPromocion === 'nxm' && promocionN.trim() ? Number(promocionN) : null,
      promocionM: tipoPromocion === 'nxm' && promocionM.trim() ? Number(promocionM) : null,
      ingredientes: ingredientes.trim() || undefined,
      infoNutricional: datosNutricion(),
      peso: peso.trim() ? Number(peso) : undefined,
      pesoUnidad: peso.trim() ? pesoUnidad : undefined,
      // null a propósito (no undefined): borrar la fecha quita la alerta ya
      // activada en vez de dejarla pegada.
      fechaVencimiento: fechaVencimiento.trim() || null,
    }
  }

  const mutacionCrear = useMutation({
    mutationFn: async () => crearProducto(await datosFormulario()),
    onSuccess: async (creado) => {
      // Una por una y en orden: la primera que suba queda como principal
      // (así lo decide el backend), en el mismo orden en que las agregó.
      for (const archivo of fotos) {
        await subirImagenProducto(creado.id, archivo)
      }
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      navigate('/productos')
    },
  })

  const mutacionActualizar = useMutation({
    mutationFn: async () => actualizarProducto(id!, await datosFormulario()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['producto', id] })
      navigate('/productos')
    },
  })

  const mutacion = editando ? mutacionActualizar : mutacionCrear

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!codigoInterno.trim() || !nombre.trim() || !categoriaNombre.trim()) {
      setError('Completa al menos código interno, nombre y categoría.')
      return
    }

    if (!(Number(precioCompra) > 0) || !(Number(precioVenta) > 0)) {
      setError(
        'Escribe el precio de compra y el precio de venta (ambos mayores a $0): sin esos dos datos no se puede calcular la rentabilidad del producto.',
      )
      return
    }

    if (tipoPromocion === 'descuento' && !(Number(descuentoPorcentaje) > 0)) {
      setError('Escribe el % de descuento de la oferta.')
      return
    }

    if (tipoPromocion === 'nxm') {
      const n = Number(promocionN)
      const m = Number(promocionM)
      if (!(n >= 2) || !(m >= 1)) {
        setError('Completa "Lleva" y "Paga" de la promoción.')
        return
      }
      if (m >= n) {
        setError('En "Lleva N, paga M", M debe ser menor que N (si no, no es una promoción).')
        return
      }
    }

    mutacion.mutate()
  }

  const imagenes = productoExistente?.imagenes ?? []

  return (
    <div className="gg-nuevo-producto-page">
      <AppHeader onCerrarSesion={onCerrarSesion} />

      <main className="gg-nuevo-producto-main">
        <Card className="gg-nuevo-producto-card">
          <h1 className="font-display gg-nuevo-producto-title">
            {editando ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <p className="gg-nuevo-producto-subtitulo">
            <ScanBarcode size={16} />
            Escanea el código de barras con tu lector o escríbelo a mano.
          </p>

          <form onSubmit={handleSubmit} noValidate className="gg-nuevo-producto-form">
            {editando ? (
              <div className="gg-galeria-producto">
                <div className="gg-galeria-grid">
                  {imagenes.map((img) => (
                    <div key={img.id} className="gg-galeria-item">
                      <img src={img.url} alt={nombre} />
                      <div className="gg-galeria-item-acciones">
                        <button
                          type="button"
                          className={img.esPrincipal ? 'gg-galeria-estrella gg-galeria-estrella--activa' : 'gg-galeria-estrella'}
                          title={img.esPrincipal ? 'Foto principal' : 'Hacer principal'}
                          onClick={() => mutacionImagenPrincipal.mutate(img.id)}
                        >
                          <Star size={14} fill={img.esPrincipal ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type="button"
                          className="gg-galeria-borrar"
                          title="Eliminar foto"
                          onClick={() => mutacionEliminarImagen.mutate(img.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="gg-galeria-agregar">
                    <ImagePlus size={22} strokeWidth={1.5} />
                    <span>Agregar foto</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      onChange={(e) => {
                        const archivo = e.target.files?.[0]
                        e.target.value = ''
                        if (archivo) {
                          iniciarRecorte([archivo], (recortados) => {
                            if (recortados[0]) mutacionSubirFoto.mutate({ productoId: id!, archivo: recortados[0] })
                          })
                        }
                      }}
                    />
                  </label>
                </div>
                {mutacionSubirFoto.isPending && <p className="gg-galeria-estado">Subiendo foto…</p>}
              </div>
            ) : (
              <div className="gg-galeria-producto">
                <div className="gg-galeria-grid">
                  {fotosPreview.map((url, i) => (
                    <div key={url} className="gg-galeria-item">
                      <img src={url} alt={`Foto ${i + 1} del producto`} />
                      <div className="gg-galeria-item-acciones">
                        {i === 0 && (
                          <span className="gg-galeria-estrella gg-galeria-estrella--activa" title="Foto principal">
                            <Star size={14} fill="currentColor" />
                          </span>
                        )}
                        <button
                          type="button"
                          className="gg-galeria-borrar"
                          title="Quitar foto"
                          onClick={() => quitarFotoPendiente(i)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="gg-galeria-agregar">
                    <ImagePlus size={22} strokeWidth={1.5} />
                    <span>Agregar foto{fotosPreview.length > 0 ? 's' : ''}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFotos}
                      hidden
                    />
                  </label>
                </div>
                <p className="gg-foto-producto-ayuda">
                  Puedes agregar varias fotos de una vez o de a una — la primera queda como principal.
                </p>
              </div>
            )}

            <div className="gg-nuevo-producto-grid">
              <Input
                label="Código interno"
                type="text"
                value={codigoInterno}
                onChange={(e) => setCodigoInterno(e.target.value)}
                onKeyDown={bloquearEnter}
                placeholder="Ej: GGM-008"
                autoFocus
              />
              <Input
                label="Código de barras (opcional)"
                type="text"
                value={codigoBarras}
                onChange={(e) => setCodigoBarras(e.target.value)}
                onKeyDown={bloquearEnter}
                placeholder="Escanea aquí"
              />
            </div>

            <Input
              label="Nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={bloquearEnter}
              placeholder="Ej: Granola artesanal miel y nueces"
            />

            <Input
              label="Descripción (opcional)"
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              onKeyDown={bloquearEnter}
              placeholder="Ej: Bolsa 400g"
            />

            <div className="gg-nuevo-producto-grid">
              <div className="gg-field">
                <label htmlFor="categoria-input">Categoría</label>
                <input
                  id="categoria-input"
                  className="gg-input"
                  list="lista-categorias"
                  value={categoriaNombre}
                  onChange={(e) => setCategoriaNombre(e.target.value)}
                  onKeyDown={bloquearEnter}
                  placeholder="Ej: Desayuno"
                  autoComplete="off"
                />
                <datalist id="lista-categorias">
                  {categorias?.map((c) => <option key={c.id} value={c.nombre} />)}
                </datalist>
              </div>
              <div className="gg-field">
                <label htmlFor="marca-input">Marca (opcional)</label>
                <input
                  id="marca-input"
                  className="gg-input"
                  list="lista-marcas"
                  value={marcaNombre}
                  onChange={(e) => setMarcaNombre(e.target.value)}
                  onKeyDown={bloquearEnter}
                  placeholder="Ej: Guapa Bakery"
                  autoComplete="off"
                />
                <datalist id="lista-marcas">
                  {marcas?.map((m) => <option key={m.id} value={m.nombre} />)}
                </datalist>
              </div>
            </div>

            <div className="gg-nuevo-producto-grid">
              <Input
                label="Precio de compra *"
                type="number"
                min="0"
                value={precioCompra}
                onChange={(e) => handlePrecioCompra(e.target.value)}
                onKeyDown={bloquearEnter}
                placeholder="0"
              />
              <Input
                label="Precio de venta *"
                type="number"
                min="0"
                value={precioVenta}
                onChange={(e) => handlePrecioVenta(e.target.value)}
                onKeyDown={bloquearEnter}
                placeholder="0"
              />
            </div>

            <div className="gg-field">
              <label htmlFor="rentabilidad-producto">Rentabilidad (%)</label>
              <input
                id="rentabilidad-producto"
                className="gg-input"
                type="number"
                step="0.1"
                value={rentabilidad}
                onChange={(e) => handleRentabilidad(e.target.value)}
                onKeyDown={bloquearEnter}
                placeholder="Ej: 35"
              />
              <p className="gg-foto-producto-ayuda">
                Se calcula sola con el precio de compra y de venta. O escribe aquí la rentabilidad
                que quieres ganar y el precio de venta se completa solo.
              </p>
            </div>

            <div className="gg-nuevo-producto-grid">
              <div className="gg-field">
                <label htmlFor="iva">IVA</label>
                <select
                  id="iva"
                  className="gg-input"
                  value={iva}
                  onChange={(e) => setIva(Number(e.target.value) as (typeof IVAS)[number])}
                >
                  {IVAS.map((v) => (
                    <option key={v} value={v}>
                      {v}%
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Unidad de medida"
                type="text"
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value)}
                onKeyDown={bloquearEnter}
                placeholder="unidad"
              />
            </div>

            <label className="gg-toggle-desactivados">
              <input
                type="checkbox"
                checked={vendePorPeso}
                onChange={(e) => setVendePorPeso(e.target.checked)}
              />
              Se vende por peso (permite cantidades con decimales, ej. 0.350 kg de frutos secos a granel)
            </label>

            <div className="gg-nuevo-producto-grid">
              <Input
                label="Existencias"
                type="number"
                min="0"
                step={vendePorPeso ? '0.001' : '1'}
                value={existencias}
                onChange={(e) => setExistencias(e.target.value)}
                onKeyDown={bloquearEnter}
                error={error || undefined}
              />
              <Input
                label="Stock mínimo (alerta de bajo inventario)"
                type="number"
                min="0"
                step={vendePorPeso ? '0.001' : '1'}
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                onKeyDown={bloquearEnter}
                placeholder="0"
              />
            </div>

            <div className="gg-field">
              <label htmlFor="fecha-vencimiento-producto">Fecha de vencimiento (opcional)</label>
              <input
                id="fecha-vencimiento-producto"
                className="gg-input"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                onKeyDown={bloquearEnter}
              />
              <p className="gg-foto-producto-ayuda">
                Si la pones, este producto va a aparecer en "Alertas" cuando se acerque esa fecha.
              </p>
            </div>

            <div className="gg-field">
              <label htmlFor="tipo-promocion">Promoción (opcional)</label>
              <select
                id="tipo-promocion"
                className="gg-input"
                value={tipoPromocion}
                onChange={(e) => setTipoPromocion(e.target.value as typeof tipoPromocion)}
              >
                <option value="ninguna">Sin promoción</option>
                <option value="descuento">% de descuento</option>
                <option value="nxm">Lleva N, paga M (ej. 3x2)</option>
              </select>
            </div>

            {tipoPromocion === 'descuento' && (
              <div className="gg-field">
                <label htmlFor="descuento-producto">% de descuento</label>
                <input
                  id="descuento-producto"
                  className="gg-input"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={descuentoPorcentaje}
                  onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                  onKeyDown={bloquearEnter}
                  placeholder="Ej: 20"
                />
                {descuentoPorcentaje.trim() !== '' && Number(precioVenta) > 0 && (
                  <p className="gg-nuevo-producto-oferta-preview">
                    Se verá en la tienda como{' '}
                    <strong>
                      {formatoCOP.format(
                        Math.round(Number(precioVenta) * (1 - Number(descuentoPorcentaje) / 100)),
                      )}
                    </strong>{' '}
                    (antes {formatoCOP.format(Number(precioVenta))})
                  </p>
                )}
              </div>
            )}

            {tipoPromocion === 'nxm' && (
              <div className="gg-field">
                <label htmlFor="promocion-n">Lleva / paga</label>
                <div className="gg-nuevo-producto-nxm">
                  <input
                    id="promocion-n"
                    className="gg-input"
                    type="number"
                    min="2"
                    step="1"
                    value={promocionN}
                    onChange={(e) => setPromocionN(e.target.value)}
                    onKeyDown={bloquearEnter}
                    placeholder="Lleva (ej. 3)"
                    aria-label="Lleva"
                  />
                  <span>x</span>
                  <input
                    id="promocion-m"
                    className="gg-input"
                    type="number"
                    min="1"
                    step="1"
                    value={promocionM}
                    onChange={(e) => setPromocionM(e.target.value)}
                    onKeyDown={bloquearEnter}
                    placeholder="Paga (ej. 2)"
                    aria-label="Paga"
                  />
                </div>
                {promocionN.trim() && promocionM.trim() && Number(precioVenta) > 0 && (
                  <p className="gg-nuevo-producto-oferta-preview">
                    Se verá en la tienda como <strong>{promocionN}x{promocionM}</strong> — llevando{' '}
                    {promocionN} unidades se pagan {promocionM} (
                    {formatoCOP.format(Number(precioVenta) * Number(promocionM))} en vez de{' '}
                    {formatoCOP.format(Number(precioVenta) * Number(promocionN))}).
                  </p>
                )}
              </div>
            )}

            <div className="gg-nuevo-producto-grid">
              <Input
                label="Peso o contenido (opcional)"
                type="number"
                min="0"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                onKeyDown={bloquearEnter}
                placeholder="Ej: 400"
              />
              <div className="gg-field">
                <label htmlFor="peso-unidad">Unidad</label>
                <select
                  id="peso-unidad"
                  className="gg-input"
                  value={pesoUnidad}
                  onChange={(e) => setPesoUnidad(e.target.value)}
                >
                  <option value="g">gramos (g)</option>
                  <option value="kg">kilogramos (kg)</option>
                  <option value="ml">mililitros (ml)</option>
                  <option value="l">litros (l)</option>
                  <option value="unidad">unidad</option>
                </select>
              </div>
            </div>

            <div className="gg-field">
              <label htmlFor="ingredientes">Ingredientes (opcional)</label>
              <textarea
                id="ingredientes"
                className="gg-input gg-textarea"
                value={ingredientes}
                onChange={(e) => setIngredientes(e.target.value)}
                placeholder="Ej: Avena, miel, almendras, coco rallado…"
                rows={2}
              />
            </div>

            <div className="gg-field">
              <label>Información nutricional (opcional)</label>
              <div className="gg-nutricional-grid">
                {CAMPOS_NUTRICIONALES.map(({ clave, label }) => (
                  <div key={clave} className="gg-field">
                    <label htmlFor={`nutri-${clave}`} className="gg-nutricional-label">{label}</label>
                    <input
                      id={`nutri-${clave}`}
                      className="gg-input"
                      type="number"
                      min="0"
                      value={nutricional[clave] ?? ''}
                      onChange={(e) => setNutricional((prev) => ({ ...prev, [clave]: e.target.value }))}
                      onKeyDown={bloquearEnter}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="gg-nuevo-producto-acciones">
              <Button type="button" variant="secondary" onClick={() => navigate('/productos')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutacion.isPending}>
                {mutacion.isPending ? 'Guardando…' : 'Guardar producto'}
              </Button>
            </div>

            {mutacion.isError && (
              <p className="gg-field-error">
                {mutacion.error instanceof ApiError
                  ? mutacion.error.message
                  : 'No pudimos guardar el producto. Intenta de nuevo.'}
              </p>
            )}
          </form>

          {editando && productoExistente && (
            <KardexProducto
              productoId={id!}
              existenciasActuales={productoExistente.existencias}
              vendePorPeso={productoExistente.vendePorPeso}
            />
          )}
        </Card>
      </main>

      {tareaRecorte && (
        <RecortarFotoModal
          archivo={tareaRecorte.archivos[tareaRecorte.indice]}
          onConfirmar={manejarRecorteListo}
          onCancelar={manejarRecorteCancelado}
        />
      )}
    </div>
  )
}
