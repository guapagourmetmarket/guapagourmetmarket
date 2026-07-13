import { CambiosCliente, Cliente, MovimientoPuntos, NuevoCliente } from './cliente.entity';
import { Venta } from '../../ventas/domain/venta.entity';

export interface ClientesRepository {
  listar(incluirInactivos?: boolean): Promise<Cliente[]>;
  obtenerPorId(id: string): Promise<Cliente>;
  crear(nuevo: NuevoCliente): Promise<Cliente>;
  actualizar(id: string, cambios: CambiosCliente): Promise<Cliente>;
  cambiarEstado(id: string, activo: boolean): Promise<Cliente>;
  listarMovimientosPuntos(clienteId: string): Promise<MovimientoPuntos[]>;
  canjearPuntos(clienteId: string, puntos: number, motivo: string): Promise<MovimientoPuntos>;
  listarHistorialCompras(clienteId: string): Promise<Venta[]>;
  listarCumpleanosDelMes(): Promise<Cliente[]>;
}

export const CLIENTES_REPOSITORY = 'CLIENTES_REPOSITORY';
