import { NuevaVenta, Venta } from './venta.entity';

export interface VentasRepository {
  listar(): Promise<Venta[]>;
  registrar(venta: NuevaVenta): Promise<Venta>;
  anular(id: string): Promise<void>;
  listarCarteraClientes(): Promise<Venta[]>;
  marcarPagada(id: string): Promise<Venta>;
}

export const VENTAS_REPOSITORY = 'VENTAS_REPOSITORY';
