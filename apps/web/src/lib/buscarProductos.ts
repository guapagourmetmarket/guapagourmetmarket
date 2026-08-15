import type { Producto } from '@guapa/shared'

/**
 * Busca productos por nombre, categoría, marca, código interno o de barras.
 * Mismo filtro que usan los buscadores rápidos de Táctil, el modal de
 * Escanear y el panel de cuenta — un solo lugar para no repetirlo distinto
 * en cada uno.
 */
export function filtrarProductosPorTexto(productos: Producto[], texto: string, limite = 8): Producto[] {
  const q = texto.trim().toLowerCase()
  if (!q) return []
  return productos
    .filter((p) => p.activo !== false)
    .filter((p) =>
      [p.nombre, p.categoriaNombre, p.marcaNombre, p.codigoInterno, p.codigoBarras]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(q)),
    )
    .slice(0, limite)
}
