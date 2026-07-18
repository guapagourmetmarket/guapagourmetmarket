export type EstadoPedidoWeb = 'pendiente' | 'confirmado' | 'despachado' | 'cancelado';

export interface PedidoWebItem {
  id: string;
  productoId: string | null;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PedidoWeb {
  id: string;
  numero: number;
  clienteNombre: string;
  clienteTelefono: string;
  notas: string | null;
  valor: number;
  descuento: number;
  cuponCodigo: string | null;
  estado: EstadoPedidoWeb;
  items: PedidoWebItem[];
  createdAt: string;
}

export interface NuevoPedidoWebItem {
  productoId: string;
  cantidad: number;
}

export interface NuevoPedidoWeb {
  clienteNombre: string;
  clienteTelefono: string;
  notas?: string;
  items: NuevoPedidoWebItem[];
  // Código crudo que escribió el cliente en la tienda pública; el caso de
  // uso lo valida contra la tabla de cupones y resuelve el porcentaje real
  // antes de pasarle esto al repositorio — nunca se confía en un
  // porcentaje que venga directo del cliente.
  cuponCodigo?: string;
  descuentoPorcentaje?: number;
}
