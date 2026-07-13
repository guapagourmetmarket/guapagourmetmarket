import { CambiosProducto, NuevoProducto, Producto } from './producto.entity';

export interface ProductosRepository {
  listar(incluirInactivos?: boolean): Promise<Producto[]>;
  buscar(termino: string): Promise<Producto[]>;
  obtenerPorId(id: string): Promise<Producto>;
  crear(nuevo: NuevoProducto): Promise<Producto>;
  actualizar(id: string, cambios: CambiosProducto): Promise<Producto>;
  cambiarEstado(id: string, activo: boolean): Promise<Producto>;
  agregarImagen(id: string, url: string): Promise<Producto>;
  marcarImagenPrincipal(id: string, imagenId: string): Promise<Producto>;
  eliminarImagen(id: string, imagenId: string): Promise<Producto>;
  duplicar(id: string, codigoInterno: string): Promise<Producto>;
}

export const PRODUCTOS_REPOSITORY = 'PRODUCTOS_REPOSITORY';
