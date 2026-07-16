import { CuentaAbierta, NuevoCuentaItem } from './cuenta.entity';

export interface CuentasRepository {
  listarAbiertas(): Promise<CuentaAbierta[]>;
  obtener(id: string): Promise<CuentaAbierta>;
  abrir(nombre: string, abiertaPor: string): Promise<CuentaAbierta>;
  agregarItem(cuentaId: string, item: NuevoCuentaItem): Promise<CuentaAbierta>;
  quitarItem(cuentaId: string, itemId: string): Promise<CuentaAbierta>;
  marcarCerrada(cuentaId: string, ventaId: string): Promise<void>;
  cancelar(cuentaId: string): Promise<void>;
}

export const CUENTAS_REPOSITORY = 'CUENTAS_REPOSITORY';
