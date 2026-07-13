export interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  puntos: number;
  activo: boolean;
}

export interface NuevoCliente {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  fechaNacimiento?: string;
}

export type CambiosCliente = Partial<NuevoCliente>;

export type TipoMovimientoPuntos = 'acumulado' | 'canjeado' | 'ajuste';

export interface MovimientoPuntos {
  id: string;
  clienteId: string;
  tipo: TipoMovimientoPuntos;
  puntos: number;
  saldoPuntos: number;
  referenciaTipo: 'venta' | 'canje' | 'ajuste_manual';
  referenciaId: string | null;
  motivo: string | null;
  createdAt: string;
}
