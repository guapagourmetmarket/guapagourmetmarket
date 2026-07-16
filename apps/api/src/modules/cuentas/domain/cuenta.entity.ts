export type EstadoCuenta = 'abierta' | 'cerrada';

export interface CuentaItem {
  id: string;
  productoId: string | null;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface CuentaAbierta {
  id: string;
  nombre: string;
  estado: EstadoCuenta;
  ventaId: string | null;
  createdAt: string;
  items: CuentaItem[];
  total: number;
}

export interface NuevoCuentaItem {
  productoId?: string;
  descripcionLibre?: string;
  cantidad: number;
  // Solo aplica (y es obligatorio) cuando el item no es de un producto del
  // catálogo — si hay productoId, el precio se resuelve del producto.
  precioUnitario?: number;
}
