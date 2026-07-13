import { Categoria } from './categoria.entity';

export interface CategoriasRepository {
  listar(): Promise<Categoria[]>;
  obtenerOCrear(nombre: string): Promise<Categoria>;
  renombrar(id: string, nombre: string): Promise<Categoria>;
  eliminar(id: string): Promise<void>;
}

export const CATEGORIAS_REPOSITORY = 'CATEGORIAS_REPOSITORY';
