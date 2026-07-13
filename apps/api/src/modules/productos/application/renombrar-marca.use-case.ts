import { Inject, Injectable } from '@nestjs/common';
import { MARCAS_REPOSITORY } from '../domain/marcas.repository';
import type { MarcasRepository } from '../domain/marcas.repository';

@Injectable()
export class RenombrarMarcaUseCase {
  constructor(@Inject(MARCAS_REPOSITORY) private readonly marcasRepository: MarcasRepository) {}

  ejecutar(id: string, nombre: string) {
    return this.marcasRepository.renombrar(id, nombre);
  }
}
