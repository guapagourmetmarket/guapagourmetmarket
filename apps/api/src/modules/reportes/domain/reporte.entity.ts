export interface VentaPorDia {
  fecha: string;
  total: number;
  cantidadVentas: number;
}

export interface ProductoVendido {
  productoId: string;
  nombre: string;
  cantidadVendida: number;
  totalVendido: number;
}

export interface VentaPorCategoria {
  categoria: string;
  total: number;
}

export interface VentaPorEmpleado {
  usuarioId: string | null;
  usuario: string;
  total: number;
  cantidadVentas: number;
}

export interface MargenProducto {
  productoId: string;
  nombre: string;
  ingresos: number;
  costo: number;
  margen: number;
  porcentajeMargen: number;
}

export interface ResumenDashboard {
  ventasHoy: number;
  ventasMes: number;
  cantidadVentasHoy: number;
  cantidadVentasMes: number;
}
