import { CambiosProveedor, NuevoProveedor, Proveedor } from './proveedor.entity';

export interface ProveedoresRepository {
  listar(incluirInactivos?: boolean): Promise<Proveedor[]>;
  obtenerPorId(id: string): Promise<Proveedor>;
  crear(nuevo: NuevoProveedor): Promise<Proveedor>;
  actualizar(id: string, cambios: CambiosProveedor): Promise<Proveedor>;
  cambiarEstado(id: string, activo: boolean): Promise<Proveedor>;
}

export const PROVEEDORES_REPOSITORY = 'PROVEEDORES_REPOSITORY';
