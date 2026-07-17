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
}
