import { Inject, Injectable } from '@nestjs/common';
import { CATEGORIAS_REPOSITORY } from '../domain/categorias.repository';
import type { CategoriasRepository } from '../domain/categorias.repository';

@Injectable()
export class EliminarCategoriaUseCase {
  constructor(
    @Inject(CATEGORIAS_REPOSITORY) private readonly categoriasRepository: CategoriasRepository,
  ) {}

  ejecutar(id: string) {
    return this.categoriasRepository.eliminar(id);
  }
}
