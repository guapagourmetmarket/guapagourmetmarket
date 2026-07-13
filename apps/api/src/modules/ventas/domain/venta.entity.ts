export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'nequi' | 'daviplata' | 'mixto';

export interface VentaItem {
  id: string;
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  iva: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  numero: number;
  fecha: string;
  clienteId: string | null;
  clienteNombre: string | null;
  descripcion: string | null;
  valor: number;
  metodoPago: MetodoPago;
  origen: 'manual' | 'pos';
  pagado: boolean;
  fechaVencimientoPago: string | null;
  items: VentaItem[];
}

export interface NuevoVentaItem {
  productoId: string;
  cantidad: number;
}

export interface NuevaVenta {
  fecha?: string;
  clienteId?: string;
  clienteNombre?: string;
  descripcion?: string;
  valorLibre?: number;
  metodoPago: MetodoPago;
  fiado?: boolean;
  fechaVencimientoPago?: string;
  registradoPor: string;
  items: NuevoVentaItem[];
}
