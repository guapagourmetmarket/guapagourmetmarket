import { Inject, Injectable } from '@nestjs/common';
import { AUDITORIA_REPOSITORY } from '../domain/auditoria.repository';
import type { AuditoriaRepository } from '../domain/auditoria.repository';
import { EntradaAuditoria } from '../domain/auditoria.entity';

@Injectable()
export class RegistrarAuditoriaUseCase {
  constructor(@Inject(AUDITORIA_REPOSITORY) private readonly auditoriaRepository: AuditoriaRepository) {}

  // No debe tumbar la acción principal si falla el registro de auditoría
  // (ej. un problema pasajero de conexión) — se registra el error y sigue.
  async ejecutar(entrada: EntradaAuditoria): Promise<void> {
    try {
      await this.auditoriaRepository.registrar(entrada);
    } catch (err) {
      console.error('No se pudo registrar auditoría:', err);
    }
  }
}
