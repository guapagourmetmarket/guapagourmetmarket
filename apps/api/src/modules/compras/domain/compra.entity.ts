export type MetodoPagoCompra = 'contado' | 'transferencia' | 'credito';

export interface CompraItem {
  id: string;
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  lote: string | null;
  fechaVencimiento: string | null;
}

export interface Compra {
  id: string;
  numero: number;
  proveedorId: string;
  proveedorNombre: string;
  fecha: string;
  numeroFacturaProveedor: string | null;
  subtotal: number;
  total: number;
  metodoPago: MetodoPagoCompra;
  notas: string | null;
  pagado: boolean;
  fechaVencimientoPago: string | null;
  items: CompraItem[];
}

export interface NuevoCompraItem {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  lote?: string;
  fechaVencimiento?: string;
}

export interface NuevaCompra {
  proveedorId: string;
  fecha?: string;
  numeroFacturaProveedor?: string;
  metodoPago: MetodoPagoCompra;
  notas?: string;
  fechaVencimientoPago?: string;
  registradoPor: string;
  items: NuevoCompraItem[];
}
