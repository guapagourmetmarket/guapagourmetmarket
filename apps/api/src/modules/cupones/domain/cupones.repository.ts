import { Cupon, NuevoCupon, ResultadoValidacionCupon } from './cupon.entity';

export interface CuponesRepository {
  listar(): Promise<Cupon[]>;
  crear(nuevo: NuevoCupon): Promise<Cupon>;
  cambiarEstado(id: string, activo: boolean): Promise<Cupon>;
  eliminar(id: string): Promise<void>;
  validar(codigo: string): Promise<ResultadoValidacionCupon>;
}

export const CUPONES_REPOSITORY = 'CUPONES_REPOSITORY';
