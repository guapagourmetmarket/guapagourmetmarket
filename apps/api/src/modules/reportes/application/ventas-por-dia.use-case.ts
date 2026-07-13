import { Inject, Injectable } from '@nestjs/common';
import { REPORTES_REPOSITORY } from '../domain/reportes.repository';
import type { ReportesRepository } from '../domain/reportes.repository';

@Injectable()
export class VentasPorDiaUseCase {
  constructor(@Inject(REPORTES_REPOSITORY) private readonly reportesRepository: ReportesRepository) {}

  ejecutar(desde: string, hasta: string) {
    return this.reportesRepository.ventasPorDia(desde, hasta);
  }
}
