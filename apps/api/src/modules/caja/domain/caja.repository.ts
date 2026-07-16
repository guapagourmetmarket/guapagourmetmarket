import { CierreTurno, DenominacionConteo, NuevoTurno, TurnoCaja } from './turno.entity';

export interface CajaRepository {
  obtenerTurnoAbierto(): Promise<TurnoCaja | null>;
  abrir(turno: NuevoTurno): Promise<TurnoCaja>;
  cerrar(id: string, cierre: CierreTurno): Promise<TurnoCaja>;
  listar(): Promise<TurnoCaja[]>;
  obtenerDenominaciones(turnoId: string): Promise<DenominacionConteo[]>;
}

export const CAJA_REPOSITORY = 'CAJA_REPOSITORY';
