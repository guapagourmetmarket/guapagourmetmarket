import { Inject, Injectable } from '@nestjs/common';
import { CATEGORIAS_REPOSITORY } from '../domain/categorias.repository';
import type { CategoriasRepository } from '../domain/categorias.repository';

@Injectable()
export class ObtenerOCrearCategoriaUseCase {
  constructor(
    @Inject(CATEGORIAS_REPOSITORY) private readonly categoriasRepository: CategoriasRepository,
  ) {}

  ejecutar(nombre: string) {
    return this.categoriasRepository.obtenerOCrear(nombre);
  }
}
