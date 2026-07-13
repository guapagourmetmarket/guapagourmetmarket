import type { Categoria, Marca, Producto } from '@guapa/shared'

// Si no se fija VITE_API_URL, se asume que la API vive en el mismo host desde
// el que se cargó la página (solo cambia el puerto). Así, entrar por
// localhost, por la IP de la red local, o por cualquier IP que tome el WiFi
// más adelante, siempre apunta a la API correcta sin tener que editar nada.
const API_URL = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000`

export { API_URL }

export class ApiError extends Error {}

const CLAVE_TOKEN = 'guapa_token'
const CLAVE_USUARIO = 'guapa_usuario'

let authToken: string | null = null

/** Guarda el token en localStorage para no perder la sesión al refrescar la página. */
export function setAuthToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem(CLAVE_TOKEN, token)
  } else {
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
  }
}

export function guardarUsuarioSesion(usuario: unknown) {
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
}

/**
 * Restaura la sesión guardada sin depender de una llamada al servidor: si la
 * API gratis está dormida (Render), esperar esa respuesta para poder mostrar
 * la app sacaba a la usuaria de la sesión sin necesidad. Un token expirado o
 * inválido lo detectan igual las pantallas cuando hagan su primera petición.
 */
export function obtenerSesionGuardada(): LoginResponse | null {
  const token = localStorage.getItem(CLAVE_TOKEN)
  const usuarioJson = localStorage.getItem(CLAVE_USUARIO)
  if (!token || !usuarioJson) return null
  try {
    return { accessToken: token, usuario: JSON.parse(usuarioJson) }
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const mensaje = Array.isArray(body?.message) ? body.message.join(' ') : body?.message
    throw new ApiError(mensaje ?? 'Ocurrió un error al conectar con el servidor.')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

async function subirArchivo<T>(path: string, campo: string, archivo: File): Promise<T> {
  const formData = new FormData()
  formData.append(campo, archivo)
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: formData,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const mensaje = Array.isArray(body?.message) ? body.message.join(' ') : body?.message
    throw new ApiError(mensaje ?? 'Ocurrió un error al subir el archivo.')
  }
  return response.json() as Promise<T>
}

async function descargarArchivo(path: string): Promise<Blob> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  })
  if (!response.ok) {
    throw new ApiError('No pudimos generar el archivo. Intenta de nuevo.')
  }
  return response.blob()
}

export function descargarArchivoComo(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}

export interface LoginResponse {
  accessToken: string
  usuario: { id: string; nombre: string; email: string; rol: string }
}

export function login(email: string, password: string) {
  return api.post<LoginResponse>('/auth/login', { email, password })
}

export interface Perfil {
  id: string
  nombre: string
  email: string
  rol: string
}

export function obtenerPerfil() {
  return api.get<Perfil>('/auth/perfil')
}

export interface CambiosPerfil {
  passwordActual: string
  email?: string
  passwordNueva?: string
}

export function actualizarPerfil(cambios: CambiosPerfil) {
  return api.patch<Perfil>('/auth/perfil', cambios)
}

export function obtenerProductos(incluirInactivos = false) {
  return api.get<Producto[]>(`/productos${incluirInactivos ? '?incluirInactivos=true' : ''}`)
}

export function buscarProductos(q: string) {
  return api.get<Producto[]>(`/productos/buscar?q=${encodeURIComponent(q)}`)
}

export type NuevoProducto = Omit<
  Producto,
  | 'id'
  | 'categoriaNombre'
  | 'marcaNombre'
  | 'imagenUrl'
  | 'imagenes'
  | 'favoritoPos'
  | 'activo'
  | 'costoPromedio'
>
export type CambiosProducto = Partial<NuevoProducto>

export function crearProducto(producto: NuevoProducto) {
  return api.post<Producto>('/productos', producto)
}

export function obtenerProducto(id: string) {
  return api.get<Producto>(`/productos/${id}`)
}

export function actualizarProducto(id: string, cambios: CambiosProducto) {
  return api.patch<Producto>(`/productos/${id}`, cambios)
}

export function cambiarEstadoProducto(id: string, activo: boolean) {
  return api.patch<Producto>(`/productos/${id}/estado`, { activo })
}

export function duplicarProducto(id: string) {
  return api.post<Producto>(`/productos/${id}/duplicar`, {})
}

export function eliminarProducto(id: string) {
  return api.delete<void>(`/productos/${id}`)
}

export function subirImagenProducto(id: string, archivo: File) {
  return subirArchivo<Producto>(`/productos/${id}/imagen`, 'imagen', archivo)
}

export function marcarImagenPrincipal(productoId: string, imagenId: string) {
  return api.patch<Producto>(`/productos/${productoId}/imagen/${imagenId}/principal`, {})
}

export function eliminarImagenProducto(productoId: string, imagenId: string) {
  return api.delete<Producto>(`/productos/${productoId}/imagen/${imagenId}`)
}

export interface ErrorImportacion {
  fila: number
  mensaje: string
}

export interface ResultadoImportacion {
  creados: number
  actualizados: number
  errores: ErrorImportacion[]
}

export async function exportarProductos() {
  const blob = await descargarArchivo('/productos/exportar')
  descargarArchivoComo(blob, 'productos-guapa-gourmet.xlsx')
}

export async function descargarCatalogoPdf() {
  const blob = await descargarArchivo('/productos/catalogo-pdf')
  descargarArchivoComo(blob, 'catalogo-guapa-gourmet.pdf')
}

export async function descargarPlantillaProductos() {
  const blob = await descargarArchivo('/productos/plantilla')
  descargarArchivoComo(blob, 'plantilla-productos-guapa-gourmet.xlsx')
}

export function importarProductos(archivo: File) {
  return subirArchivo<ResultadoImportacion>('/productos/importar', 'archivo', archivo)
}

export function obtenerCategorias() {
  return api.get<Categoria[]>('/categorias')
}

export function crearCategoria(nombre: string) {
  return api.post<Categoria>('/categorias', { nombre })
}

export function renombrarCategoria(id: string, nombre: string) {
  return api.patch<Categoria>(`/categorias/${id}`, { nombre })
}

export function eliminarCategoria(id: string) {
  return api.delete<void>(`/categorias/${id}`)
}

export function obtenerMarcas() {
  return api.get<Marca[]>('/marcas')
}

export function crearMarca(nombre: string) {
  return api.post<Marca>('/marcas', { nombre })
}

export function renombrarMarca(id: string, nombre: string) {
  return api.patch<Marca>(`/marcas/${id}`, { nombre })
}

export function eliminarMarca(id: string) {
  return api.delete<void>(`/marcas/${id}`)
}

export interface Negocio {
  id: string
  nombre: string
  nit: string
  direccion: string | null
  telefono: string | null
}

export type CambiosNegocio = Partial<Omit<Negocio, 'id'>>

export function obtenerNegocio() {
  return api.get<Negocio | null>('/negocio')
}

export function actualizarNegocio(cambios: CambiosNegocio) {
  return api.patch<Negocio>('/negocio', cambios)
}

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'mixto'

export interface VentaItem {
  id: string
  productoId: string
  nombreProducto: string
  cantidad: number
  precioUnitario: number
  iva: number
  subtotal: number
}

export interface Venta {
  id: string
  numero: number
  fecha: string
  clienteId: string | null
  clienteNombre: string | null
  descripcion: string | null
  valor: number
  metodoPago: MetodoPago
  origen: 'manual' | 'pos'
  pagado: boolean
  fechaVencimientoPago: string | null
  items: VentaItem[]
}

export interface NuevoVentaItem {
  productoId: string
  cantidad: number
}

export interface NuevaVenta {
  fecha?: string
  clienteId?: string
  clienteNombre?: string
  descripcion?: string
  valorLibre?: number
  metodoPago: MetodoPago
  fiado?: boolean
  fechaVencimientoPago?: string
  items: NuevoVentaItem[]
}

export function obtenerVentas() {
  return api.get<Venta[]>('/ventas')
}

export function registrarVenta(venta: NuevaVenta) {
  return api.post<Venta>('/ventas', venta)
}

export function anularVenta(id: string) {
  return api.delete<void>(`/ventas/${id}`)
}

export function obtenerCarteraClientes() {
  return api.get<Venta[]>('/ventas/cartera')
}

export function marcarVentaPagada(id: string) {
  return api.patch<Venta>(`/ventas/${id}/pagar`, {})
}

export interface Proveedor {
  id: string
  nombre: string
  nit: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  condicionesPago: string | null
  activo: boolean
}

export interface NuevoProveedor {
  nombre: string
  nit?: string
  telefono?: string
  email?: string
  direccion?: string
  condicionesPago?: string
}
export type CambiosProveedor = Partial<NuevoProveedor>

export function obtenerProveedores(incluirInactivos = false) {
  return api.get<Proveedor[]>(`/proveedores${incluirInactivos ? '?incluirInactivos=true' : ''}`)
}

export function crearProveedor(proveedor: NuevoProveedor) {
  return api.post<Proveedor>('/proveedores', proveedor)
}

export function actualizarProveedor(id: string, cambios: CambiosProveedor) {
  return api.patch<Proveedor>(`/proveedores/${id}`, cambios)
}

export function cambiarEstadoProveedor(id: string, activo: boolean) {
  return api.patch<Proveedor>(`/proveedores/${id}/estado`, { activo })
}

export type MetodoPagoCompra = 'contado' | 'transferencia' | 'credito'

export interface CompraItem {
  id: string
  productoId: string
  nombreProducto: string
  cantidad: number
  costoUnitario: number
  subtotal: number
  lote: string | null
  fechaVencimiento: string | null
}

export interface Compra {
  id: string
  numero: number
  proveedorId: string
  proveedorNombre: string
  fecha: string
  numeroFacturaProveedor: string | null
  subtotal: number
  total: number
  metodoPago: MetodoPagoCompra
  notas: string | null
  pagado: boolean
  fechaVencimientoPago: string | null
  items: CompraItem[]
}

export interface NuevoCompraItem {
  productoId: string
  cantidad: number
  costoUnitario: number
  lote?: string
  fechaVencimiento?: string
}

export interface NuevaCompra {
  proveedorId: string
  fecha?: string
  numeroFacturaProveedor?: string
  metodoPago: MetodoPagoCompra
  notas?: string
  fechaVencimientoPago?: string
  items: NuevoCompraItem[]
}

export function obtenerCompras() {
  return api.get<Compra[]>('/compras')
}

export function registrarCompra(compra: NuevaCompra) {
  return api.post<Compra>('/compras', compra)
}

export function anularCompra(id: string) {
  return api.delete<void>(`/compras/${id}`)
}

export function obtenerCartera() {
  return api.get<Compra[]>('/compras/cartera')
}

export function marcarCompraPagada(id: string) {
  return api.patch<Compra>(`/compras/${id}/pagar`, {})
}

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste'
export type ReferenciaTipo =
  | 'compra'
  | 'venta'
  | 'ajuste_manual'
  | 'anulacion_compra'
  | 'anulacion_venta'

export interface MovimientoInventario {
  id: string
  productoId: string
  tipo: TipoMovimiento
  cantidad: number
  costoUnitario: number | null
  saldoCantidad: number
  referenciaTipo: ReferenciaTipo
  referenciaId: string | null
  motivo: string | null
  createdAt: string
}

export function obtenerMovimientos(productoId: string) {
  return api.get<MovimientoInventario[]>(`/inventario/movimientos?productoId=${productoId}`)
}

export interface NuevoAjuste {
  productoId: string
  cantidadNueva: number
  motivo: string
}

export function registrarAjuste(ajuste: NuevoAjuste) {
  return api.post<MovimientoInventario>('/inventario/ajustes', ajuste)
}

export interface AlertaStockBajo {
  productoId: string
  nombre: string
  categoriaNombre: string
  existencias: number
  stockMinimo: number
}

export interface AlertaVencimiento {
  loteId: string
  productoId: string
  productoNombre: string
  codigoLote: string | null
  fechaVencimiento: string
  cantidadActual: number
  diasRestantes: number
}

export interface Alertas {
  stockBajo: AlertaStockBajo[]
  porVencer: AlertaVencimiento[]
}

export function obtenerAlertas() {
  return api.get<Alertas>('/inventario/alertas')
}

export type MetodoPagoGasto = 'efectivo' | 'transferencia' | 'tarjeta'

export interface Gasto {
  id: string
  fecha: string
  categoria: string
  descripcion: string | null
  valor: number
  metodoPago: MetodoPagoGasto
}

export interface NuevoGasto {
  fecha?: string
  categoria: string
  descripcion?: string
  valor: number
  metodoPago: MetodoPagoGasto
}

export function obtenerGastos() {
  return api.get<Gasto[]>('/gastos')
}

export function crearGasto(gasto: NuevoGasto) {
  return api.post<Gasto>('/gastos', gasto)
}

export function eliminarGasto(id: string) {
  return api.delete<void>(`/gastos/${id}`)
}

export interface FlujoCaja {
  desde: string
  hasta: string
  ingresosVentas: number
  gastos: number
  comprasPagadas: number
  flujoNeto: number
}

export interface EstadoResultados {
  desde: string
  hasta: string
  ingresos: number
  costoVentas: number
  utilidadBruta: number
  gastosOperativos: number
  utilidadNeta: number
}

export function obtenerFlujoCaja(desde?: string, hasta?: string) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const qs = params.toString()
  return api.get<FlujoCaja>(`/contabilidad/flujo-caja${qs ? `?${qs}` : ''}`)
}

export function obtenerEstadoResultados(desde?: string, hasta?: string) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const qs = params.toString()
  return api.get<EstadoResultados>(`/contabilidad/estado-resultados${qs ? `?${qs}` : ''}`)
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  direccion: string | null
  fechaNacimiento: string | null
  puntos: number
  activo: boolean
}

export interface NuevoCliente {
  nombre: string
  telefono?: string
  email?: string
  direccion?: string
  fechaNacimiento?: string
}
export type CambiosCliente = Partial<NuevoCliente>

export type TipoMovimientoPuntos = 'acumulado' | 'canjeado' | 'ajuste'

export interface MovimientoPuntos {
  id: string
  clienteId: string
  tipo: TipoMovimientoPuntos
  puntos: number
  saldoPuntos: number
  referenciaTipo: 'venta' | 'canje' | 'ajuste_manual'
  referenciaId: string | null
  motivo: string | null
  createdAt: string
}

export function obtenerClientes(incluirInactivos = false) {
  return api.get<Cliente[]>(`/clientes${incluirInactivos ? '?incluirInactivos=true' : ''}`)
}

export function obtenerCliente(id: string) {
  return api.get<Cliente>(`/clientes/${id}`)
}

export function crearCliente(cliente: NuevoCliente) {
  return api.post<Cliente>('/clientes', cliente)
}

export function actualizarCliente(id: string, cambios: CambiosCliente) {
  return api.patch<Cliente>(`/clientes/${id}`, cambios)
}

export function cambiarEstadoCliente(id: string, activo: boolean) {
  return api.patch<Cliente>(`/clientes/${id}/estado`, { activo })
}

export function obtenerMovimientosPuntos(clienteId: string) {
  return api.get<MovimientoPuntos[]>(`/clientes/${clienteId}/puntos`)
}

export function canjearPuntos(clienteId: string, puntos: number, motivo: string) {
  return api.post<MovimientoPuntos>(`/clientes/${clienteId}/puntos/canjear`, { puntos, motivo })
}

export function obtenerHistorialComprasCliente(clienteId: string) {
  return api.get<Venta[]>(`/clientes/${clienteId}/compras`)
}

export function obtenerCumpleanosDelMes() {
  return api.get<Cliente[]>('/clientes/cumpleanos')
}

export interface ResumenDashboard {
  ventasHoy: number
  ventasMes: number
  cantidadVentasHoy: number
  cantidadVentasMes: number
}

export interface VentaPorDia {
  fecha: string
  total: number
  cantidadVentas: number
}

export interface ProductoVendido {
  productoId: string
  nombre: string
  cantidadVendida: number
  totalVendido: number
}

export interface VentaPorCategoria {
  categoria: string
  total: number
}

export interface VentaPorEmpleado {
  usuarioId: string | null
  usuario: string
  total: number
  cantidadVentas: number
}

export interface MargenProducto {
  productoId: string
  nombre: string
  ingresos: number
  costo: number
  margen: number
  porcentajeMargen: number
}

function rangoQuery(desde?: string, hasta?: string) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function obtenerResumenDashboard() {
  return api.get<ResumenDashboard>('/reportes/resumen')
}

export function obtenerVentasPorDia(desde?: string, hasta?: string) {
  return api.get<VentaPorDia[]>(`/reportes/ventas-por-dia${rangoQuery(desde, hasta)}`)
}

export function obtenerTopProductos(desde?: string, hasta?: string, orden: 'mas' | 'menos' = 'mas', limite = 10) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  params.set('orden', orden)
  params.set('limite', String(limite))
  return api.get<ProductoVendido[]>(`/reportes/top-productos?${params.toString()}`)
}

export function obtenerVentasPorCategoria(desde?: string, hasta?: string) {
  return api.get<VentaPorCategoria[]>(`/reportes/ventas-por-categoria${rangoQuery(desde, hasta)}`)
}

export function obtenerVentasPorEmpleado(desde?: string, hasta?: string) {
  return api.get<VentaPorEmpleado[]>(`/reportes/ventas-por-empleado${rangoQuery(desde, hasta)}`)
}

export function obtenerMargenProductos(desde?: string, hasta?: string, limite = 10) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  params.set('limite', String(limite))
  return api.get<MargenProducto[]>(`/reportes/margen-productos?${params.toString()}`)
}
