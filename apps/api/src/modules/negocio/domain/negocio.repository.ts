import { CambiosNegocio, Negocio } from './negocio.entity';

export interface NegocioRepository {
  obtener(): Promise<Negocio | null>;
  actualizar(cambios: CambiosNegocio): Promise<Negocio>;
}

export const NEGOCIO_REPOSITORY = 'NEGOCIO_REPOSITORY';
