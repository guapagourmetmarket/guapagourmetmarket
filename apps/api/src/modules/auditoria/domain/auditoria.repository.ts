import { EntradaAuditoria, RegistroAuditoria } from './auditoria.entity';

export interface AuditoriaRepository {
  registrar(entrada: EntradaAuditoria): Promise<void>;
  listar(limite: number): Promise<RegistroAuditoria[]>;
}

export const AUDITORIA_REPOSITORY = 'AUDITORIA_REPOSITORY';
