import { Inject, Injectable } from '@nestjs/common';
import { AUDITORIA_REPOSITORY } from '../domain/auditoria.repository';
import type { AuditoriaRepository } from '../domain/auditoria.repository';

@Injectable()
export class ListarAuditoriaUseCase {
  constructor(@Inject(AUDITORIA_REPOSITORY) private readonly auditoriaRepository: AuditoriaRepository) {}

  ejecutar(limite = 200) {
    return this.auditoriaRepository.listar(limite);
  }
}
