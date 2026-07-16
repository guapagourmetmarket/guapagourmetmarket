export type EstadoTurno = 'abierto' | 'cerrado';

export interface TurnoCaja {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  abiertoEn: string;
  cerradoEn: string | null;
  efectivoInicial: number;
  efectivoEsperado: number | null;
  efectivoContado: number | null;
  diferencia: number | null;
  notas: string | null;
  estado: EstadoTurno;
  totalVentas: number;
  totalEfectivo: number;
  cantidadVentas: number;
}

export interface NuevoTurno {
  usuarioId: string;
  efectivoInicial: number;
}

export interface DenominacionConteo {
  denominacion: number;
  cantidad: number;
}

export interface CierreTurno {
  efectivoContado: number;
  notas?: string;
  denominaciones?: DenominacionConteo[];
}
