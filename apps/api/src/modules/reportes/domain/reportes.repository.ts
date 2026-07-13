import {
  MargenProducto,
  ProductoVendido,
  ResumenDashboard,
  VentaPorCategoria,
  VentaPorDia,
  VentaPorEmpleado,
} from './reporte.entity';

export interface ReportesRepository {
  obtenerResumen(): Promise<ResumenDashboard>;
  ventasPorDia(desde: string, hasta: string): Promise<VentaPorDia[]>;
  topProductos(desde: string, hasta: string, orden: 'mas' | 'menos', limite: number): Promise<ProductoVendido[]>;
  ventasPorCategoria(desde: string, hasta: string): Promise<VentaPorCategoria[]>;
  ventasPorEmpleado(desde: string, hasta: string): Promise<VentaPorEmpleado[]>;
  margenProductos(desde: string, hasta: string, limite: number): Promise<MargenProducto[]>;
}

export const REPORTES_REPOSITORY = 'REPORTES_REPOSITORY';
