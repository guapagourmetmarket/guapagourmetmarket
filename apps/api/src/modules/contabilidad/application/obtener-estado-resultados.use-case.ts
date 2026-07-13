import { Inject, Injectable } from '@nestjs/common';
import { CONTABILIDAD_REPOSITORY } from '../domain/contabilidad.repository';
import type { ContabilidadRepository } from '../domain/contabilidad.repository';

@Injectable()
export class ObtenerEstadoResultadosUseCase {
  constructor(
    @Inject(CONTABILIDAD_REPOSITORY) private readonly contabilidadRepository: ContabilidadRepository,
  ) {}

  ejecutar(desde: string, hasta: string) {
    return this.contabilidadRepository.obtenerEstadoResultados(desde, hasta);
  }
}
