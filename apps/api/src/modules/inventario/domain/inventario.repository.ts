import { Alertas, MovimientoInventario } from './movimiento-inventario.entity';

export interface NuevoAjuste {
  productoId: string;
  cantidadNueva: number;
  motivo: string;
  registradoPor: string;
}

export interface InventarioRepository {
  listarMovimientos(productoId: string): Promise<MovimientoInventario[]>;
  registrarAjuste(ajuste: NuevoAjuste): Promise<MovimientoInventario>;
  obtenerAlertas(diasVencimiento?: number): Promise<Alertas>;
}

export const INVENTARIO_REPOSITORY = 'INVENTARIO_REPOSITORY';
