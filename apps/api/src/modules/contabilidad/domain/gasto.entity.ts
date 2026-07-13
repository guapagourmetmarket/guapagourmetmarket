export type MetodoPagoGasto = 'efectivo' | 'transferencia' | 'tarjeta';

export interface Gasto {
  id: string;
  fecha: string;
  categoria: string;
  descripcion: string | null;
  valor: number;
  metodoPago: MetodoPagoGasto;
}

export interface NuevoGasto {
  fecha?: string;
  categoria: string;
  descripcion?: string;
  valor: number;
  metodoPago: MetodoPagoGasto;
  registradoPor: string;
}

export interface FlujoCaja {
  desde: string;
  hasta: string;
  ingresosVentas: number;
  gastos: number;
  comprasPagadas: number;
  flujoNeto: number;
}

export interface EstadoResultados {
  desde: string;
  hasta: string;
  ingresos: number;
  costoVentas: number;
  utilidadBruta: number;
  gastosOperativos: number;
  utilidadNeta: number;
}
