import { Inject, Injectable } from '@nestjs/common';
import { CATEGORIAS_REPOSITORY } from '../domain/categorias.repository';
import type { CategoriasRepository } from '../domain/categorias.repository';

@Injectable()
export class ListarCategoriasUseCase {
  constructor(
    @Inject(CATEGORIAS_REPOSITORY) private readonly categoriasRepository: CategoriasRepository,
  ) {}

  ejecutar() {
    return this.categoriasRepository.listar();
  }
}
