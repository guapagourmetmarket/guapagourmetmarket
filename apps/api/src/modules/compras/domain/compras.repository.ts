import { Compra, NuevaCompra } from './compra.entity';

export interface ComprasRepository {
  listar(): Promise<Compra[]>;
  obtenerPorId(id: string): Promise<Compra>;
  registrar(compra: NuevaCompra): Promise<Compra>;
  anular(id: string): Promise<void>;
  listarCartera(): Promise<Compra[]>;
  marcarPagada(id: string): Promise<Compra>;
}

export const COMPRAS_REPOSITORY = 'COMPRAS_REPOSITORY';
