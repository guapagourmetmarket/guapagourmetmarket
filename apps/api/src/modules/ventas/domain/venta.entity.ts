export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'mixto';

export interface VentaItem {
  id: string;
  /** null cuando es una línea libre (nombre + precio escritos a mano, sin producto en el catálogo). */
  productoId: string | null;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  iva: number;
  subtotal: number;
  cantidadDevuelta: number;
}

export interface NuevaDevolucion {
  cantidad: number;
  motivo?: string;
  registradoPor: string;
}

export interface Devolucion {
  id: string;
  ventaItemId: string;
  cantidad: number;
  valor: number;
  motivo: string | null;
  createdAt: string;
}

export interface Venta {
  id: string;
  numero: number;
  fecha: string;
  clienteId: string | null;
  clienteNombre: string | null;
  descripcion: string | null;
  valor: number;
  descuento: number;
  metodoPago: MetodoPago;
  origen: 'manual' | 'pos';
  pagado: boolean;
  fechaVencimientoPago: string | null;
  items: VentaItem[];
}

export type NuevoVentaItem =
  | { productoId: string; cantidad: number }
  | { nombre: string; precioUnitario: number; cantidad: number };

export interface NuevaVenta {
  fecha?: string;
  clienteId?: string;
  clienteNombre?: string;
  descripcion?: string;
  valorLibre?: number;
  descuento?: number;
  metodoPago: MetodoPago;
  fiado?: boolean;
  fechaVencimientoPago?: string;
  registradoPor: string;
  items: NuevoVentaItem[];
}
