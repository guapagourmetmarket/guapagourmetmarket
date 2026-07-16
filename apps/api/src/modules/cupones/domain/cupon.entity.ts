export interface Cupon {
  id: string;
  codigo: string;
  porcentaje: number;
  activo: boolean;
}

export interface NuevoCupon {
  codigo: string;
  porcentaje: number;
}

export interface ResultadoValidacionCupon {
  valido: boolean;
  porcentaje: number | null;
  mensaje: string | null;
}
