export type EstadoPedidoEncargo = 'pendiente' | 'entregado' | 'cancelado';

export interface PedidoEncargo {
  id: string;
  clienteNombre: string;
  clienteTelefono: string | null;
  descripcion: string;
  fechaEntrega: string;
  valor: number | null;
  anticipo: number;
  estado: EstadoPedidoEncargo;
  notas: string | null;
  createdAt: string;
}

export interface NuevoPedidoEncargo {
  clienteNombre: string;
  clienteTelefono?: string;
  descripcion: string;
  fechaEntrega: string;
  valor?: number;
  anticipo?: number;
  notas?: string;
  registradoPor: string;
}

export interface CambiosPedidoEncargo {
  clienteNombre?: string;
  clienteTelefono?: string | null;
  descripcion?: string;
  fechaEntrega?: string;
  valor?: number | null;
  anticipo?: number;
  notas?: string | null;
}
