import { Inject, Injectable } from '@nestjs/common';
import { REPORTES_REPOSITORY } from '../domain/reportes.repository';
import type { ReportesRepository } from '../domain/reportes.repository';

@Injectable()
export class MargenProductosUseCase {
  constructor(@Inject(REPORTES_REPOSITORY) private readonly reportesRepository: ReportesRepository) {}

  ejecutar(desde: string, hasta: string, limite: number) {
    return this.reportesRepository.margenProductos(desde, hasta, limite);
  }
}
