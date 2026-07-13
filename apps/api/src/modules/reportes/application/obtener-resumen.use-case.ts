import { Inject, Injectable } from '@nestjs/common';
import { REPORTES_REPOSITORY } from '../domain/reportes.repository';
import type { ReportesRepository } from '../domain/reportes.repository';

@Injectable()
export class ObtenerResumenUseCase {
  constructor(@Inject(REPORTES_REPOSITORY) private readonly reportesRepository: ReportesRepository) {}

  ejecutar() {
    return this.reportesRepository.obtenerResumen();
  }
}
