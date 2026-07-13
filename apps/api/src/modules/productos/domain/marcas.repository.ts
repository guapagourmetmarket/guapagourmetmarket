import { Marca } from './marca.entity';

export interface MarcasRepository {
  listar(): Promise<Marca[]>;
  obtenerOCrear(nombre: string): Promise<Marca>;
  renombrar(id: string, nombre: string): Promise<Marca>;
  eliminar(id: string): Promise<void>;
}

export const MARCAS_REPOSITORY = 'MARCAS_REPOSITORY';
