import { EstadoResultados, FlujoCaja, Gasto, NuevoGasto } from './gasto.entity';

export interface ContabilidadRepository {
  listarGastos(desde?: string, hasta?: string): Promise<Gasto[]>;
  crearGasto(nuevo: NuevoGasto): Promise<Gasto>;
  eliminarGasto(id: string): Promise<void>;
  obtenerFlujoCaja(desde: string, hasta: string): Promise<FlujoCaja>;
  obtenerEstadoResultados(desde: string, hasta: string): Promise<EstadoResultados>;
}

export const CONTABILIDAD_REPOSITORY = 'CONTABILIDAD_REPOSITORY';
