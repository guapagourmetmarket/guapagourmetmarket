export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export type ReferenciaTipo =
  | 'compra'
  | 'venta'
  | 'ajuste_manual'
  | 'anulacion_compra'
  | 'anulacion_venta';

export interface MovimientoInventario {
  id: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  costoUnitario: number | null;
  saldoCantidad: number;
  referenciaTipo: ReferenciaTipo;
  referenciaId: string | null;
  motivo: string | null;
  createdAt: string;
}

export interface AlertaStockBajo {
  productoId: string;
  nombre: string;
  categoriaNombre: string;
  existencias: number;
  stockMinimo: number;
}

export interface AlertaVencimiento {
  loteId: string;
  productoId: string;
  productoNombre: string;
  codigoLote: string | null;
  fechaVencimiento: string;
  cantidadActual: number;
  diasRestantes: number;
}

export interface Alertas {
  stockBajo: AlertaStockBajo[];
  porVencer: AlertaVencimiento[];
}
