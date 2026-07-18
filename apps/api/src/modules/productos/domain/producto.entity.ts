export type Iva = 0 | 5 | 19;

export interface InfoNutricional {
  calorias?: number;
  proteinaG?: number;
  grasaG?: number;
  carbohidratosG?: number;
  azucaresG?: number;
  sodioMg?: number;
}

export interface ImagenProducto {
  id: string;
  url: string;
  esPrincipal: boolean;
}

export interface Producto {
  id: string;
  codigoInterno: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  precioCompra: number;
  costoPromedio: number | null;
  precioVenta: number;
  iva: Iva;
  categoriaId: string;
  categoriaNombre: string;
  marcaId: string | null;
  marcaNombre: string | null;
  unidadMedida: string;
  existencias: number;
  stockMinimo: number;
  vendePorPeso: boolean;
  favoritoPos: boolean;
  /** % de descuento promocional activo, o null si no está en oferta. Excluyente con promocionN/M. */
  descuentoPorcentaje: number | null;
  /** Precio ya con el descuento aplicado, o null si no está en oferta. Calculado, no se guarda. */
  precioOferta: number | null;
  /** Promoción "lleva N, paga M" (ej. 3x2 → promocionN=3, promocionM=2). Excluyente con descuentoPorcentaje. */
  promocionN: number | null;
  promocionM: number | null;
  imagenUrl: string | null;
  imagenes: ImagenProducto[];
  activo: boolean;
  ingredientes: string | null;
  infoNutricional: InfoNutricional | null;
  peso: number | null;
  pesoUnidad: string | null;
  /** Vencimiento del producto en sí (no de un lote de compra) — alimenta "Alertas" sin pasar por Compras. */
  fechaVencimiento: string | null;
}

export interface NuevoProducto {
  codigoInterno: string;
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  precioCompra: number;
  precioVenta: number;
  iva: Iva;
  categoriaId: string;
  marcaId?: string;
  unidadMedida: string;
  existencias: number;
  stockMinimo?: number;
  vendePorPeso?: boolean;
  descuentoPorcentaje?: number | null;
  promocionN?: number | null;
  promocionM?: number | null;
  ingredientes?: string;
  infoNutricional?: InfoNutricional;
  peso?: number;
  pesoUnidad?: string;
  fechaVencimiento?: string | null;
}

export type CambiosProducto = Partial<NuevoProducto>;
